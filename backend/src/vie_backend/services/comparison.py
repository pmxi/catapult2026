import numpy as np
import cv2
from deepface import DeepFace
from insightface.app import FaceAnalysis


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

    def _compare_insightface(self, img1_path: str, img2_path: str) -> dict:
        try:
            app = self._get_insightface()
            img1 = cv2.imread(img1_path)
            img2 = cv2.imread(img2_path)

            faces1 = app.get(img1)
            faces2 = app.get(img2)

            if not faces1 or not faces2:
                return {"error": "No face detected", "similarity": 0, "distance": 1}

            emb1 = faces1[0].embedding
            emb2 = faces2[0].embedding
            similarity = float(
                np.dot(emb1, emb2)
                / (np.linalg.norm(emb1) * np.linalg.norm(emb2))
            )
            return {
                "similarity": round(similarity, 4),
                "distance": round(1 - similarity, 4),
            }
        except Exception as e:
            return {"error": str(e), "similarity": 0, "distance": 1}

    def compare(self, img1_path: str, img2_path: str) -> dict:
        return {
            "deepface": self._compare_deepface(img1_path, img2_path),
            "insightface": self._compare_insightface(img1_path, img2_path),
        }
