import uuid

import cv2
import numpy as np
import mediapipe as mp
from PIL import Image, ImageOps

from vie_backend.config import UPLOAD_DIR


def _load_image_cv2(image_path: str) -> np.ndarray:
    """Load image with correct EXIF orientation via PIL, return as BGR numpy array."""
    pil_img = ImageOps.exif_transpose(Image.open(image_path)).convert("RGB")
    rgb = np.array(pil_img)
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


class DetectionService:
    """Detects and extracts faces using MediaPipe."""

    def __init__(self):
        self._detector = None

    def _get_detector(self):
        if self._detector is None:
            self._detector = mp.solutions.face_detection.FaceDetection(
                model_selection=1, min_detection_confidence=0.5
            )
        return self._detector

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

        detector = self._get_detector()
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = detector.process(rgb)

        if not results.detections:
            return {
                "error": "No face detected",
                "annotated_url": None,
                "face_url": None,
                "face_path": None,
            }

        # Use the highest-confidence detection
        detection = max(results.detections, key=lambda d: d.score[0])
        bbox = detection.location_data.relative_bounding_box

        x = int(bbox.xmin * iw)
        y = int(bbox.ymin * ih)
        w = int(bbox.width * iw)
        h = int(bbox.height * ih)

        # Draw box on annotated copy
        annotated = img.copy()
        cv2.rectangle(annotated, (x, y), (x + w, y + h), (0, 255, 0), 3)

        # Extract face — tight crop, no padding
        fx1 = max(0, x)
        fy1 = max(0, y)
        fx2 = min(iw, x + w)
        fy2 = min(ih, y + h)
        face_crop = img[fy1:fy2, fx1:fx2]

        # Save both
        uid = uuid.uuid4().hex
        annotated_path = UPLOAD_DIR / f"annotated_{uid}.jpg"
        face_path = UPLOAD_DIR / f"face_{uid}.jpg"
        cv2.imwrite(str(annotated_path), annotated)
        cv2.imwrite(str(face_path), face_crop)

        return {
            "annotated_url": f"/uploads/{annotated_path.name}",
            "face_url": f"/uploads/{face_path.name}",
            "face_path": str(face_path),
            "bbox": {"x": x, "y": y, "w": w, "h": h},
        }
