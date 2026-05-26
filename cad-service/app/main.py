from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger
import sys

from app.routers import generation, health
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.configure(handlers=[{"sink": sys.stdout, "level": settings.LOG_LEVEL}])
    logger.info("CAD Service starting up...")
    yield
    logger.info("CAD Service shutting down...")


app = FastAPI(
    title="CAD Generation Service",
    description="Python microservice for AI-driven 3D CAD model generation",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(generation.router, prefix="/generate", tags=["Generation"])
