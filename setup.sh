#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# CAD SaaS — Setup Script
# ──────────────────────────────────────────────────────────────

echo "╔══════════════════════════════════════════╗"
echo "║      CAD SaaS — Setup & Quickstart       ║"
echo "╚══════════════════════════════════════════╝"

# Check prerequisites
command -v docker  >/dev/null 2>&1 || { echo "❌ Docker not found"; exit 1; }
command -v docker  >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 || { echo "❌ Docker Compose not found"; exit 1; }
command -v node    >/dev/null 2>&1 || { echo "❌ Node.js not found"; exit 1; }
command -v java    >/dev/null 2>&1 || { echo "❌ Java 21 not found"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 not found"; exit 1; }

echo "✅ All prerequisites found"

# Setup environment
if [ ! -f .env ]; then
  cp .env.example .env
  echo "📄 Created .env from .env.example"
  echo "⚠️  Please edit .env and set CLAUDE_API_KEY before starting"
fi

# Frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend && npm ci --silent && cd ..

# Python CAD service
echo "🐍 Installing Python dependencies..."
cd cad-service
python3 -m venv .venv 2>/dev/null || true
source .venv/bin/activate 2>/dev/null || .venv/Scripts/activate 2>/dev/null || true
pip install -r requirements.txt -q
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the full stack:"
echo "  docker compose up -d"
echo ""
echo "For development (hot-reload):"
echo "  Terminal 1: cd backend && ./mvnw spring-boot:run"
echo "  Terminal 2: cd frontend && ng serve"
echo "  Terminal 3: cd cad-service && uvicorn app.main:app --reload --port 8090"
echo ""
echo "URLs:"
echo "  Frontend:  http://localhost:4200"
echo "  Backend:   http://localhost:8080/api"
echo "  Swagger:   http://localhost:8080/api/swagger-ui.html"
echo "  CAD Svc:   http://localhost:8090/docs"
