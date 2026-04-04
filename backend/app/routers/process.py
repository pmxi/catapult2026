import uuid
import shutil
from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from app.services.tweaker import TweakerService
from app.services.comparison import ComparisonService

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

tweaker = TweakerService()
comparator = ComparisonService()


def save_upload(file: UploadFile) -> Path:
    ext = Path(file.filename or "image.jpg").suffix
    filename = f"{uuid.uuid4().hex}{ext}"
    path = UPLOAD_DIR / filename
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return path


@router.post("/process")
async def process_images(
    original_files: list[UploadFile] = File(...),
    target_file: UploadFile = File(...),
):
    # Save uploaded files
    original_paths = [save_upload(f) for f in original_files]
    target_path = save_upload(target_file)

    # Tweak the target image (stub — returns original for now)
    tweaked_path = tweaker.tweak(target_path)

    # Compare tweaked image against each original
    comparisons = []
    for orig_path, orig_file in zip(original_paths, original_files):
        result = comparator.compare(str(orig_path), str(tweaked_path))
        comparisons.append({
            "original_filename": orig_file.filename,
            **result,
        })

    return {
        "tweaked_image_url": f"/uploads/{tweaked_path.name}",
        "comparisons": comparisons,
    }
