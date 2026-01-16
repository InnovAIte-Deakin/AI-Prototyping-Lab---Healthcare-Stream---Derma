from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.auth_helpers import get_current_patient
from app.db import get_db
from app.models import User
from app.services.image_service import save_patient_image
from app.services.media_service import create_signed_media_url
from app.config import MAX_UPLOAD_SIZE_MB, ALLOWED_IMAGE_TYPES
from fastapi import HTTPException

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
    # 1. Validate File Type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )

    # 2. Validate File Size
    # Read a chunk to check size without loading entire file into memory if it's huge
    # But for 5MB, reading it is fine. 
    file_bytes = await file.read()
    
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_SIZE_MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large: {size_mb:.2f}MB. Maximum allowed is {MAX_UPLOAD_SIZE_MB}MB."
        )

    await file.close()

    image = save_patient_image(
        db=db,
        patient_id=current_patient.id,
        file_bytes=file_bytes,
    )

    return {"image_id": image.id, "image_url": create_signed_media_url(image.image_url)}
