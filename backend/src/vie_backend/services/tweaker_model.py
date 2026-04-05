"""
PrivateVQGAN inference module.

Loads the trained VQVAE from last.ckpt and applies identity-shifting
adversarial perturbation to face images. Uses MediaPipe face detection
to mask and blend only the face region.
"""

import logging
import math
from pathlib import Path

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image, ImageOps

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parent.parent.parent.parent / "model"
CHECKPOINT_PATH = MODEL_DIR / "vqgan-step=030000.ckpt"
SEGMENTER_PATH = MODEL_DIR / "selfie_segmenter.tflite"


# ── Model architecture (inference-only, extracted from vqvae.py) ──


class ResidualBlock(nn.Module):
    def __init__(self, channels: int):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(channels, channels, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(channels),
            nn.ReLU(),
            nn.Conv2d(channels, channels, kernel_size=3, stride=1, padding=1),
            nn.BatchNorm2d(channels),
        )

    def forward(self, x):
        return F.relu(x + self.block(x))


class VectorQuantizer(nn.Module):
    def __init__(self, num_embeddings: int = 1024, embedding_dim: int = 256):
        super().__init__()
        self.grid_size = int(math.sqrt(num_embeddings))
        self.num_embeddings = self.grid_size ** 2
        self.embedding_dim = embedding_dim
        self.embedding = nn.Embedding(self.num_embeddings, self.embedding_dim)

    def forward(self, z_e):
        z_e = z_e.permute(0, 2, 3, 1).contiguous()
        input_shape = z_e.shape

        flat_z_e = F.normalize(z_e.view(-1, self.embedding_dim), p=2, dim=-1)

        with torch.no_grad():
            norm_weight = F.normalize(self.embedding.weight, p=2, dim=-1)
            distances = 2.0 - 2.0 * torch.matmul(flat_z_e, norm_weight.t())
            encoding_indices = torch.argmin(distances, dim=1).unsqueeze(1)

        norm_weight = F.normalize(self.embedding.weight, p=2, dim=-1)
        z_q = norm_weight[encoding_indices.view(-1)].view(input_shape)

        z_q = z_q.permute(0, 3, 1, 2).contiguous()
        indices = encoding_indices.view(input_shape[0], input_shape[1], input_shape[2])
        return z_q, indices


class VQVAE(nn.Module):
    def __init__(self, embedding_dim: int = 256, num_embeddings: int = 2048):
        super().__init__()
        self.embedding_dim = embedding_dim
        self.num_embeddings = num_embeddings

        self.encoder = nn.Sequential(
            nn.Conv2d(3, 64, 4, 2, 1),
            nn.ReLU(),
            nn.Conv2d(64, 128, 4, 2, 1),
            nn.ReLU(),
            nn.Conv2d(128, 256, 4, 2, 1),
            nn.ReLU(),
            nn.Conv2d(256, embedding_dim, 4, 2, 1),
            nn.ReLU(),
            nn.Conv2d(embedding_dim, embedding_dim, 3, 1, 1),
            ResidualBlock(embedding_dim),
            ResidualBlock(embedding_dim),
        )

        self.quantizer = VectorQuantizer(
            num_embeddings=num_embeddings, embedding_dim=embedding_dim
        )

        self.decoder = nn.Sequential(
            nn.Conv2d(embedding_dim, embedding_dim, 3, 1, 1),
            ResidualBlock(embedding_dim),
            ResidualBlock(embedding_dim),
            nn.ConvTranspose2d(embedding_dim, 256, 4, 2, 1),
            nn.ReLU(),
            nn.ConvTranspose2d(256, 128, 4, 2, 1),
            nn.ReLU(),
            nn.ConvTranspose2d(128, 64, 4, 2, 1),
            nn.ReLU(),
            nn.ConvTranspose2d(64, 3, 4, 2, 1),
            nn.Sigmoid(),
        )

    def encode(self, x):
        return self.encoder(x)

    def quantize(self, z_e):
        return self.quantizer(z_e)

    def decode(self, z_q):
        return self.decoder(z_q)

    def forward(self, x):
        z_e = self.encode(x)
        z_q, indices = self.quantize(z_e)
        x_recon = self.decode(z_q)
        return x_recon, indices


# ── Inference wrapper ──


class FaceTweaker:
    """Loads the VQVAE checkpoint and applies adversarial face perturbation."""

    def __init__(self, shift_radius: float = 6.0):
        self.shift_radius = shift_radius
        self.device = torch.device("cpu")
        self._model: VQVAE | None = None
        self._detector_service = None
        self._segmenter = None

    def _load_model(self) -> VQVAE:
        if self._model is not None:
            return self._model

        logger.info("Loading VQVAE from %s", CHECKPOINT_PATH)
        model = VQVAE(embedding_dim=256, num_embeddings=2048)

        ckpt = torch.load(str(CHECKPOINT_PATH), map_location="cpu")
        state_dict = ckpt["state_dict"]

        # Checkpoint keys are prefixed with "model._orig_mod." (from torch.compile)
        # Strip that prefix to match our model's keys
        clean_state = {}
        prefix = "model._orig_mod."
        for k, v in state_dict.items():
            if k.startswith(prefix):
                clean_key = k[len(prefix):]
                clean_state[clean_key] = v

        model.load_state_dict(clean_state, strict=True)
        model.eval()
        model.to(self.device)
        self._model = model
        logger.info("VQVAE loaded successfully (%d parameters)", sum(p.numel() for p in model.parameters()))
        return model

    def _get_detector_service(self):
        if self._detector_service is None:
            from vie_backend.services.detection import DetectionService, _resize_for_detection
            self._detector_service = DetectionService()
            self._resize_for_detection = _resize_for_detection
        return self._detector_service

    def _detect_face_bbox(self, img_rgb: np.ndarray) -> tuple[int, int, int, int] | None:
        """Detect face using the same progressive fallback as DetectionService.

        Returns (x, y, w, h) with asymmetric padding (extra on top for hair).
        """
        h, w = img_rgb.shape[:2]
        svc = self._get_detector_service()

        # Resize for optimal detection (same as detection service)
        resized, _scale = self._resize_for_detection(
            cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
        )
        rgb_resized = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)

        detections = svc._try_detect(rgb_resized)

        if not detections:
            return None

        detection = max(detections, key=lambda d: d.score[0])
        bbox = detection.location_data.relative_bounding_box

        # bbox is relative — map to original image dimensions
        bx = int(bbox.xmin * w)
        by = int(bbox.ymin * h)
        bw = int(bbox.width * w)
        bh = int(bbox.height * h)

        # Asymmetric padding: 70% top (hair), 20% sides, 0% bottom (cut at chin)
        pad_left = int(bw * 0.2)
        pad_right = int(bw * 0.2)
        pad_top = int(bh * 0.7)
        pad_bottom = 0

        x1 = max(0, bx - pad_left)
        y1 = max(0, by - pad_top)
        x2 = min(w, bx + bw + pad_right)
        y2 = min(h, by + bh + pad_bottom)

        return x1, y1, x2 - x1, y2 - y1

    def _letterbox(self, face_crop: np.ndarray) -> tuple[np.ndarray, tuple[int, int, int, int]]:
        """Place face crop centered on a 512x512 black canvas using PIL for high-quality resize.

        Returns:
            canvas: 512x512 RGB numpy array
            placement: (x_offset, y_offset, resized_w, resized_h) for extraction later
        """
        pil_crop = Image.fromarray(face_crop)
        cw, ch = pil_crop.size
        scale = 512 / max(ch, cw)
        rw = int(cw * scale)
        rh = int(ch * scale)
        resized = pil_crop.resize((rw, rh), Image.LANCZOS)

        canvas = Image.new("RGB", (512, 512), (0, 0, 0))
        x_off = (512 - rw) // 2
        y_off = (512 - rh) // 2
        canvas.paste(resized, (x_off, y_off))

        return np.array(canvas), (x_off, y_off, rw, rh)

    def _get_face_mesh(self):
        if self._segmenter is None:
            import mediapipe as mp
            self._segmenter = mp.solutions.face_mesh.FaceMesh(
                static_image_mode=True, max_num_faces=1, min_detection_confidence=0.3
            )
        return self._segmenter

    # Face oval landmark indices from MediaPipe (traces jawline + forehead)
    _FACE_OVAL = [
        10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
        397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
        172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
    ]

    def _make_face_mask(self, canvas_rgb: np.ndarray) -> np.ndarray:
        """Create a face-only mask using MediaPipe Face Mesh.

        Uses the face oval contour landmarks for the face boundary,
        then extends upward to capture hair. Excludes neck, clothes,
        and background.

        Returns float32 mask (512,512) where 1 = face+hair, 0 = everything else.
        """
        h, w = canvas_rgb.shape[:2]
        mesh = self._get_face_mesh()
        results = mesh.process(canvas_rgb)

        if not results.multi_face_landmarks:
            logger.warning("Face mesh failed on canvas — falling back to full placement mask")
            return np.ones((h, w), dtype=np.float32)

        landmarks = results.multi_face_landmarks[0]

        # Get face oval polygon points
        points = []
        for idx in self._FACE_OVAL:
            lm = landmarks.landmark[idx]
            points.append([int(lm.x * w), int(lm.y * h)])

        points = np.array(points, dtype=np.int32)

        # Find the topmost points (forehead) and extend them upward for hair
        top_y = points[:, 1].min()
        bottom_y = points[:, 1].max()
        face_height = bottom_y - top_y
        hair_extension = int(face_height * 0.5)

        # Extend points that are in the top third upward
        top_threshold = top_y + face_height * 0.3
        extended_points = points.copy()
        for i in range(len(extended_points)):
            if extended_points[i][1] < top_threshold:
                extended_points[i][1] = max(0, extended_points[i][1] - hair_extension)

        # Create filled polygon mask
        mask = np.zeros((h, w), dtype=np.float32)
        cv2.fillPoly(mask, [extended_points], 1.0)

        # Feather edges for smooth blending
        mask = cv2.GaussianBlur(mask, (21, 21), 0)
        if mask.max() > 0:
            mask = mask / mask.max()

        return mask

    def _shift_indices(self, indices: torch.Tensor, model: VQVAE) -> torch.Tensor:
        """Shift quantized indices on the codebook grid using bilinear sampling."""
        grid_size = model.quantizer.grid_size
        embedding_dim = model.quantizer.embedding_dim

        y_coords = (indices // grid_size).float()
        x_coords = (indices % grid_size).float()

        shift_y = (torch.rand(1, device=self.device) * 2.0 - 1.0) * self.shift_radius
        shift_x = (torch.rand(1, device=self.device) * 2.0 - 1.0) * self.shift_radius

        target_y = (y_coords + shift_y) % grid_size
        target_x = (x_coords + shift_x) % grid_size

        norm_weight = F.normalize(model.quantizer.embedding.weight, p=2, dim=-1)
        codebook_weights = norm_weight.view(1, grid_size, grid_size, embedding_dim)
        codebook_weights = codebook_weights.permute(0, 3, 1, 2)

        norm_y = 2.0 * target_y / (grid_size - 1) - 1.0
        norm_x = 2.0 * target_x / (grid_size - 1) - 1.0
        sampling_grid = torch.stack([norm_x, norm_y], dim=-1)

        z_shifted = F.grid_sample(
            codebook_weights.expand(indices.size(0), -1, -1, -1),
            sampling_grid,
            mode="bilinear",
            padding_mode="reflection",
            align_corners=True,
        )
        return z_shifted

    @torch.no_grad()
    def tweak(self, image_path: str) -> np.ndarray:
        """Apply adversarial perturbation to a face image.

        Pipeline:
        1. Detect face → crop with asymmetric padding (extra top for hair)
        2. Letterbox crop onto 512x512 black canvas
        3. Segment face/head from background using selfie segmenter
        4. VQVAE: encode → shift → decode
        5. Blend shifted with original crop using segmentation mask
        6. Extract face region from canvas, resize, paste back

        Returns:
            BGR numpy array of the tweaked image at original resolution.
        """
        model = self._load_model()

        # Load original image
        pil_img = ImageOps.exif_transpose(Image.open(image_path)).convert("RGB")
        orig_rgb = np.array(pil_img)
        orig_h, orig_w = orig_rgb.shape[:2]

        # Step 1: Detect face bounding box
        face_bbox = self._detect_face_bbox(orig_rgb)
        if face_bbox is None:
            logger.warning("No face detected in %s — returning original", image_path)
            return cv2.cvtColor(orig_rgb, cv2.COLOR_RGB2BGR)

        bx, by, bw, bh = face_bbox

        # Crop face region (with padding for hair)
        face_crop = orig_rgb[by:by + bh, bx:bx + bw].copy()

        # Step 2: Letterbox onto 512x512
        canvas, placement = self._letterbox(face_crop)

        # Step 3: Segment face/head from background on the canvas
        mask_np = self._make_face_mask(canvas)

        # Step 4: Run through VQVAE
        x = torch.from_numpy(canvas).float().permute(2, 0, 1).unsqueeze(0) / 255.0
        mask_t = torch.from_numpy(mask_np).float().unsqueeze(0).unsqueeze(0)
        x = x.to(self.device)
        mask_t = mask_t.to(self.device)

        z_e = model.encode(x)
        _, indices = model.quantize(z_e)
        z_shifted = self._shift_indices(indices, model)
        x_shifted = model.decode(z_shifted)

        # Step 5: Blend — face from shifted, rest from original canvas
        final = mask_t * x_shifted + (1.0 - mask_t) * x
        final = torch.clamp(final, 0, 1)

        result_512 = (final.squeeze(0).permute(1, 2, 0).cpu().numpy() * 255).astype(np.uint8)

        # Step 6: Extract the face region from the 512x512 result
        x_off, y_off, rw, rh = placement
        tweaked_face_resized = result_512[y_off:y_off + rh, x_off:x_off + rw]

        # Resize back to original crop dimensions using PIL LANCZOS
        pil_tweaked = Image.fromarray(tweaked_face_resized)
        pil_tweaked = pil_tweaked.resize((bw, bh), Image.LANCZOS)
        tweaked_face = np.array(pil_tweaked)

        # Paste back into original image
        result_rgb = orig_rgb.copy()
        result_rgb[by:by + bh, bx:bx + bw] = tweaked_face

        return cv2.cvtColor(result_rgb, cv2.COLOR_RGB2BGR)
