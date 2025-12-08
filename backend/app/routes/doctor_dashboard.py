from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.db import get_db
from app.auth_helpers import get_current_doctor
from app.models import User
from app.services.doctor_service import get_doctor_patients

router = APIRouter(prefix="/doctor", tags=["Doctor Dashboard"])


@router.get("/patients")
def get_my_patients(
    current_doctor: User = Depends(get_current_doctor),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """
    List all patients linked to the current doctor.
    """
    return get_doctor_patients(db=db, doctor_id=current_doctor.id)
