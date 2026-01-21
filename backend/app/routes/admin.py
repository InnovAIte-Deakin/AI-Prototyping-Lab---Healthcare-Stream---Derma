"""
Admin routes for clinic-wide oversight.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.auth_helpers import get_current_admin
from app.models import User
from app.services.admin_service import get_admin_overview

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/overview")
def admin_overview(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Get clinic-wide metrics for admin dashboard.
    
    Returns total patients, doctors, pending cases, average rating, and recent cases.
    """
    return get_admin_overview(db)
