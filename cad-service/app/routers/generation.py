from fastapi import APIRouter, HTTPException, BackgroundTasks
from pathlib import Path
from loguru import logger

from app.models.cad_params import GenerationRequest, GenerationResponse
from app.services.cad_engine import CadEngine
from app.config import settings

router = APIRouter()
engine = CadEngine()


@router.post("", response_model=GenerationResponse)
async def generate_cad(request: GenerationRequest):
    """Generate CAD model from structured parameters."""
    logger.info(f"Generation request for project {request.project_id}")

    output_dir = Path(settings.OUTPUT_DIR) / request.project_id

    try:
        shape = engine.generate(request.cad_parameters, output_dir)
        files = engine.export(shape, output_dir, request.project_id, request.export_formats)

        return GenerationResponse(
            project_id=request.project_id,
            status="COMPLETED",
            files=files,
            message=f"Successfully generated {len(files)} export files"
        )
    except Exception as e:
        logger.error(f"Generation failed for project {request.project_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def generation_health():
    return {"status": "ok", "service": "cad-generation"}
