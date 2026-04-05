import logging
import uuid

import cv2
import numpy as np
import mediapipe as mp
from PIL import Image, ImageOps

from vie_backend.config import UPLOAD_DIR

logger = logging.getLogger(__name__)

# MediaPipe works best with images in this range
_TARGET_SHORT_EDGE = 640
_MAX_LONG_EDGE = 1920


def _load_image_cv2(image_path: str) -> np.ndarray:
    """Load image with correct EXIF orientation via PIL, return as BGR numpy array."""
    pil_img = ImageOps.exif_transpose(Image.open(image_path)).convert("RGB")
    rgb = np.array(pil_img)
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


def _resize_for_detection(img: np.ndarray) -> tuple[np.ndarray, float]:
    """Resize image to a detection-friendly size. Returns (resized, scale_factor)."""
    ih, iw = img.shape[:2]
    short_edge = min(ih, iw)
    long_edge = max(ih, iw)

    if short_edge >= _TARGET_SHORT_EDGE and long_edge <= _MAX_LONG_EDGE:
        return img, 1.0

    if long_edge > _MAX_LONG_EDGE:
        scale = _MAX_LONG_EDGE / long_edge
    elif short_edge < _TARGET_SHORT_EDGE:
        scale = _TARGET_SHORT_EDGE / short_edge
        # Don't upscale beyond max
        if max(ih, iw) * scale > _MAX_LONG_EDGE:
            scale = _MAX_LONG_EDGE / max(ih, iw)
    else:
        return img, 1.0

    resized = cv2.resize(img, (int(iw * scale), int(ih * scale)), interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_LINEAR)
    return resized, scale


class DetectionService:
    """Detects and extracts faces using MediaPipe."""

    def __init__(self):
        self._detectors: dict[tuple[int, float], mp.solutions.face_detection.FaceDetection] = {}

    def _get_detector(self, model_selection: int = 1, min_confidence: float = 0.5):
        key = (model_selection, min_confidence)
        if key not in self._detectors:
            self._detectors[key] = mp.solutions.face_detection.FaceDetection(
                model_selection=model_selection,
                min_detection_confidence=min_confidence,
            )
        return self._detectors[key]

    def _try_detect(self, rgb: np.ndarray) -> list:
        """Try detection with progressively relaxed settings."""
        # 1. Full-range model (model_selection=1), normal confidence
        det = self._get_detector(model_selection=1, min_confidence=0.5)
        results = det.process(rgb)
        if results.detections:
            return results.detections

        # 2. Lower confidence threshold
        det = self._get_detector(model_selection=1, min_confidence=0.3)
        results = det.process(rgb)
        if results.detections:
            return results.detections

        # 3. Short-range model (model_selection=0) — better for close-up faces
        det = self._get_detector(model_selection=0, min_confidence=0.3)
        results = det.process(rgb)
        if results.detections:
            return results.detections

        return []

    def detect_and_extract(self, image_path: str) -> dict:
        """Detect face, draw bounding box, extract face crop.

        Returns dict with:
            - annotated_url: image with green box around face
            - face_url: cropped face image (served URL)
            - face_path: absolute path to face crop (for comparison)
            - bbox: bounding box coordinates
            - error: set if no face found
        """
        img = _load_image_cv2(image_path)
        ih, iw = img.shape[:2]

        # Resize to a detection-friendly size, run detection, map back to original
        resized, scale = _resize_for_detection(img)
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)

        detections = self._try_detect(rgb)

        if not detections:
            logger.warning("No face detected in %s (%dx%d) after all attempts", image_path, iw, ih)
            return {
                "error": "No face detected",
                "annotated_url": None,
                "face_url": None,
                "face_path": None,
            }

        # Use the highest-confidence detection
        detection = max(detections, key=lambda d: d.score[0])
        bbox = detection.location_data.relative_bounding_box

        # bbox is relative (0-1), map to original image dimensions
        x = int(bbox.xmin * iw)
        y = int(bbox.ymin * ih)
        w = int(bbox.width * iw)
        h = int(bbox.height * ih)

        # Draw box on annotated copy
        annotated = img.copy()
        cv2.rectangle(annotated, (x, y), (x + w, y + h), (0, 255, 0), 3)

        # Extract face — tight crop (for DeepFace)
        fx1 = max(0, x)
        fy1 = max(0, y)
        fx2 = min(iw, x + w)
        fy2 = min(ih, y + h)
        face_crop = img[fy1:fy2, fx1:fx2]

        # Padded crop — 50% padding on each side (for InsightFace)
        pad_w = int(w * 0.5)
        pad_h = int(h * 0.5)
        px1 = max(0, x - pad_w)
        py1 = max(0, y - pad_h)
        px2 = min(iw, x + w + pad_w)
        py2 = min(ih, y + h + pad_h)
        face_crop_padded = img[py1:py2, px1:px2]

        # Save all
        uid = uuid.uuid4().hex
        annotated_path = UPLOAD_DIR / f"annotated_{uid}.jpg"
        face_path = UPLOAD_DIR / f"face_{uid}.jpg"
        face_padded_path = UPLOAD_DIR / f"face_padded_{uid}.jpg"
        cv2.imwrite(str(annotated_path), annotated)
        cv2.imwrite(str(face_path), face_crop)
        cv2.imwrite(str(face_padded_path), face_crop_padded)

        return {
            "annotated_url": f"/uploads/{annotated_path.name}",
            "face_url": f"/uploads/{face_path.name}",
            "face_path": str(face_path),
            "face_padded_path": str(face_padded_path),
            "bbox": {"x": x, "y": y, "w": w, "h": h},
        }

    def extract_with_bbox(self, image_path: str, bbox: dict) -> dict:
        """Extract face from an image using a pre-computed bounding box (no detection)."""
        img = _load_image_cv2(image_path)
        ih, iw = img.shape[:2]

        x, y, w, h = bbox["x"], bbox["y"], bbox["w"], bbox["h"]

        # Annotated
        annotated = img.copy()
        cv2.rectangle(annotated, (x, y), (x + w, y + h), (0, 255, 0), 3)

        # Tight crop
        fx1, fy1 = max(0, x), max(0, y)
        fx2, fy2 = min(iw, x + w), min(ih, y + h)
        face_crop = img[fy1:fy2, fx1:fx2]

        # Padded crop (50%)
        pad_w, pad_h = int(w * 0.5), int(h * 0.5)
        px1, py1 = max(0, x - pad_w), max(0, y - pad_h)
        px2, py2 = min(iw, x + w + pad_w), min(ih, y + h + pad_h)
        face_crop_padded = img[py1:py2, px1:px2]

        uid = uuid.uuid4().hex
        annotated_path = UPLOAD_DIR / f"annotated_{uid}.jpg"
        face_path = UPLOAD_DIR / f"face_{uid}.jpg"
        face_padded_path = UPLOAD_DIR / f"face_padded_{uid}.jpg"
        cv2.imwrite(str(annotated_path), annotated)
        cv2.imwrite(str(face_path), face_crop)
        cv2.imwrite(str(face_padded_path), face_crop_padded)

        return {
            "annotated_url": f"/uploads/{annotated_path.name}",
            "face_url": f"/uploads/{face_path.name}",
            "face_path": str(face_path),
            "face_padded_path": str(face_padded_path),
        }
