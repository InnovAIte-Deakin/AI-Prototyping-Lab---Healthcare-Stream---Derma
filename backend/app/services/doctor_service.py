from typing import Dict, List, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import DoctorProfile, PatientDoctorLink, User


def _doctor_response(user: User, profile: DoctorProfile) -> Dict[str, object]:
    """Shape a doctor record with profile details."""
    return {
        "id": user.id,
        "email": user.email,
        "full_name": profile.full_name,
        "clinic_name": profile.clinic_name,
        "bio": profile.bio,
    }


def _get_doctor_with_profile(db: Session, doctor_id: int) -> Tuple[User, DoctorProfile]:
    """Fetch doctor user and profile, ensuring both exist."""
    doctor = (
        db.query(User)
        .filter(User.id == doctor_id, User.role == "doctor")
        .first()
    )
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found"
        )

    profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == doctor.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found"
        )

    return doctor, profile


def list_doctors(db: Session) -> List[Dict[str, object]]:
    """Return all doctors with their profile information."""
    doctors = (
        db.query(User, DoctorProfile)
        .join(DoctorProfile, DoctorProfile.user_id == User.id)
        .filter(User.role == "doctor")
        .all()
    )
    return [_doctor_response(user, profile) for user, profile in doctors]


def link_patient_to_doctor(
    db: Session, patient_id: int, doctor_id: int
) -> Dict[str, object]:
    """
    Upsert a PatientDoctorLink for a patient and return linked doctor details.
    """
    doctor, profile = _get_doctor_with_profile(db, doctor_id)

    link = db.query(PatientDoctorLink).filter(PatientDoctorLink.patient_id == patient_id).first()
    if link:
        link.doctor_id = doctor.id
        link.status = "active"
    else:
        link = PatientDoctorLink(
            patient_id=patient_id,
            doctor_id=doctor.id,
            status="active",
        )
        db.add(link)

    db.commit()
    db.refresh(link)

    return {"doctor": _doctor_response(doctor, profile), "status": link.status}


def get_patient_doctor(db: Session, patient_id: int) -> Dict[str, object]:
    """Return the patient's linked doctor or 404 if none."""
    link = db.query(PatientDoctorLink).filter(PatientDoctorLink.patient_id == patient_id).first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No doctor linked to this patient",
        )

    doctor, profile = _get_doctor_with_profile(db, link.doctor_id)
    return {"doctor": _doctor_response(doctor, profile), "status": link.status}
