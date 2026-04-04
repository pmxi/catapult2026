import uuid
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

UPLOAD_DIR = Path("uploads")


class TweakerService:
    """Applies adversarial perturbation to face images.

    Currently a stub that returns the original image unchanged.
    Will be replaced with actual adversarial encoding logic.
    """

    def tweak(self, image_path: Path) -> Path:
        # TODO: Replace with adversarial perturbation model
        # For now, just copy the image and add VIE watermark
        img = ImageOps.exif_transpose(Image.open(image_path)).convert("RGB")

        draw = ImageDraw.Draw(img)
        font_size = max(16, img.width // 25)
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
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

        ext = image_path.suffix
        tweaked_filename = f"tweaked_{uuid.uuid4().hex}{ext}"
        tweaked_path = UPLOAD_DIR / tweaked_filename
        img.save(tweaked_path)
        return tweaked_path
