import logging
import uuid
from pathlib import Path

import cv2
from PIL import Image, ImageDraw, ImageFont, ImageOps

from vie_backend.config import UPLOAD_DIR
from vie_backend.services.tweaker_model import FaceTweaker

logger = logging.getLogger(__name__)


class TweakerService:
    """Applies adversarial perturbation to face images using the PrivateVQGAN model."""

    def __init__(self):
        self._face_tweaker = FaceTweaker(shift_radius=0.85, use_mapper=True)

    def tweak(self, image_path: Path) -> Path:
        """Apply adversarial perturbation and save the result.

        Returns the path to the tweaked image.
        """
        try:
            result_bgr = self._face_tweaker.tweak(str(image_path))
        except Exception as e:
            logger.error(
                "Model inference failed for %s: %s — falling back to watermark",
                image_path,
                e,
            )
            return self._fallback_tweak(image_path)

        # Add VIE watermark
        result_rgb = cv2.cvtColor(result_bgr, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(result_rgb)
        self._add_watermark(img)

        ext = image_path.suffix
        tweaked_filename = f"tweaked_{uuid.uuid4().hex}{ext}"
        tweaked_path = UPLOAD_DIR / tweaked_filename
        img.save(tweaked_path)
        return tweaked_path

    def _add_watermark(self, img: Image.Image) -> None:
        draw = ImageDraw.Draw(img)
        font_size = max(16, img.width // 25)
        try:
            font = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size
            )
        except OSError:
            font = ImageFont.load_default(font_size)

        text = "VIE"
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        margin = 10
        x = margin
        y = img.height - text_h - margin

        draw.text((x + 1, y + 1), text, fill=(0, 0, 0), font=font)
        draw.text((x, y), text, fill=(255, 255, 255), font=font)

    def _fallback_tweak(self, image_path: Path) -> Path:
        """Fallback: just copy and watermark if model fails."""
        img = ImageOps.exif_transpose(Image.open(image_path)).convert("RGB")
        self._add_watermark(img)

        ext = image_path.suffix
        tweaked_filename = f"tweaked_{uuid.uuid4().hex}{ext}"
        tweaked_path = UPLOAD_DIR / tweaked_filename
        img.save(tweaked_path)
        return tweaked_path
