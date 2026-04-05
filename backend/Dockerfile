FROM python:3.11-slim

WORKDIR /app

# System dependencies for OpenCV and image processing
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Add src to Python path so vie_backend is importable
ENV PYTHONPATH="/app/src"

EXPOSE 8000
CMD ["uvicorn", "vie_backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
