import logging
import uuid
import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, UploadFile

from vie_backend.config import UPLOAD_DIR
from vie_backend.services.tweaker import TweakerService
from vie_backend.services.comparison import ComparisonService
from vie_backend.services.detection import DetectionService

logger = logging.getLogger("vie_backend")

router = APIRouter()

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

    # For each original: detect face, tweak, extract tweaked face using same bbox, compare
    protected_results = []
    # Only images with detected faces participate in reference comparisons
    tweaked_face_paths: list[tuple[str, str, str]] = []  # (filename, face_path, face_padded_path)

    for orig_path, orig_file in zip(original_paths, original_files):
        tweaked_path = tweaker.tweak(orig_path)
        name = Path(orig_file.filename or "image.jpg").stem
        ext = Path(orig_file.filename or "image.jpg").suffix

        orig_det = detector.detect_and_extract(str(orig_path))

        # No face detected — skip comparison, no download
        if orig_det.get("error"):
            logger.warning("Face detection failed on %s: %s", orig_file.filename, orig_det["error"])
            protected_results.append({
                "original_filename": orig_file.filename,
                "original_url": f"/uploads/{orig_path.name}",
                "tweaked_image_url": f"/uploads/{tweaked_path.name}",
                "download_name": f"{name}_VIE{ext}",
                "skipped": True,
                "skip_reason": "No face detected",
                "protection": None,
            })
            continue

        # Reuse the same bbox on the tweaked image (no re-detection needed)
        tweaked_det = detector.extract_with_bbox(str(tweaked_path), orig_det["bbox"])

        protection = comparator.compare(
            orig_det["face_path"], tweaked_det["face_path"],
            img1_padded_path=orig_det["face_padded_path"],
            img2_padded_path=tweaked_det["face_padded_path"],
        )

        protected_results.append({
            "original_filename": orig_file.filename,
            "original_url": f"/uploads/{orig_path.name}",
            "tweaked_image_url": f"/uploads/{tweaked_path.name}",
            "download_name": f"{name}_VIE{ext}",
            "skipped": False,
            "original_annotated_url": orig_det.get("annotated_url"),
            "original_face_url": orig_det.get("face_url"),
            "tweaked_annotated_url": tweaked_det.get("annotated_url"),
            "tweaked_face_url": tweaked_det.get("face_url"),
            "protection": protection,
        })

        tweaked_face_paths.append((
            orig_file.filename or "unknown",
            tweaked_det["face_path"],
            tweaked_det["face_padded_path"],
        ))

    # Compare reference images against all tweaked faces (only those with detected faces)
    reference_comparisons = []
    if reference_files:
        for ref_file in reference_files:
            ref_path = save_upload(ref_file)
            ref_det = detector.detect_and_extract(str(ref_path))

            # No face in reference — skip entirely
            if ref_det.get("error"):
                logger.warning("Face detection failed on reference %s: %s", ref_file.filename, ref_det["error"])
                reference_comparisons.append({
                    "reference_filename": ref_file.filename,
                    "skipped": True,
                    "skip_reason": "No face detected",
                    "comparisons": [],
                })
                continue

            comparisons = []
            for tweaked_filename, tweaked_face, tweaked_face_padded in tweaked_face_paths:
                result = comparator.compare(
                    ref_det["face_path"], tweaked_face,
                    img1_padded_path=ref_det["face_padded_path"],
                    img2_padded_path=tweaked_face_padded,
                )
                comparisons.append({
                    "tweaked_filename": tweaked_filename,
                    "deepface": result["deepface"],
                    "insightface": result["insightface"],
                })

            reference_comparisons.append({
                "reference_filename": ref_file.filename,
                "reference_annotated_url": ref_det.get("annotated_url"),
                "reference_face_url": ref_det.get("face_url"),
                "skipped": False,
                "comparisons": comparisons,
            })

    return {
        "protected": protected_results,
        "reference_comparisons": reference_comparisons,
    }
