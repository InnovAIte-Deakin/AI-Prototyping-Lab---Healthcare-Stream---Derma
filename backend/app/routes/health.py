"""
Health check endpoint for CI readiness checks.
"""
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    """
    Health check endpoint.
    Used by CI to verify backend is ready before running tests.
    """
    return {"status": "ok"}
