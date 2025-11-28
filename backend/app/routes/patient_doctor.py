from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth_helpers import get_current_patient
from app.db import get_db
from app.models import User
from app.schemas import PatientDoctorResponse, SelectDoctorRequest
from app.services.doctor_service import get_patient_doctor, link_patient_to_doctor

router = APIRouter(prefix="/patient", tags=["Patient Doctor"])


@router.post("/select-doctor", response_model=PatientDoctorResponse)
def select_doctor(
    payload: SelectDoctorRequest,
    current_patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """Select or update the patient's doctor."""
    return link_patient_to_doctor(
        db=db, patient_id=current_patient.id, doctor_id=payload.doctor_id
    )


@router.get("/my-doctor", response_model=PatientDoctorResponse)
def my_doctor(
    current_patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """Get the currently linked doctor for the patient."""
    return get_patient_doctor(db=db, patient_id=current_patient.id)
