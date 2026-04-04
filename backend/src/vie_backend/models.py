from pydantic import BaseModel


class DeepFaceResult(BaseModel):
    verified: bool = False
    distance: float = 1.0
    similarity: float = 0.0
    model: str = "unknown"
    threshold: float = 0.0
    error: str | None = None


class InsightFaceResult(BaseModel):
    similarity: float = 0.0
    distance: float = 1.0
    error: str | None = None


class ComparisonItem(BaseModel):
    original_filename: str | None
    original_annotated_url: str | None
    original_face_url: str | None
    tweaked_face_url: str | None
    deepface: DeepFaceResult
    insightface: InsightFaceResult


class ProcessResponse(BaseModel):
    tweaked_image_url: str
    tweaked_annotated_url: str | None
    download_name: str
    comparisons: list[ComparisonItem]
