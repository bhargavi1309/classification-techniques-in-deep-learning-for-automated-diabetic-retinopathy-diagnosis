"""
classifier.py
Simulated EfficientNet-B4 DR classifier.
Produces realistic grade predictions based on image statistics.
Replace `classify_image()` with real PyTorch / TensorFlow inference for production.
"""
import numpy as np
from PIL import Image

GRADE_LABELS = [
    "No DR",
    "Mild NPDR",
    "Moderate NPDR",
    "Severe NPDR",
    "Proliferative DR",
]

RECOMMENDATIONS = [
    "No diabetic retinopathy detected. Routine annual screening recommended.",
    "Mild NPDR detected. Optimize glycaemic control. Repeat screening in 12 months.",
    "Moderate NPDR detected. Refer to ophthalmologist within 6 months.",
    "Severe NPDR detected. Urgent referral to ophthalmologist within 1 month.",
    "Proliferative DR detected. URGENT — Risk of severe vision loss. Immediate referral required.",
]

GRADE_COLORS = ["#22c55e", "#84cc16", "#f59e0b", "#f97316", "#ef4444"]


def _extract_features(img: Image.Image) -> np.ndarray:
    """Extract image statistics used for simulated classification."""
    img_rgb = img.convert("RGB").resize((224, 224))
    arr = np.array(img_rgb, dtype=np.float32) / 255.0

    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    features = [
        np.mean(r), np.mean(g), np.mean(b),
        np.std(r),  np.std(g),  np.std(b),
        np.mean(g) / (np.mean(r) + 1e-6),        # green dominance (retinal vessels)
        np.percentile(arr, 90) - np.percentile(arr, 10),  # dynamic range
        np.var(arr),                              # texture variance
        np.mean(arr > 0.85),                      # bright lesion ratio (exudates)
        np.mean(arr < 0.15),                      # dark lesion ratio (hemorrhages)
    ]
    return np.array(features)


def _features_to_grade(features: np.ndarray, seed: int) -> tuple[int, np.ndarray]:
    """
    Map image features to a DR grade using a deterministic heuristic,
    producing a realistic confidence distribution.
    """
    rng = np.random.default_rng(seed)

    # Use image variance and lesion ratios as grade signals
    # Normalized lesion scoring: only high ratios of dark/bright pixels indicate pathology
    lesion_score = max(0, features[10] - 0.05) * 20 + max(0, features[9] - 0.10) * 15 + max(0, features[8] - 0.02) * 10
    base_grade = max(0, min(4, int(lesion_score * 5)))

    # Add small noise for variability
    noise = rng.integers(-1, 2)
    grade = max(0, min(4, base_grade + noise))

    # Build softmax-style confidence scores centred on predicted grade
    raw = rng.exponential(scale=0.3, size=5)
    raw[grade] += 2.5 + rng.uniform(0, 0.5)
    confidence_scores = raw / raw.sum()
    confidence_scores = np.clip(confidence_scores, 0.02, 0.95)
    confidence_scores /= confidence_scores.sum()

    return grade, confidence_scores


def classify_image(img: Image.Image) -> dict:
    """
    Classify a retinal fundus image and return grade + confidence scores.

    Returns
    -------
    dict with keys:
        grade          – int 0-4
        label          – severity string
        confidence     – float (confidence for predicted grade)
        scores         – list of 5 floats (confidence per grade)
        recommendation – clinical action string
        color          – hex color code for the grade
    """
    features = _extract_features(img)
    # Use image hash as seed for reproducible results per image
    image_bytes = img.convert("L").resize((16, 16)).tobytes()
    seed = int.from_bytes(image_bytes[:4], "big") % (2**31)

    grade, scores = _features_to_grade(features, seed)

    return {
        "grade": int(grade),
        "label": GRADE_LABELS[grade],
        "confidence": round(float(scores[grade]), 4),
        "scores": [round(float(s), 4) for s in scores],
        "recommendation": RECOMMENDATIONS[grade],
        "color": GRADE_COLORS[grade],
        "grade_labels": GRADE_LABELS,
    }
