# VIE — Visual Identity Encoder


<https://vie.beauty>

**Poison your photos before they poison your privacy.**

VIE is an adversarial image tool that protects your facial identity from automated recognition systems. Upload a photo, and VIE encodes every face in the image with imperceptible perturbations that make facial recognition systems see an entirely different person — while looking completely identical to the human eye.

## Why

Over 30 billion facial images have been scraped from the public internet by companies like Clearview AI. Thousands of data brokers silently aggregate every photo you post — building a permanent, searchable record of your face without your consent.

VIE lets you poison that data before it reaches them. Instead of reacting after your face is in a database, VIE corrupts the input so it never gets there accurately in the first place.

## How It Works

1. **Upload** — Provide your original face photo(s) and the image you want to protect.
2. **Encode** — VIE detects every face in the image and applies adversarial perturbations that are invisible to humans but fool recognition models.
3. **Verify** — The protected image is tested against DeepFace and InsightFace to measure how effectively the encoding defeats recognition.
4. **Download** — Get your protected image with a privacy score showing how well each face is shielded.

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React, TypeScript, Vite, Tailwind   |
| Backend  | FastAPI (Python)                    |
| ML       | DeepFace, InsightFace, ONNX Runtime |
| Infra    | Docker, Docker Compose              |

## Project Structure

```
catapult2026/
├── frontend/                # React + Vite + TypeScript + Tailwind
│   ├── src/
│   │   ├── pages/
│   │   │   └── Home.tsx     # Upload UI + results display
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
├── backend/                 # FastAPI + Python
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── routers/
│   │   │   └── process.py   # /api/process endpoint
│   │   └── services/
│   │       ├── comparison.py # DeepFace + InsightFace similarity
│   │       ├── detection.py  # Face detection
│   │       └── tweaker.py    # Adversarial perturbation (stub)
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

That's it. Docker handles all dependencies (Node, Python, ML libraries) so every developer gets the same environment regardless of their OS.

### Setup

```bash
# Clone the repo
git clone https://github.com/your-org/catapult2026.git
cd catapult2026

# Build and start both services (first time)
docker compose up --build

# After the first build, just run:
docker compose up
```

The first build takes a few minutes — it's installing TensorFlow, InsightFace, and other ML libraries. Subsequent starts are fast since Docker caches the layers.

### Access

Once both containers are running:

| Service          | URL                              |
|------------------|----------------------------------|
| Frontend         | http://localhost:3000             |
| Backend API      | http://localhost:8000             |
| API Health Check | http://localhost:8000/api/health  |

### Stop

```bash
# Stop all containers
docker compose down
```

## API Endpoints

| Method | Endpoint       | Description                                          |
|--------|---------------|------------------------------------------------------|
| POST   | `/api/process` | Upload original face(s) + target face, returns tweaked image and similarity scores |
| GET    | `/api/health`  | Health check                                         |

### POST `/api/process`

**Request** (multipart/form-data):
- `original_files` — One or more face images for comparison
- `target_file` — The face image to protect

**Response:**
```json
{
  "tweaked_image_url": "/uploads/tweaked_abc123.jpg",
  "comparisons": [
    {
      "original_filename": "my_face.jpg",
      "deepface": {
        "verified": false,
        "distance": 0.65,
        "similarity": 0.35,
        "model": "VGG-Face",
        "threshold": 0.4
      },
      "insightface": {
        "similarity": 0.28,
        "distance": 0.72
      }
    }
  ]
}
```

## Current Status

- [x] Project scaffold (frontend + backend + Docker)
- [x] Image upload and processing pipeline
- [x] Face comparison via DeepFace and InsightFace
- [ ] Adversarial perturbation model (tweaker is currently a stub)
- [ ] Privacy score calculation
- [ ] Multi-face detection and per-face encoding
- [ ] Download protected images

## License

TBD
