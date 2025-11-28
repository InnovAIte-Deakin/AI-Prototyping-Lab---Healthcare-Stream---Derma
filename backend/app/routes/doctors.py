from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas import DoctorResponse
from app.services.doctor_service import list_doctors

router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.get("", response_model=list[DoctorResponse])
def get_doctors(db: Session = Depends(get_db)):
    """List all doctors with their profile information."""
    return list_doctors(db)
