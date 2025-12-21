from typing import Dict, List, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import DoctorProfile, PatientDoctorLink, User

default_avatar_url = "https://gravatar.com/avatar/978fdf5857cb7ed7f55c653c8a3c8cf2?s=400&d=robohash&r=x"


def _doctor_response(user: User, profile: DoctorProfile) -> Dict[str, object]:
    """Shape a doctor record with profile details."""
    return {
        "id": user.id,
        "email": user.email,
        "full_name": profile.full_name or "",
        "clinic_name": profile.clinic_name or "",
        "bio": profile.bio or "",
        "avatar_url": profile.avatar_url or default_avatar_url,
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


def get_doctor_patients(db: Session, doctor_id: int) -> List[Dict[str, object]]:
    """Return all patients linked to the doctor."""
    links = (
        db.query(PatientDoctorLink, User)
        .join(User, PatientDoctorLink.patient_id == User.id)
        .filter(PatientDoctorLink.doctor_id == doctor_id)
        .all()
    )

    results = []
    for link, patient in links:
        results.append({
            "id": patient.id,
            "name": patient.email.split("@")[0],  # Fallback since User doesn't have full_name
            "email": patient.email,
            "status": link.status,
            "linked_at": "2023-01-01" # Placeholder or add created_at to Link model if needed
        })
    return results
