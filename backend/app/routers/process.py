import uuid
import shutil
from pathlib import Path
from typing import Optional

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
    reference_files: Optional[list[UploadFile]] = File(None),
):
    original_paths = [save_upload(f) for f in original_files]

    # For each original: tweak it, detect faces, compare original vs tweaked
    protected_results = []
    tweaked_face_paths: list[tuple[str, str]] = []  # (filename, face_path)

    for orig_path, orig_file in zip(original_paths, original_files):
        tweaked_path = tweaker.tweak(orig_path)

        orig_det = detector.detect_and_extract(str(orig_path))
        tweaked_det = detector.detect_and_extract(str(tweaked_path))

        orig_face = orig_det.get("face_path") or str(orig_path)
        tweaked_face = tweaked_det.get("face_path") or str(tweaked_path)

        protection = comparator.compare(orig_face, tweaked_face)

        name = Path(orig_file.filename or "image.jpg").stem
        ext = Path(orig_file.filename or "image.jpg").suffix

        protected_results.append({
            "original_filename": orig_file.filename,
            "original_url": f"/uploads/{orig_path.name}",
            "tweaked_image_url": f"/uploads/{tweaked_path.name}",
            "download_name": f"{name}_VIE{ext}",
            "original_annotated_url": orig_det.get("annotated_url"),
            "original_face_url": orig_det.get("face_url"),
            "tweaked_annotated_url": tweaked_det.get("annotated_url"),
            "tweaked_face_url": tweaked_det.get("face_url"),
            "protection": protection,
        })

        tweaked_face_paths.append((orig_file.filename or "unknown", tweaked_face))

    # Compare reference images against all tweaked faces
    reference_comparisons = []
    if reference_files:
        for ref_file in reference_files:
            ref_path = save_upload(ref_file)
            ref_det = detector.detect_and_extract(str(ref_path))
            ref_face = ref_det.get("face_path") or str(ref_path)

            comparisons = []
            for tweaked_filename, tweaked_face in tweaked_face_paths:
                result = comparator.compare(ref_face, tweaked_face)
                comparisons.append({
                    "tweaked_filename": tweaked_filename,
                    "deepface": result["deepface"],
                    "insightface": result["insightface"],
                })

            reference_comparisons.append({
                "reference_filename": ref_file.filename,
                "reference_annotated_url": ref_det.get("annotated_url"),
                "reference_face_url": ref_det.get("face_url"),
                "comparisons": comparisons,
            })

    return {
        "protected": protected_results,
        "reference_comparisons": reference_comparisons,
    }
