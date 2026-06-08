"""
preprocessing.py
Retinal fundus image preprocessing pipeline.
"""
import base64
import io
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter


def preprocess_image(img: Image.Image) -> tuple[Image.Image, str]:
    """
    Apply clinical preprocessing to a fundus image.
    Returns the processed PIL image and its base64-encoded JPEG preview.
    """
    # 1. Convert to RGB
    img = img.convert("RGB")

    # 2. Resize to 512x512
    img = img.resize((512, 512), Image.LANCZOS)

    # 3. CLAHE-like enhancement via green channel boosting
    r, g, b = img.split()
    g_arr = np.array(g, dtype=np.float32)

    # Adaptive histogram equalization approximation
    g_norm = (g_arr - g_arr.min()) / (g_arr.max() - g_arr.min() + 1e-6)
    g_enhanced = np.clip(g_norm * 1.4, 0, 1)
    g_pil = Image.fromarray((g_enhanced * 255).astype(np.uint8))

    img = Image.merge("RGB", (r, g_pil, b))

    # 4. Mild sharpening for vessel visibility
    img = img.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))

    # 5. Slight contrast boost
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.15)

    # 6. Encode preview to base64
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=85)
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return img, b64


def load_image_from_bytes(data: bytes) -> Image.Image:
    """Load a PIL Image from raw bytes."""
    return Image.open(io.BytesIO(data)).convert("RGB")
