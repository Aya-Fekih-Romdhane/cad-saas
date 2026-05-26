FROM python:3.11-slim

# System dependencies for CadQuery/OpenCascade
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglu1-mesa \
    libgl1 \
    libxrender1 \
    libxext6 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies (CadQuery + FastAPI)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir fastapi==0.109.0 uvicorn[standard]==0.27.0 \
    pydantic==2.6.0 pydantic-settings==2.1.0 loguru==0.7.2 httpx==0.26.0 && \
    pip install --no-cache-dir cadquery==2.4.0 || \
    echo "CadQuery install failed, continuing without it" && \
    pip install --no-cache-dir trimesh==4.1.4 numpy==1.26.4

COPY . .

RUN mkdir -p /app/uploads /app/outputs

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -f http://localhost:8090/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8090"]
