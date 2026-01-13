from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import AnalysisReport, DoctorChangeLog, DoctorProfile, PatientDoctorLink, User

DEFAULT_AVATAR_URL = "https://placehold.co/128x128?text=Dr"
DEFAULT_CLINIC_NAME = "Clinic not provided"
DEFAULT_BIO = "Doctor profile coming soon"


def _safe_value(value: Optional[str], fallback: str) -> str:
    """Return a non-empty string for serialization."""
    return value if value not in (None, "") else fallback

def _doctor_response(user: User, profile: DoctorProfile) -> Dict[str, object]:
    """Shape a doctor record with profile details."""
    return {
        "id": user.id,
        "email": user.email,
        "full_name": _safe_value(profile.full_name, "Doctor"),
        "clinic_name": _safe_value(profile.clinic_name, DEFAULT_CLINIC_NAME),
        "bio": _safe_value(profile.bio, DEFAULT_BIO),
        "avatar_url": _safe_value(profile.avatar_url, DEFAULT_AVATAR_URL),
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


def has_active_case(db: Session, patient_id: int) -> bool:
    """
    Check if patient has any pending or accepted cases.
    
    These statuses indicate the doctor is actively involved with a case,
    so switching doctors should be blocked.
    """
    active_statuses = ["pending", "accepted"]
    return db.query(AnalysisReport).filter(
        AnalysisReport.patient_id == patient_id,
        AnalysisReport.review_status.in_(active_statuses)
    ).first() is not None


def change_patient_doctor(
    db: Session, 
    patient_id: int, 
    new_doctor_id: int,
    reason: Optional[str] = None
) -> Dict[str, object]:
    """
    Change patient's doctor with validation.
    
    - Blocks if patient has active (pending/accepted) cases
    - Uses SELECT FOR UPDATE to prevent race conditions
    - Logs the change in DoctorChangeLog
    
    Args:
        db: Database session
        patient_id: ID of the patient
        new_doctor_id: ID of the new doctor to link
        reason: Optional reason for the change
        
    Returns:
        Dict with doctor info, status, and previous_doctor_id
        
    Raises:
        HTTPException: 404 if no current link, 400 if active case blocks change
    """
    # Acquire lock on PatientDoctorLink row to prevent race conditions
    link = db.query(PatientDoctorLink).filter(
        PatientDoctorLink.patient_id == patient_id
    ).with_for_update().first()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No doctor currently linked. Use select-doctor instead."
        )
    
    # Check for active cases
    if has_active_case(db, patient_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change doctor while you have an active case (pending or accepted). Please wait for the doctor to complete their review."
        )
    
    # Cannot change to the same doctor
    if link.doctor_id == new_doctor_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already linked to this doctor."
        )
    
    old_doctor_id = link.doctor_id
    
    # Validate new doctor exists
    new_doctor, profile = _get_doctor_with_profile(db, new_doctor_id)
    
    # Log the change
    log = DoctorChangeLog(
        patient_id=patient_id,
        old_doctor_id=old_doctor_id,
        new_doctor_id=new_doctor_id,
        reason=reason
    )
    db.add(log)
    
    # Update the link
    link.doctor_id = new_doctor_id
    link.status = "active"
    
    db.commit()
    db.refresh(link)
    
    return {
        "doctor": _doctor_response(new_doctor, profile),
        "status": link.status,
        "previous_doctor_id": old_doctor_id
    }
