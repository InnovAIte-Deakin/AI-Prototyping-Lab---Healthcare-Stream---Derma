"""
Health check endpoints for readiness/liveness checks.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.db import get_db
from app.services.health_service import get_health_response

router = APIRouter(tags=["health"])


@router.get("/health")
async def health(db: Session = Depends(get_db)):
    """
    Health check endpoint (includes DB + env validation).
    """
    payload, http_status = get_health_response(db)
    return JSONResponse(content=payload, status_code=http_status)


@router.get("/ready")
async def ready(db: Session = Depends(get_db)):
    """
    Readiness endpoint (same checks as /health).
    """
    payload, http_status = get_health_response(db)
    return JSONResponse(content=payload, status_code=http_status)
