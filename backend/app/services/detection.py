import cv2
from insightface.app import FaceAnalysis


class DetectionService:
    """Detects faces in images using InsightFace."""

    def __init__(self):
        self._app: FaceAnalysis | None = None

    def _get_app(self) -> FaceAnalysis:
        if self._app is None:
            self._app = FaceAnalysis(
                name="buffalo_l", providers=["CPUExecutionProvider"]
            )
            self._app.prepare(ctx_id=0, det_size=(640, 640))
        return self._app

    def detect_faces(self, image_path: str) -> list[dict]:
        app = self._get_app()
        img = cv2.imread(image_path)
        faces = app.get(img)
        return [
            {
                "bbox": face.bbox.tolist(),
                "score": float(face.det_score),
            }
            for face in faces
        ]
