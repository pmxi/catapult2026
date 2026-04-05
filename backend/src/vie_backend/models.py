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


class ProtectionResult(BaseModel):
    deepface: DeepFaceResult
    insightface: InsightFaceResult


class ProtectedItem(BaseModel):
    original_filename: str | None
    original_url: str
    tweaked_image_url: str
    download_name: str
    original_annotated_url: str | None
    original_face_url: str | None
    tweaked_annotated_url: str | None
    tweaked_face_url: str | None
    protection: ProtectionResult


class ReferenceComparison(BaseModel):
    tweaked_filename: str
    deepface: DeepFaceResult
    insightface: InsightFaceResult


class ReferenceResult(BaseModel):
    reference_filename: str | None
    reference_annotated_url: str | None
    reference_face_url: str | None
    comparisons: list[ReferenceComparison]


class ProcessResponse(BaseModel):
    protected: list[ProtectedItem]
    reference_comparisons: list[ReferenceResult]
