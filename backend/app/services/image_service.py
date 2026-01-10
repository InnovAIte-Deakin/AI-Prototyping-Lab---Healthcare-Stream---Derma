from uuid import uuid4
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.config import MEDIA_ROOT
from app.models import Image, PatientDoctorLink


def _write_media_file(file_bytes: bytes, subdir: str = "uploads") -> str:
    """
    Persist uploaded bytes to the media directory and return a relative path.
    """
    file_name = f"{uuid4().hex}.png"
    relative_path = Path(subdir) / file_name
    file_path = (MEDIA_ROOT / relative_path).resolve()
    file_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        with open(file_path, "wb") as destination:
            destination.write(file_bytes)
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store uploaded image",
        ) from exc

    return relative_path.as_posix()


def save_patient_image(db: Session, patient_id: int, file_bytes: bytes) -> Image:
    """
    Persist an uploaded image for a patient that is linked to a doctor.
    """
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    link = (
        db.query(PatientDoctorLink)
        .filter(PatientDoctorLink.patient_id == patient_id)
        .first()
    )
    if not link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient must have a linked doctor before uploading images",
        )

    file_name = _write_media_file(file_bytes)
    image = Image(
        patient_id=patient_id,
        doctor_id=link.doctor_id,
        image_url=file_name,
    )

    db.add(image)
    db.commit()
    db.refresh(image)

    return image
