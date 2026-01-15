from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import AnalysisReport, Image, PatientDoctorLink, User


def get_report_or_404(db: Session, report_id: int) -> AnalysisReport:
    report = db.query(AnalysisReport).filter(AnalysisReport.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis report not found",
        )
    return report


def get_image_or_404(db: Session, image_id: int) -> Image:
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    return image


def _doctor_linked_to_patient(db: Session, patient_id: int, doctor_id: int) -> bool:
    if patient_id is None:
        return False
    return (
        db.query(PatientDoctorLink)
        .filter(
            PatientDoctorLink.patient_id == patient_id,
            PatientDoctorLink.doctor_id == doctor_id,
        )
        .first()
        is not None
    )


def ensure_report_access(db: Session, report: AnalysisReport, user: User) -> None:
    if user.role == "patient" and report.patient_id == user.id:
        return

    if user.role == "doctor":
        if report.doctor_id == user.id:
            return
        if _doctor_linked_to_patient(db, report.patient_id, user.id):
            return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Forbidden",
    )


def ensure_image_access(db: Session, image: Image, user: User) -> None:
    if user.role == "patient" and image.patient_id == user.id:
        return

    if user.role == "doctor":
        if image.doctor_id == user.id:
            return
        if _doctor_linked_to_patient(db, image.patient_id, user.id):
            return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Forbidden",
    )


def submit_patient_rating(
    db: Session,
    report_id: int,
    current_patient: User,
    rating: int,
    feedback: str | None,
) -> AnalysisReport:
    report = db.query(AnalysisReport).filter(AnalysisReport.id == report_id).first()
    if not report or report.patient_id != current_patient.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis report not found or you don't have permission",
        )

    if report.review_status != "reviewed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only rate cases after review is complete",
        )

    if report.patient_rating is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already rated this case",
        )

    report.patient_rating = rating
    report.patient_feedback = feedback
    db.commit()
    db.refresh(report)
    return report
