from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.auth_helpers import get_current_patient
from app.db import get_db
from app.models import User
from app.services.image_service import save_patient_image

router = APIRouter(prefix="/images", tags=["Images"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    current_patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """
    Upload an image for the authenticated patient and link it to their doctor.
    """
    file_bytes = await file.read()
    await file.close()

    image = save_patient_image(
        db=db,
        patient_id=current_patient.id,
        file_bytes=file_bytes,
    )

    return {"image_id": image.id, "image_url": image.image_url}
