import shutil
import uuid
from pathlib import Path

UPLOAD_DIR = Path("uploads")


class TweakerService:
    """Applies adversarial perturbation to face images.

    Currently a stub that returns the original image unchanged.
    Will be replaced with actual adversarial encoding logic.
    """

    def tweak(self, image_path: Path) -> Path:
        # TODO: Replace with adversarial perturbation model
        # For now, just copy the image as-is
        ext = image_path.suffix
        tweaked_filename = f"tweaked_{uuid.uuid4().hex}{ext}"
        tweaked_path = UPLOAD_DIR / tweaked_filename
        shutil.copy2(image_path, tweaked_path)
        return tweaked_path
