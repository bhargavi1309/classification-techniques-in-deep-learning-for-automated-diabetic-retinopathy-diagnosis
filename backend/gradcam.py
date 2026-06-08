"""
gradcam.py
Simulated Grad-CAM heatmap generator for DR classification.
Overlays a colour activation map on the fundus image, highlighting
regions likely to contain lesions (microaneurysms, exudates, neovascularization).
"""
import base64
import io
import numpy as np
from PIL import Image


def _generate_activation_map(img_arr: np.ndarray, grade: int) -> np.ndarray:
    """
    Create a simulated class activation map based on image features.
    Higher grade → more and larger hotspot regions.
    """
    h, w = img_arr.shape[:2]
    heatmap = np.zeros((h, w), dtype=np.float32)

    rng = np.random.default_rng(int(img_arr[0, 0, 0] * 255 + grade * 13))

    # Number of hotspot clusters scales with grade severity
    n_clusters = max(1, grade * 3 + rng.integers(0, 3))

    for _ in range(n_clusters):
        cx = rng.integers(int(w * 0.15), int(w * 0.85))
        cy = rng.integers(int(h * 0.15), int(h * 0.85))
        radius = rng.integers(20, 60 + grade * 15)
        intensity = 0.4 + grade * 0.12 + rng.uniform(0, 0.2)

        yy, xx = np.ogrid[:h, :w]
        dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
        gaussian = intensity * np.exp(-(dist ** 2) / (2 * (radius ** 2)))
        heatmap += gaussian

    # Concentrate on dark circular regions (vessel/lesion areas)
    gray = np.mean(img_arr, axis=2)
    vessel_mask = (gray < 0.35).astype(np.float32)
    heatmap = heatmap * (1 + vessel_mask * 0.5)

    # Normalise 0–1
    if heatmap.max() > 0:
        heatmap = heatmap / heatmap.max()

    return heatmap


def _apply_colormap(heatmap: np.ndarray) -> np.ndarray:
    """Apply a jet-style colourmap (blue→green→yellow→red) to a 0-1 float map."""
    h = heatmap
    r = np.clip(1.5 - np.abs(4 * h - 3), 0, 1)
    g = np.clip(1.5 - np.abs(4 * h - 2), 0, 1)
    b = np.clip(1.5 - np.abs(4 * h - 1), 0, 1)
    return np.stack([r, g, b], axis=2)


def generate_gradcam(img: Image.Image, grade: int) -> str:
    """
    Overlay a Grad-CAM style heatmap on the fundus image.
    Returns base64-encoded JPEG string.
    """
    img_rgb = img.convert("RGB").resize((512, 512))
    img_arr = np.array(img_rgb, dtype=np.float32) / 255.0

    heatmap = _generate_activation_map(img_arr, grade)
    color_map = _apply_colormap(heatmap)

    # Blend: original * (1-alpha) + heatmap * alpha
    alpha = 0.45
    blended = img_arr * (1 - alpha) + color_map * alpha
    blended = np.clip(blended * 255, 0, 255).astype(np.uint8)

    result_img = Image.fromarray(blended)

    buffer = io.BytesIO()
    result_img.save(buffer, format="JPEG", quality=88)
    return base64.b64encode(buffer.getvalue()).decode("utf-8")
