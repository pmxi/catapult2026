import uuid
import shutil
from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from app.services.tweaker import TweakerService
from app.services.comparison import ComparisonService
from app.services.detection import DetectionService

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

tweaker = TweakerService()
comparator = ComparisonService()
detector = DetectionService()


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

    # Detect face in tweaked image
    tweaked_detection = detector.detect_and_extract(str(tweaked_path))

    # Compare extracted face crops
    comparisons = []
    for orig_path, orig_file in zip(original_paths, original_files):
        orig_detection = detector.detect_and_extract(str(orig_path))

        # Use face crops if available, fall back to full images
        compare_img1 = orig_detection.get("face_path") or str(orig_path)
        compare_img2 = tweaked_detection.get("face_path") or str(tweaked_path)
        result = comparator.compare(compare_img1, compare_img2)

        comparisons.append({
            "original_filename": orig_file.filename,
            "original_annotated_url": orig_detection.get("annotated_url"),
            "original_face_url": orig_detection.get("face_url"),
            "tweaked_face_url": tweaked_detection.get("face_url"),
            **result,
        })

    # Build download filename from original target name
    original_name = Path(target_file.filename or "image.jpg").stem
    original_ext = Path(target_file.filename or "image.jpg").suffix
    download_name = f"{original_name}_VIE{original_ext}"

    return {
        "tweaked_image_url": f"/uploads/{tweaked_path.name}",
        "tweaked_annotated_url": tweaked_detection.get("annotated_url"),
        "download_name": download_name,
        "comparisons": comparisons,
    }
