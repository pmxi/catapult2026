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
CHECKPOINT_PATH = MODEL_DIR / "last.ckpt"


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
        self._face_detector = None

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

    def _get_face_detector(self):
        if self._face_detector is None:
            import mediapipe as mp
            self._face_detector = mp.solutions.face_detection.FaceDetection(
                model_selection=1, min_detection_confidence=0.3
            )
        return self._face_detector

    def _get_mask(self, img_rgb_512: np.ndarray) -> np.ndarray:
        """Generate face-only mask using MediaPipe face detection.

        Returns float32 mask [0,1] shape (512,512) where 1 = face to tweak.
        Uses an elliptical mask with Gaussian feathering for smooth blending.
        """
        h, w = img_rgb_512.shape[:2]
        detector = self._get_face_detector()
        results = detector.process(img_rgb_512)

        mask = np.zeros((h, w), dtype=np.float32)

        if not results.detections:
            logger.warning("No face detected for masking — tweaking entire image")
            return np.ones((h, w), dtype=np.float32)

        detection = max(results.detections, key=lambda d: d.score[0])
        bbox = detection.location_data.relative_bounding_box

        # Convert relative bbox to pixel coords with some padding
        pad = 0.3
        bx = int(bbox.xmin * w)
        by = int(bbox.ymin * h)
        bw = int(bbox.width * w)
        bh = int(bbox.height * h)

        # Add padding for natural blending
        pad_x = int(bw * pad)
        pad_y = int(bh * pad)
        cx = bx + bw // 2
        cy = by + bh // 2
        rx = bw // 2 + pad_x
        ry = bh // 2 + pad_y

        # Draw filled ellipse
        cv2.ellipse(mask, (cx, cy), (rx, ry), 0, 0, 360, 1.0, -1)

        # Gaussian blur for feathered edges
        ksize = max(31, int(min(rx, ry) * 0.8) | 1)  # odd kernel
        mask = cv2.GaussianBlur(mask, (ksize, ksize), 0)

        # Re-normalize so center is fully 1.0
        if mask.max() > 0:
            mask = mask / mask.max()

        return mask

    def _shift_indices(self, indices: torch.Tensor, model: VQVAE) -> torch.Tensor:
        """Shift quantized indices on the codebook grid using bilinear sampling."""
        grid_size = model.quantizer.grid_size
        embedding_dim = model.quantizer.embedding_dim

        y_coords = (indices // grid_size).float()
        x_coords = (indices % grid_size).float()

        # Random shift direction
        shift_y = (torch.rand(1, device=self.device) * 2.0 - 1.0) * self.shift_radius
        shift_x = (torch.rand(1, device=self.device) * 2.0 - 1.0) * self.shift_radius

        target_y = (y_coords + shift_y) % grid_size
        target_x = (x_coords + shift_x) % grid_size

        # Bilinear sampling from the codebook grid
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

        Args:
            image_path: Path to the input image.

        Returns:
            BGR numpy array of the tweaked image at original resolution.
        """
        model = self._load_model()

        # Load and prepare image
        pil_img = ImageOps.exif_transpose(Image.open(image_path)).convert("RGB")
        orig_w, orig_h = pil_img.size
        img_512 = pil_img.resize((512, 512), Image.LANCZOS)
        img_rgb_512 = np.array(img_512)

        # Get face mask (1 = face to tweak, 0 = background to keep)
        mask_np = self._get_mask(img_rgb_512)

        # To tensor [0, 1]
        x = torch.from_numpy(img_rgb_512).float().permute(2, 0, 1).unsqueeze(0) / 255.0
        mask_t = torch.from_numpy(mask_np).float().unsqueeze(0).unsqueeze(0)

        x = x.to(self.device)
        mask_t = mask_t.to(self.device)

        # Encode → quantize → shift → decode
        z_e = model.encode(x)
        _, indices = model.quantize(z_e)
        z_shifted = self._shift_indices(indices, model)
        x_shifted = model.decode(z_shifted)

        # Blend: face region from shifted, background from original
        final = mask_t * x_shifted + (1.0 - mask_t) * x
        final = torch.clamp(final, 0, 1)

        # Back to numpy BGR at original resolution
        result_rgb = (final.squeeze(0).permute(1, 2, 0).cpu().numpy() * 255).astype(np.uint8)
        result_bgr = cv2.cvtColor(result_rgb, cv2.COLOR_RGB2BGR)

        if (orig_w, orig_h) != (512, 512):
            result_bgr = cv2.resize(result_bgr, (orig_w, orig_h), interpolation=cv2.INTER_LANCZOS4)

        return result_bgr
