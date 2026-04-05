"""
PrivateVQGAN inference module.

Loads the trained VQVAE from last.ckpt and applies identity-shifting
adversarial perturbation to face images. Uses MediaPipe face detection
to mask and blend only the face region.

The LatentMapper approach:
- Encode image to continuous latent z_e
- Predict residual shift delta_z via mapper network
- Apply shift: z_shifted = z_e + (latent_shift_scale * delta_z)
- Quantize and decode
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

try:
    from realesrgan_ncnn_vulkan import RealESRGAN

    REAL_ESRGAN_AVAILABLE = True
except ImportError:
    REAL_ESRGAN_AVAILABLE = False

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parent.parent.parent.parent / "model"
CHECKPOINT_PATH = MODEL_DIR / "vqgan-step=030000.ckpt"
MAPPER_CHECKPOINT_PATH = MODEL_DIR / "mapper-step=014000.ckpt"
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
    def __init__(
        self,
        num_embeddings: int = 1024,
        embedding_dim: int = 256,
        commitment_cost: float = 0.25,
        topo_weight: float = 0.35,
    ):
        super().__init__()

        self.grid_size = int(math.sqrt(num_embeddings))
        self.num_embeddings = self.grid_size**2
        self.embedding_dim = embedding_dim
        self.commitment_cost = commitment_cost
        self.topo_weight = topo_weight

        self.embedding = nn.Embedding(self.num_embeddings, self.embedding_dim)
        self.embedding.weight.data.normal_(0, 1.0 / self.num_embeddings)

    def forward(self, z_e):
        z_e = z_e.permute(0, 2, 3, 1).contiguous()
        input_shape = z_e.shape

        flat_z_e = F.normalize(z_e.view(-1, self.embedding_dim), p=2, dim=-1)

        with torch.no_grad():
            norm_weight_nograd = F.normalize(self.embedding.weight, p=2, dim=-1)
            distances = 2.0 - 2.0 * torch.matmul(flat_z_e, norm_weight_nograd.t())
            encoding_indices = torch.argmin(distances, dim=1).unsqueeze(1)

        norm_weight = F.normalize(self.embedding.weight, p=2, dim=-1)

        z_q = norm_weight[encoding_indices.view(-1)].view(input_shape)
        z_e_norm = flat_z_e.view(input_shape)

        loss_commit = F.mse_loss(z_q.detach(), z_e_norm)
        loss_dict = F.mse_loss(z_q, z_e_norm.detach())
        vq_loss = loss_dict + self.commitment_cost * loss_commit

        grid_w = norm_weight.view(self.grid_size, self.grid_size, self.embedding_dim)

        loss_topo = F.mse_loss(grid_w[:, 1:, :], grid_w[:, :-1, :]) + F.mse_loss(
            grid_w[1:, :, :], grid_w[:-1, :, :]
        )
        loss_topo += F.mse_loss(grid_w[:, 0, :], grid_w[:, -1, :]) + F.mse_loss(
            grid_w[0, :, :], grid_w[-1, :, :]
        )

        loss_topo = loss_topo * self.topo_weight

        z_q = z_e_norm + (z_q - z_e_norm).detach()
        z_q = z_q.permute(0, 3, 1, 2).contiguous()

        return (
            z_q,
            vq_loss,
            encoding_indices.view(input_shape[0], input_shape[1], input_shape[2]),
            loss_topo,
        )

    def set_decay(self, decay):
        pass


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
        z_q, loss_vq, indices, loss_topo = self.quantizer(z_e)
        return z_q, loss_vq, indices, loss_topo

    def forward(self, x):
        z_e = self.encode(x)
        z_q, loss_vq, indices, loss_topo = self.quantize(z_e)
        x_recon = self.decode(z_q)
        return x_recon, loss_vq, indices, loss_topo

    def decode(self, z_q):
        x_recon = self.decoder(z_q)
        return x_recon

    def decode_from_indices(self, indices):
        batch, h, w = indices.shape
        z_q_flattened = self.quantizer.embedding(indices.view(-1))
        z_q = (
            z_q_flattened.view(batch, h, w, self.embedding_dim)
            .permute(0, 3, 1, 2)
            .contiguous()
        )
        return self.decode(z_q)


# ── Latent Mapper for identity-preserving anonymization ──


class LatentMapper(nn.Module):
    """
    A lightweight network that predicts a residual shift for the continuous latents.
    """

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

        nn.init.zeros_(self.net[-1].weight)
        nn.init.zeros_(self.net[-1].bias)

    def forward(self, z):
        return self.net(z)


# ── Inference wrapper ──


class FaceTweaker:
    """Loads the VQVAE + LatentMapper and applies identity-preserving adversarial perturbation."""

    def __init__(
        self,
        use_mapper: bool = True,
        mapper_scale: float = 0.2,
        use_eye_enhancement: bool = True,
    ):
        self.use_mapper = use_mapper
        self.latent_shift_scale = mapper_scale
        self.use_eye_enhancement = use_eye_enhancement
        self.device = torch.device("cpu")
        self._vqgan: VQVAE | None = None
        self._mapper: LatentMapper | None = None
        self._detector_service = None
        self._segmenter = None
        self._esrgan: RealESRGAN | None = None

    def _load_mapper_with_vqgan(self) -> tuple[LatentMapper, VQVAE]:
        """Load mapper checkpoint and VQGAN from standalone checkpoint."""
        if not MAPPER_CHECKPOINT_PATH.exists():
            raise FileNotFoundError(
                f"Mapper checkpoint not found at {MAPPER_CHECKPOINT_PATH}"
            )

        logger.info("Loading LatentMapper from %s", MAPPER_CHECKPOINT_PATH)
        ckpt = torch.load(str(MAPPER_CHECKPOINT_PATH), map_location="cpu")

        if "state_dict" in ckpt:
            state_dict = ckpt["state_dict"]
        else:
            state_dict = ckpt

        mapper = LatentMapper(channels=256)

        mapper_state = {}
        for k, v in state_dict.items():
            if k.startswith("mapper."):
                clean_key = k[7:]
                mapper_state[clean_key] = v
            elif k.startswith("latent_mapper."):
                clean_key = k[15:]
                mapper_state[clean_key] = v

        if mapper_state:
            mapper.load_state_dict(mapper_state, strict=False)
            logger.info("LatentMapper loaded")
        else:
            raise ValueError("No mapper state found in checkpoint")

        mapper.eval()
        mapper.to(self.device)

        logger.info("Loading standalone VQGAN from %s", CHECKPOINT_PATH)
        vqgan = self._load_vqgan()

        self._mapper = mapper
        self._vqgan = vqgan
        logger.info("Mapper and VQGAN loaded successfully")
        return mapper, vqgan

    def _load_vqgan(self) -> VQVAE:
        if self._vqgan is not None:
            return self._vqgan

        logger.info("Loading VQVAE from %s", CHECKPOINT_PATH)
        model = VQVAE(embedding_dim=256, num_embeddings=2048)

        ckpt = torch.load(str(CHECKPOINT_PATH), map_location="cpu")
        state_dict = ckpt["state_dict"]

        clean_state = {}
        prefix = "model._orig_mod."
        for k, v in state_dict.items():
            if k.startswith(prefix):
                clean_key = k[len(prefix) :]
                clean_state[clean_key] = v

        model.load_state_dict(clean_state, strict=True)
        model.eval()
        model.to(self.device)
        self._vqgan = model
        logger.info(
            "VQVAE loaded successfully (%d parameters)",
            sum(p.numel() for p in model.parameters()),
        )
        return model

    def _load_mapper(self) -> "LatentMapper | None":
        if not self.use_mapper:
            return None
        if self._mapper is not None:
            return self._mapper

        if not MAPPER_CHECKPOINT_PATH.exists():
            logger.warning(
                "Mapper checkpoint not found at %s — using index-shifting fallback",
                MAPPER_CHECKPOINT_PATH,
            )
            self.use_mapper = False
            return None

        logger.info("Loading LatentMapper from %s", MAPPER_CHECKPOINT_PATH)
        mapper = LatentMapper(channels=256)

        ckpt = torch.load(str(MAPPER_CHECKPOINT_PATH), map_location="cpu")

        if "state_dict" in ckpt:
            state_dict = ckpt["state_dict"]
        else:
            state_dict = ckpt

        clean_state = {}
        for prefix in ["model._orig_mod.", "mapper.", ""]:
            for k, v in state_dict.items():
                if k.startswith(prefix):
                    clean_key = k[len(prefix) :]
                    if clean_key not in clean_state:
                        clean_state[clean_key] = v

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
        pad_left = int(bw * 0.1)
        pad_right = int(bw * 0.1)
        pad_top = int(bh * 0.5)
        pad_bottom = int(bh * 0.05)

        x1 = max(0, bx - pad_left)
        y1 = max(0, by - pad_top)
        x2 = min(w, bx + bw + pad_right)
        y2 = min(h, by + bh + pad_bottom)

        return x1, y1, x2 - x1, y2 - y1

    def _letterbox(
        self, face_crop: np.ndarray
    ) -> tuple[np.ndarray, tuple[int, int, int, int]]:
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

    _LEFT_EYE = [
        33,
        246,
        161,
        160,
        159,
        158,
        157,
        173,
        133,
        155,
        154,
        153,
        145,
        144,
        163,
        7,
    ]
    _RIGHT_EYE = [
        362,
        398,
        384,
        385,
        386,
        387,
        388,
        263,
        466,
        260,
        257,
        258,
        259,
        257,
        356,
        70,
    ]

    def _get_esrgan(self) -> "RealESRGAN | None":
        """Initialize Real-ESRGAN for eye enhancement."""
        if not REAL_ESRGAN_AVAILABLE:
            return None
        if self._esrgan is None:
            self._esrgan = RealESRGAN(gpuid=0, scale=2)
        return self._esrgan

    def _detect_eye_regions(
        self, canvas_rgb: np.ndarray
    ) -> tuple[tuple[int, int, int, int], tuple[int, int, int, int]] | None:
        """Detect left and right eye bounding boxes using MediaPipe Face Mesh."""
        mesh = self._get_face_mesh()
        results = mesh.process(canvas_rgb)

        if not results.multi_face_landmarks:
            return None

        landmarks = results.multi_face_landmarks[0]
        h, w = canvas_rgb.shape[:2]

        left_points = [
            [int(landmarks.landmark[i].x * w), int(landmarks.landmark[i].y * h)]
            for i in self._LEFT_EYE
        ]
        right_points = [
            [int(landmarks.landmark[i].x * w), int(landmarks.landmark[i].y * h)]
            for i in self._RIGHT_EYE
        ]

        left_arr = np.array(left_points)
        right_arr = np.array(right_points)

        lx1, ly1 = left_arr.min(axis=0)
        lx2, ly2 = left_arr.max(axis=0)
        rx1, ry1 = right_arr.min(axis=0)
        rx2, ry2 = right_arr.max(axis=0)

        pad = 8
        left_bbox = (
            max(0, lx1 - pad),
            max(0, ly1 - pad),
            lx2 - lx1 + 2 * pad,
            ly2 - ly1 + 2 * pad,
        )
        right_bbox = (
            max(0, rx1 - pad),
            max(0, ry1 - pad),
            rx2 - rx1 + 2 * pad,
            ry2 - ry1 + 2 * pad,
        )

        return left_bbox, right_bbox

    def _enhance_eyes(self, img: np.ndarray) -> np.ndarray:
        """Apply Real-ESRGAN upscaling to enhance eye details."""
        esrgan = self._get_esrgan()
        if esrgan is None:
            logger.warning("Real-ESRGAN not available, skipping eye enhancement")
            return img

        input_img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        output_img = esrgan.process(input_img)
        return cv2.cvtColor(output_img, cv2.COLOR_BGR2RGB)

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
            logger.warning(
                "Face mesh failed on canvas — falling back to full placement mask"
            )
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
        hair_extension = int(face_height * 0.25)

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

    def _compute_mapper_shift(
        self, z_e: torch.Tensor, mapper: LatentMapper, scale: float
    ) -> torch.Tensor:
        """Apply the latent mapper to predict identity-preserving shift."""
        delta_z = mapper(z_e)
        z_shifted = z_e + (scale * delta_z)
        return z_shifted

    @torch.no_grad()
    def tweak(self, image_path: str, mapper_scale: float | None = None) -> np.ndarray:
        """Apply identity-preserving adversarial perturbation to a face image.

        Pipeline:
        1. Detect face → crop with asymmetric padding (extra top for hair)
        2. Letterbox crop onto 512x512 black canvas
        3. Segment face/head from background using selfie segmenter
        4. VQVAE + Mapper: encode → mapper shift → quantize → decode
        5. Blend shifted with original crop using segmentation mask
        6. Extract face region from canvas, resize, paste back

        Returns:
            BGR numpy array of the tweaked image at original resolution.
        """
        if self.use_mapper:
            mapper, vqgan = self._load_mapper_with_vqgan()
        else:
            vqgan = self._load_vqgan()
            mapper = None

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
        face_crop = orig_rgb[by : by + bh, bx : bx + bw].copy()

        # Step 2: Letterbox onto 512x512
        canvas, placement = self._letterbox(face_crop)

        # Step 3: Segment face/head from background on the canvas
        mask_np = self._make_face_mask(canvas)

        # Step 4: Run through VQVAE with mapper or fallback
        x = torch.from_numpy(canvas).float().permute(2, 0, 1).unsqueeze(0) / 255.0
        mask_t = torch.from_numpy(mask_np).float().unsqueeze(0).unsqueeze(0)
        x = x.to(self.device)
        mask_t = mask_t.to(self.device)

        z_e = vqgan.encode(x)

        if mapper is not None:
            scale = mapper_scale if mapper_scale is not None else self.latent_shift_scale
            z_shifted = self._compute_mapper_shift(z_e, mapper, scale)
            z_q, _, _, _ = vqgan.quantize(z_shifted)
            print("Applied mapper-based latent shift")
        else:
            raise RuntimeError("Mapper is required but not available")

        x_shifted = vqgan.decode(z_q)

        # Step 5: Blend — face from shifted, rest from original canvas
        # Use hard threshold to avoid overlay effect at edges
        mask_hard = (mask_t > 0.5).float()
        final = mask_hard * x_shifted + (1.0 - mask_hard) * x
        final = torch.clamp(final, 0, 1)

        result_512 = (final.squeeze(0).permute(1, 2, 0).cpu().numpy() * 255).astype(
            np.uint8
        )

        if self.use_eye_enhancement:
            eye_bboxes = self._detect_eye_regions(result_512)
            if eye_bboxes:
                left_bbox, right_bbox = eye_bboxes
                lx, ly, lw, lh = left_bbox
                rx, ry, rw_h, rh = right_bbox

                left_eye = result_512[ly : ly + lh, lx : lx + lw]
                right_eye = result_512[ry : ry + rh, rx : rx + rw_h]

                left_enhanced = self._enhance_eyes(left_eye)
                right_enhanced = self._enhance_eyes(right_eye)

                left_eye_pil = Image.fromarray(left_enhanced)
                left_eye_resized = np.array(
                    left_eye_pil.resize((lw, lh), Image.LANCZOS)
                )
                result_512[ly : ly + lh, lx : lx + lw] = left_eye_resized

                right_eye_pil = Image.fromarray(right_enhanced)
                right_eye_resized = np.array(
                    right_eye_pil.resize((rw_h, rh), Image.LANCZOS)
                )
                result_512[ry : ry + rh, rx : rx + rw_h] = right_eye_resized

                logger.info("Applied eye enhancement")

        # Step 6: Extract the face region from the 512x512 result
        x_off, y_off, rw, rh = placement
        tweaked_face_resized = result_512[y_off : y_off + rh, x_off : x_off + rw]

        # Resize back to original crop dimensions using BICUBIC for sharper results
        pil_tweaked = Image.fromarray(tweaked_face_resized)
        pil_tweaked = pil_tweaked.resize((bw, bh), Image.BICUBIC)
        tweaked_face = np.array(pil_tweaked)

        # Paste back into original image
        result_rgb = orig_rgb.copy()
        result_rgb[by : by + bh, bx : bx + bw] = tweaked_face

        return cv2.cvtColor(result_rgb, cv2.COLOR_RGB2BGR)
