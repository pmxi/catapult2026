"""
PrivateVQGAN inference module.

Loads the trained VQGAN + LatentMapper from checkpoints and applies
identity-shifting adversarial perturbation to face images.
Uses MediaPipe face detection to mask and blend only the face region.
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
MAPPER_CHECKPOINT_PATH = MODEL_DIR / "mapper-step=010000.ckpt"
SEGMENTER_PATH = MODEL_DIR / "selfie_segmenter.tflite"


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
        self.num_embeddings = self.grid_size**2
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


class LatentMapper(nn.Module):
    """A lightweight network that predicts a residual shift for the continuous latents."""

    def __init__(self, channels: int = 256):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(channels, channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(channels),
            nn.LeakyReLU(0.2),
            ResidualBlock(channels),
            ResidualBlock(channels),
            nn.Conv2d(channels, channels, kernel_size=3, padding=1),
        )

    def forward(self, z):
        return self.net(z)


class PrivateVQGAN(nn.Module):
    """VQGAN model wrapper matching the structure from training."""

    def __init__(self, embedding_dim: int = 256, num_embeddings: int = 2048):
        super().__init__()
        self.model = VQVAE(embedding_dim=embedding_dim, num_embeddings=num_embeddings)
        self.embedding_dim = embedding_dim

    def encode(self, x):
        return self.model.encode(x)

    def quantize(self, z_e):
        return self.model.quantize(z_e)

    def decode(self, z_q):
        return self.model.decode(z_q)

    @classmethod
    def load_from_checkpoint(cls, ckpt_path: str):
        """Load VQVAE from checkpoint."""
        model = cls()
        ckpt = torch.load(ckpt_path, map_location="cpu")

        if "state_dict" in ckpt:
            state_dict = ckpt["state_dict"]
            prefix = "model._orig_mod."
            clean_state = {}
            for k, v in state_dict.items():
                if k.startswith(prefix):
                    clean_key = k[len(prefix) :]
                    clean_state[clean_key] = v
            state_dict = clean_state
        else:
            state_dict = ckpt

        model.model.load_state_dict(state_dict, strict=False)
        return model


class FaceTweaker:
    """Loads the VQVAE + LatentMapper and applies adversarial face perturbation."""

    def __init__(self, shift_radius: float = 0.85, use_mapper: bool = True):
        self.shift_radius = shift_radius
        self.use_mapper = use_mapper
        self.device = torch.device("cpu")
        self._vqgan: PrivateVQGAN | None = None
        self._mapper: LatentMapper | None = None
        self._detector_service = None
        self._segmenter = None

    def _load_vqgan(self) -> PrivateVQGAN:
        if self._vqgan is not None:
            return self._vqgan

        logger.info("Loading VQVAE from %s", CHECKPOINT_PATH)
        vqgan = PrivateVQGAN.load_from_checkpoint(str(CHECKPOINT_PATH))
        vqgan.eval()
        vqgan.to(self.device)
        self._vqgan = vqgan
        logger.info("VQVAE loaded successfully")
        return vqgan

    def _load_mapper(self) -> LatentMapper | None:
        if self._mapper is not None:
            return self._mapper

        if not self.use_mapper:
            return None

        if not MAPPER_CHECKPOINT_PATH.exists():
            logger.warning(
                "Mapper checkpoint not found at %s — falling back to random shift",
                MAPPER_CHECKPOINT_PATH,
            )
            self.use_mapper = False
            return None

        logger.info("Loading LatentMapper from %s", MAPPER_CHECKPOINT_PATH)
        mapper = LatentMapper(channels=256)

        ckpt = torch.load(str(MAPPER_CHECKPOINT_PATH), map_location="cpu")

        state_dict = ckpt.get("state_dict", ckpt)
        prefix = "mapper."
        clean_state = {}
        for k, v in state_dict.items():
            if k.startswith(prefix):
                clean_key = k[len(prefix) :]
                clean_state[clean_key] = v
            elif not any(p in k for p in ["vqgan", "perceptual", "identity"]):
                clean_state[k] = v

        mapper.load_state_dict(clean_state, strict=False)
        mapper.eval()
        mapper.to(self.device)
        self._mapper = mapper
        logger.info("LatentMapper loaded successfully")
        return mapper

    def _get_detector_service(self):
        if self._detector_service is None:
            from vie_backend.services.detection import (
                DetectionService,
                _resize_for_detection,
            )

            self._detector_service = DetectionService()
            self._resize_for_detection = _resize_for_detection
        return self._detector_service

    def _detect_face_bbox(
        self, img_rgb: np.ndarray
    ) -> tuple[int, int, int, int] | None:
        """Detect face using the same progressive fallback as DetectionService.

        Returns (x, y, w, h) with asymmetric padding (extra on top for hair).
        """
        h, w = img_rgb.shape[:2]
        svc = self._get_detector_service()

        resized, _scale = self._resize_for_detection(
            cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
        )
        rgb_resized = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)

        detections = svc._try_detect(rgb_resized)

        if not detections:
            return None

        detection = max(detections, key=lambda d: d.score[0])
        bbox = detection.location_data.relative_bounding_box

        bx = int(bbox.xmin * w)
        by = int(bbox.ymin * h)
        bw = int(bbox.width * w)
        bh = int(bbox.height * h)

        pad_left = int(bw * 0.2)
        pad_right = int(bw * 0.2)
        pad_top = int(bh * 0.7)
        pad_bottom = 0

        x1 = max(0, bx - pad_left)
        y1 = max(0, by - pad_top)
        x2 = min(w, bx + bw + pad_right)
        y2 = min(h, by + bh + pad_bottom)

        return x1, y1, x2 - x1, y2 - y1

    def _letterbox(
        self, face_crop: np.ndarray
    ) -> tuple[np.ndarray, tuple[int, int, int, int]]:
        """Place face crop centered on a 512x512 black canvas using PIL for high-quality resize."""
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

    _FACE_OVAL = [
        10,
        338,
        297,
        332,
        284,
        251,
        389,
        356,
        454,
        323,
        361,
        288,
        397,
        365,
        379,
        378,
        400,
        377,
        152,
        148,
        176,
        149,
        150,
        136,
        172,
        58,
        132,
        93,
        234,
        127,
        162,
        21,
        54,
        103,
        67,
        109,
    ]

    def _make_face_mask(self, canvas_rgb: np.ndarray) -> np.ndarray:
        """Create a face-only mask using MediaPipe Face Mesh."""
        h, w = canvas_rgb.shape[:2]
        mesh = self._get_face_mesh()
        results = mesh.process(canvas_rgb)

        if not results.multi_face_landmarks:
            logger.warning(
                "Face mesh failed on canvas — falling back to full placement mask"
            )
            return np.ones((h, w), dtype=np.float32)

        landmarks = results.multi_face_landmarks[0]

        points = []
        for idx in self._FACE_OVAL:
            lm = landmarks.landmark[idx]
            points.append([int(lm.x * w), int(lm.y * h)])

        points = np.array(points, dtype=np.int32)

        top_y = points[:, 1].min()
        bottom_y = points[:, 1].max()
        face_height = bottom_y - top_y
        hair_extension = int(face_height * 0.25)

        top_threshold = top_y + face_height * 0.3
        extended_points = points.copy()
        for i in range(len(extended_points)):
            if extended_points[i][1] < top_threshold:
                extended_points[i][1] = max(0, extended_points[i][1] - hair_extension)

        mask = np.zeros((h, w), dtype=np.float32)
        cv2.fillPoly(mask, [extended_points], 1.0)

        mask = cv2.GaussianBlur(mask, (21, 21), 0)
        if mask.max() > 0:
            mask = mask / mask.max()

        return mask

    def _generate_random_shift(
        self, b: int, h: int, w: int, device: torch.device
    ) -> tuple[torch.Tensor, torch.Tensor]:
        """Generate smooth, low-frequency spatial distortion field (fallback method)."""
        noise_res = 4
        noise_y = torch.randn(b, 1, noise_res, noise_res, device=device)
        noise_x = torch.randn(b, 1, noise_res, noise_res, device=device)

        shift_y = F.interpolate(
            noise_y, size=(h, w), mode="bicubic", align_corners=False
        ).squeeze(1)
        shift_x = F.interpolate(
            noise_x, size=(h, w), mode="bicubic", align_corners=False
        ).squeeze(1)

        return shift_y * self.shift_radius, shift_x * self.shift_radius

    def _shift_with_mapper(
        self, z_e: torch.Tensor, vqgan: PrivateVQGAN
    ) -> torch.Tensor:
        """Apply latent shift using the trained mapper network."""
        delta_z = self._mapper(z_e)
        z_shifted = z_e + (self.shift_radius * delta_z)

        z_q, indices = vqgan.quantize(z_shifted)
        return z_q

    def _shift_indices_random(
        self, indices: torch.Tensor, vqgan: VQVAE
    ) -> torch.Tensor:
        """Shift quantized indices using smooth deformation field (fallback method)."""
        grid_size = vqgan.quantizer.grid_size
        embedding_dim = vqgan.quantizer.embedding_dim
        b, h_lat, w_lat = indices.shape

        y_coords = (indices // grid_size).float()
        x_coords = (indices % grid_size).float()

        shift_y, shift_x = self._generate_random_shift(b, h_lat, w_lat, indices.device)

        target_y = (y_coords + shift_y) % grid_size
        target_x = (x_coords + shift_x) % grid_size

        norm_weight = F.normalize(vqgan.quantizer.embedding.weight, p=2, dim=-1)
        codebook_weights = norm_weight.view(1, grid_size, grid_size, embedding_dim)
        codebook_weights = codebook_weights.permute(0, 3, 1, 2)

        norm_y = 2.0 * target_y / (grid_size - 1) - 1.0
        norm_x = 2.0 * target_x / (grid_size - 1) - 1.0
        sampling_grid = torch.stack([norm_x, norm_y], dim=-1)

        z_shifted = F.grid_sample(
            codebook_weights.expand(b, -1, -1, -1),
            sampling_grid,
            mode="bilinear",
            padding_mode="reflection",
            align_corners=True,
        )
        return z_shifted

    @torch.no_grad()
    def tweak(self, image_path: str) -> np.ndarray:
        """Apply adversarial perturbation to a face image."""
        vqgan = self._load_vqgan()
        mapper = self._load_mapper() if self.use_mapper else None

        pil_img = ImageOps.exif_transpose(Image.open(image_path)).convert("RGB")
        orig_rgb = np.array(pil_img)
        orig_h, orig_w = orig_rgb.shape[:2]

        face_bbox = self._detect_face_bbox(orig_rgb)
        if face_bbox is None:
            logger.warning("No face detected in %s — returning original", image_path)
            return cv2.cvtColor(orig_rgb, cv2.COLOR_RGB2BGR)

        bx, by, bw, bh = face_bbox
        face_crop = orig_rgb[by : by + bh, bx : bx + bw].copy()

        canvas, placement = self._letterbox(face_crop)
        mask_np = self._make_face_mask(canvas)

        x = torch.from_numpy(canvas).float().permute(2, 0, 1).unsqueeze(0) / 255.0
        mask_t = torch.from_numpy(mask_np).float().unsqueeze(0).unsqueeze(0)
        x = x.to(self.device)
        mask_t = mask_t.to(self.device)

        if mapper is not None:
            z_e = vqgan.encode(x)
            z_q = self._shift_with_mapper(z_e, vqgan)
            x_shifted = vqgan.decode(z_q)
        else:
            z_e = vqgan.encode(x)
            _, indices = vqgan.quantize(z_e)
            z_shifted = self._shift_indices_random(indices, vqgan.model)
            x_shifted = vqgan.decode(z_shifted)

        final = mask_t * x_shifted + (1.0 - mask_t) * x
        final = torch.clamp(final, 0, 1)

        result_512 = (final.squeeze(0).permute(1, 2, 0).cpu().numpy() * 255).astype(
            np.uint8
        )

        x_off, y_off, rw, rh = placement
        tweaked_face_resized = result_512[y_off : y_off + rh, x_off : x_off + rw]

        pil_tweaked = Image.fromarray(tweaked_face_resized)
        pil_tweaked = pil_tweaked.resize((bw, bh), Image.LANCZOS)
        tweaked_face = np.array(pil_tweaked)

        result_rgb = orig_rgb.copy()
        result_rgb[by : by + bh, bx : bx + bw] = tweaked_face

        return cv2.cvtColor(result_rgb, cv2.COLOR_RGB2BGR)
