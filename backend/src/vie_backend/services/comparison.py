import logging

import numpy as np
import cv2
from deepface import DeepFace
from insightface.app import FaceAnalysis

logger = logging.getLogger(__name__)


class ComparisonService:
    """Compares two face images using DeepFace and InsightFace."""

    def __init__(self):
        self._insightface_app: FaceAnalysis | None = None

    def _get_insightface(self) -> FaceAnalysis:
        if self._insightface_app is None:
            self._insightface_app = FaceAnalysis(
                name="buffalo_l", providers=["CPUExecutionProvider"]
            )
            self._insightface_app.prepare(ctx_id=0, det_size=(640, 640))
        return self._insightface_app

    def _compare_deepface(self, img1_path: str, img2_path: str) -> dict:
        try:
            result = DeepFace.verify(
                img1_path, img2_path, enforce_detection=False
            )
            return {
                "verified": result["verified"],
                "distance": round(result["distance"], 4),
                "similarity": round(1 - result["distance"], 4),
                "model": result["model"],
                "threshold": result["threshold"],
            }
        except Exception as e:
            return {"error": str(e), "similarity": 0, "distance": 1,
                    "verified": False, "model": "unknown", "threshold": 0}

    def _get_insightface_embedding(self, img: np.ndarray) -> np.ndarray | None:
        """Get face embedding, trying multiple strategies if detection fails."""
        app = self._get_insightface()

        # 1. Try as-is
        faces = app.get(img)
        if faces:
            return faces[0].embedding

        # 2. Resize to det_size (640x640) with letterboxing
        h, w = img.shape[:2]
        scale = 640 / max(h, w)
        resized = cv2.resize(img, (int(w * scale), int(h * scale)))
        padded = np.zeros((640, 640, 3), dtype=np.uint8)
        ph, pw = resized.shape[:2]
        y_off = (640 - ph) // 2
        x_off = (640 - pw) // 2
        padded[y_off:y_off + ph, x_off:x_off + pw] = resized

        faces = app.get(padded)
        if faces:
            logger.info("InsightFace detected face after resizing to 640x640")
            return faces[0].embedding

        # 3. Last resort: use the recognition model directly on the whole image
        #    Treat the entire crop as the face region
        rec_model = app.models.get("recognition")
        if rec_model is not None:
            aligned = cv2.resize(img, (112, 112))
            aligned = cv2.cvtColor(aligned, cv2.COLOR_BGR2RGB)
            aligned = np.transpose(aligned, (2, 0, 1)).astype(np.float32)
            aligned = (aligned / 127.5) - 1.0
            aligned = np.expand_dims(aligned, axis=0)
            embedding = rec_model.forward(aligned)
            logger.info("InsightFace used direct recognition model as fallback")
            return embedding.flatten()

        return None

    def _compare_insightface(self, img1_path: str, img2_path: str) -> dict:
        try:
            img1 = cv2.imread(img1_path)
            img2 = cv2.imread(img2_path)

            if img1 is None or img2 is None:
                return {"error": "Could not read image", "similarity": 0, "distance": 1}

            emb1 = self._get_insightface_embedding(img1)
            emb2 = self._get_insightface_embedding(img2)

            if emb1 is None or emb2 is None:
                which = []
                if emb1 is None:
                    which.append("img1")
                if emb2 is None:
                    which.append("img2")
                return {"error": f"No face detected in {', '.join(which)}", "similarity": 0, "distance": 1}

            similarity = float(
                np.dot(emb1, emb2)
                / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
            )
            return {
                "similarity": round(similarity, 4),
                "distance": round(1 - similarity, 4),
            }
        except Exception as e:
            logger.exception("InsightFace comparison failed")
            return {"error": str(e), "similarity": 0, "distance": 1}

    def compare(
        self,
        img1_path: str,
        img2_path: str,
        img1_padded_path: str | None = None,
        img2_padded_path: str | None = None,
    ) -> dict:
        return {
            "deepface": self._compare_deepface(img1_path, img2_path),
            "insightface": self._compare_insightface(
                img1_padded_path or img1_path,
                img2_padded_path or img2_path,
            ),
        }
