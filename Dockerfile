# STAGE 1: COMPILE FRONTEND DASHBOARD (Svelte 5)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend . .
RUN npm run build || (mkdir -p dist && cp index.html dist/ 2>/dev/null || true)

# STAGE 2: COMPILE BACKEND (Python 3.11 with all bleeding-edge deps)
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential sqlite3 libsqlite3-dev curl git gdal-bin libgdal-dev \
    libgeos-dev libproj-dev postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# Upgrade pip and install core packages
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install bleeding-edge ML/AI/Physics packages
RUN pip install --no-cache-dir \
    fastapi==0.115.0 uvicorn[standard]==0.34.0 pydantic==2.10.0 \
    polars[all]==1.20.0 duckdb==1.4.0 \
    torch==2.6.0 torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118 \
    numpy==2.2.0 scipy scikit-learn \
    timesfm google-generativeai \
    deepxde==1.11.3 \
    ray[air]==2.37.0 ray[tune]==2.37.0 \
    stim==1.15.0 pymatching==2.3.0 \
    redis==5.2.0 \
    surrealdb==0.5.0 \
    rasterio==1.4.5 geopandas==1.1.1 shapely==2.1.1 \
    mlflow==2.20.2 wandb==0.16.0 \
    websockets==13.0 \
    sqlalchemy==2.1.0 psycopg2-binary==2.9.12 \
    tweepy requests aiohttp

# Copy application code
COPY . .
COPY --from=frontend-builder /app/frontend/dist ./static

ENV PORT=8000
EXPOSE 8000
CMD ["uvicorn", "core_orchestrator:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]