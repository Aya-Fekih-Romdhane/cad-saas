# CAD SaaS — AI-Powered CAD Generation Platform

> Transform text descriptions and images into professional 3D CAD models using Claude AI and OpenCascade.

[![CI](https://github.com/Aya-Fekih-Romdhane/cad-saas/actions/workflows/ci.yml/badge.svg)](https://github.com/Aya-Fekih-Romdhane/cad-saas/actions)
![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green)
![Angular](https://img.shields.io/badge/Angular-17-red)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Generation Pipeline](#generation-pipeline)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [CAD JSON Schema](#cad-json-schema)
- [Export Formats](#export-formats)
- [Security](#security)
- [CI/CD](#cicd)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**CAD SaaS** is a full-stack platform that lets engineers and designers generate parametric 3D CAD models from plain text or images — no CAD software required. Under the hood, Claude AI (Anthropic) interprets the user's intent and produces a structured JSON specification that drives CadQuery/OpenCascade to build the geometry, which is then previewed live in the browser via Three.js and downloadable in industry-standard formats (STEP, STL, IGES, OBJ).

**Use cases:**
- Rapid prototyping from natural-language specs
- Converting reference images to editable 3D geometry
- Generating standard mechanical parts (flanges, brackets, shafts, plates)
- Exporting to SolidWorks, FreeCAD, Fusion 360, and 3D printers

---

## Features

### Core Generation
- **Text-to-CAD** — describe a part in plain English; Claude extracts shape, dimensions, features, and material
- **Image-to-CAD** — upload a reference photo or sketch; Claude's vision model identifies the geometry
- **Real-time progress** — WebSocket (STOMP) notifications stream generation steps live to the UI
- **Multi-format export** — STEP, STL, IGES, OBJ delivered as downloadable files

### User Experience
- Dark glassmorphism UI built with Angular Material + TailwindCSS
- Integrated Three.js viewer — rotate, zoom, and pan the model before downloading
- Project dashboard with pagination, filtering, and status tracking
- Full auth flow: register, login, token refresh, password reset

### Platform
- JWT authentication with 1-hour access tokens and 7-day rotating refresh tokens
- Rate limiting: 10 req/min per user, 50 generations/day
- Fully dockerised — one `docker compose up -d` starts everything
- GitHub Actions CI/CD with automatic SSH deployment on version tags

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│              Angular 17 SPA (Three.js + Material)           │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST + WebSocket (STOMP)
┌──────────────────────────▼──────────────────────────────────┐
│              Spring Boot 3 Backend (Java 21)                 │
│  Auth │ Projects │ Generation │ AI Client │ WebSocket        │
└────┬──────────────────────┬──────────────────────┬──────────┘
     │                      │                      │
  PostgreSQL              Redis             Claude API
  (JPA/Flyway)          (Cache)          (Anthropic)
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                Python CAD Microservice                        │
│         FastAPI + CadQuery + OpenCascade                     │
│      Generates STEP · STL · OBJ · IGES                       │
└──────────────────────────────────────────────────────────────┘
```

### Service responsibilities

| Service | Role | Port |
|---------|------|------|
| Angular SPA | Frontend UI served by Nginx | 80 |
| Spring Boot | REST API, auth, generation orchestration | 8080 |
| Python CAD Service | Parametric geometry engine | 8090 |
| PostgreSQL | Primary relational database | 5433 |
| Redis | Token cache, generation state | 6379 |

---

## Generation Pipeline

```
User Input (Text / Image)
        ↓
  Claude AI Analysis
  (claude-opus-4-7)
        ↓
  Structured CAD JSON
  { shape, dimensions, features, material }
        ↓
  Python CAD Engine
  (CadQuery / OpenCascade)
        ↓
  3D Mesh Generation
  (Extrusion, Booleans, Holes, Fillets, Chamfers)
        ↓
  Multi-format Export
  (STEP · STL · OBJ · IGES)
        ↓
  Three.js 3D Preview + Download
```

**Step-by-step details:**

1. **Input** — user submits a text prompt (`"a steel flange DN150 with 6 bolt holes"`) or uploads an image
2. **Claude AI** — the backend calls `claude-opus-4-7` with a structured system prompt; Claude returns validated JSON
3. **CAD JSON** — JSON is passed to the Python microservice via HTTP
4. **CadQuery Engine** — `cad_engine.py` builds the geometry using CadQuery's fluent API on top of OpenCascade
5. **Mesh operations** — extrusions, boolean cuts, circular hole patterns, fillets are applied programmatically
6. **Export** — the resulting solid is exported to all four formats and stored on disk
7. **Notification** — the backend pushes real-time progress events to the frontend via STOMP/WebSocket
8. **Preview** — the Angular app loads the STL into Three.js for an interactive 3D preview

---

## Tech Stack

### Frontend
| Tech | Version | Purpose |
|------|---------|---------|
| Angular | 17 (Standalone) | SPA framework |
| Angular Material | 17 | UI components |
| TailwindCSS | 3 | Utility styling + dark glassmorphism |
| Three.js | latest | 3D STL/OBJ viewer |
| Angular Signals | built-in | Reactive local state |
| NgRx | 17 | Global auth store |
| STOMP / SockJS | — | WebSocket client |
| RxJS | 7 | Async streams |

### Backend
| Tech | Version | Purpose |
|------|---------|---------|
| Spring Boot | 3.2 | REST API framework |
| Java | 21 | Virtual threads, records |
| Spring Security + JWT | — | Auth + RBAC |
| Spring Data JPA + Hibernate | — | ORM |
| PostgreSQL | 16 | Primary database |
| Flyway | — | DB schema migrations |
| Redis | 7 | Cache + session store |
| WebSocket (STOMP) | — | Real-time progress events |
| WebFlux (WebClient) | — | Reactive HTTP client (CAD service) |
| SpringDoc OpenAPI 3 | — | Swagger UI |
| Bucket4j | — | Rate limiting |

### AI & CAD
| Tech | Version | Purpose |
|------|---------|---------|
| Claude API (`claude-opus-4-7`) | — | Text analysis + Vision |
| Prompt Engineering | — | CAD parameter extraction |
| CadQuery | 2 | Parametric 3D modeling |
| OpenCascade (OCCT) | — | CAD kernel |
| FastAPI | — | Python microservice framework |

---

## Quick Start

### Prerequisites

- [Docker 24+](https://docs.docker.com/get-docker/) & Docker Compose
- [Node.js 20+](https://nodejs.org/) (local dev only)
- [Java 21](https://adoptium.net/) (local dev only)
- [Python 3.11+](https://www.python.org/) (local dev only)
- Claude API key → [console.anthropic.com](https://console.anthropic.com)

### With Docker Compose (recommended)

```bash
git clone https://github.com/Aya-Fekih-Romdhane/cad-saas.git
cd cad-saas

# Copy and configure environment
cp .env.example .env
# Open .env and set CLAUDE_API_KEY and JWT_SECRET

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Access
open http://localhost                              # Angular UI
open http://localhost:8080/api/swagger-ui.html    # Swagger API docs
```

> All services start with health checks. The backend waits for PostgreSQL and Redis to be healthy before booting.

### Local Development

```bash
# Clone and configure
git clone https://github.com/Aya-Fekih-Romdhane/cad-saas.git
cd cad-saas
chmod +x setup.sh && ./setup.sh     # installs deps and seeds .env

# Terminal 1 — Start infrastructure
docker compose up postgres redis -d

# Terminal 2 — Backend
cd backend
./mvnw spring-boot:run

# Terminal 3 — Frontend
cd frontend
ng serve --open                      # opens http://localhost:4200

# Terminal 4 — CAD Service
cd cad-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8090
```

---

## Project Structure

```
cad-saas/
│
├── frontend/                        # Angular 17 SPA
│   └── src/app/
│       ├── core/
│       │   ├── guards/              # auth.guard, guest.guard
│       │   ├── interceptors/        # JWT injection, error handling
│       │   └── services/            # auth, generation, project
│       ├── features/
│       │   ├── landing/             # Public landing page
│       │   ├── auth/                # Login · Register · Reset Password
│       │   ├── dashboard/           # Project list + stats
│       │   ├── generation/          # Text & image CAD workspace
│       │   ├── projects/            # Project detail + download
│       │   └── settings/            # User settings & profile
│       ├── shared/
│       │   └── three-viewer/        # Reusable Three.js 3D viewer
│       └── store/
│           └── auth/                # NgRx auth effects & reducers
│
├── backend/                         # Spring Boot 3 (Java 21)
│   └── src/main/java/com/cadsaas/
│       ├── auth/                    # JWT auth, refresh tokens, login/register
│       ├── user/                    # User entity + repository
│       ├── project/                 # Project CRUD + file download
│       ├── generation/              # Async generation pipeline controller
│       ├── ai/                      # Claude API client + prompt builder
│       ├── cad/                     # CAD service HTTP client
│       ├── websocket/               # STOMP progress notifications
│       ├── security/                # JWT filter + Spring Security config
│       ├── common/                  # Enums, responses, exceptions
│       └── config/                  # ApplicationConfig, OpenApiConfig
│
├── cad-service/                     # Python FastAPI + CadQuery
│   └── app/
│       ├── routers/                 # /generation, /health endpoints
│       ├── services/
│       │   └── cad_engine.py        # Core CadQuery geometry builder
│       └── models/                  # Pydantic schemas (CadParams, etc.)
│
├── docker/
│   ├── nginx/nginx.conf             # Nginx reverse proxy config
│   └── postgres/init.sql            # DB bootstrap
│
├── .github/workflows/
│   ├── ci.yml                       # Build + test on every PR
│   └── cd.yml                       # Deploy on version tag push
│
├── docker-compose.yml
├── .env.example                     # Environment variable template
└── setup.sh                         # Local dev setup script
```

---

## API Reference

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Create account | — |
| `POST` | `/api/auth/login` | Get access + refresh token | — |
| `POST` | `/api/auth/refresh` | Rotate refresh token | — |
| `POST` | `/api/auth/logout` | Invalidate refresh token | Bearer |

### Projects

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/projects` | List projects (paginated, filtered by status) | Bearer |
| `GET` | `/api/projects/:id` | Get project details | Bearer |
| `DELETE` | `/api/projects/:id` | Delete project + files | Bearer |
| `GET` | `/api/projects/:id/files/:fid/download` | Download a generated file | Bearer |

### Generation

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/generation/text` | Generate CAD from text | Bearer |
| `POST` | `/api/generation/image` | Generate CAD from image | Bearer |

### WebSocket

| Protocol | Endpoint | Description |
|----------|----------|-------------|
| STOMP/SockJS | `/api/ws` | Subscribe to `/topic/generation/{projectId}` for real-time updates |

**Full interactive docs:** `http://localhost:8080/api/swagger-ui.html`

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values.

```bash
# ─── Database ────────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cadsaas
DB_USER=cadsaas
DB_PASSWORD=your_db_password

# ─── Redis ───────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ─── JWT ─────────────────────────────────────────
# Generate: openssl rand -hex 32
JWT_SECRET=your-256-bit-secret

# ─── Claude AI ───────────────────────────────────
CLAUDE_API_KEY=sk-ant-...    # Required — get at console.anthropic.com

# ─── Services ────────────────────────────────────
CAD_SERVICE_URL=http://localhost:8090
FRONTEND_URL=http://localhost:4200

# ─── Storage ─────────────────────────────────────
UPLOAD_DIR=./uploads
```

---

## CAD JSON Schema

Claude returns a structured JSON object consumed by the Python CAD engine:

```json
{
  "shape": "flange",
  "name": "Circular Flange DN150",
  "unit": "mm",
  "dimensions": {
    "diameter": 150,
    "thickness": 20
  },
  "features": [
    {
      "type": "hole",
      "count": 6,
      "diameter": 11,
      "pattern": "circular",
      "pitch_circle_diameter": 120
    },
    {
      "type": "hole",
      "count": 1,
      "diameter": 60,
      "depth": 20
    }
  ],
  "material": {
    "name": "steel",
    "type": "metal",
    "density": 7850
  }
}
```

**Supported shapes:** `box`, `cylinder`, `sphere`, `flange`, `bracket`, `shaft`, `plate`, `custom`

**Supported feature types:** `hole`, `fillet`, `chamfer`, `pocket`, `boss`, `thread`, `slot`

---

## Export Formats

| Format | Extension | Compatible With |
|--------|-----------|----------------|
| STEP | `.step` | SolidWorks, FreeCAD, Fusion 360, AutoCAD, CATIA |
| STL | `.stl` | 3D Printing, Three.js browser preview |
| IGES | `.iges` | SolidWorks, legacy CAD interchange |
| OBJ | `.obj` | Blender, game engines, renderers |

---

## Security

| Layer | Mechanism |
|-------|-----------|
| Authentication | JWT — 1h access tokens + 7d rotating refresh tokens |
| Password storage | BCrypt hashing |
| Rate limiting | Bucket4j — 10 req/min, 50 generations/day per user |
| SQL injection | JPA/Hibernate parameterised queries |
| XSS | Angular's built-in DomSanitizer |
| CORS | Configured per environment (dev vs prod) |
| File upload | MIME type + size validation |
| Token rotation | Refresh token invalidated on every use |

---

## CI/CD

GitHub Actions runs two pipelines:

| Pipeline | File | Trigger | Steps |
|----------|------|---------|-------|
| CI | `.github/workflows/ci.yml` | Every PR / push | Backend tests (JUnit), frontend build, Python service tests |
| CD | `.github/workflows/cd.yml` | Push of `v*.*.*` tag | Build Docker images, push to registry, deploy via SSH + Docker Compose |

**To deploy a new version:**
```bash
git tag v1.2.3
git push origin v1.2.3
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit following [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request — CI will run automatically

Please open an issue first for major changes to discuss the approach.

---

## License

MIT © 2024 CAD SaaS — [Aya Fekih Romdhane](https://github.com/Aya-Fekih-Romdhane)
