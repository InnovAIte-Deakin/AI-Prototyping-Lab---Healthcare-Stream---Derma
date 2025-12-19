"""
Image upload routes.

Implements Task B5 - Image Uploads with doctor assignment.
"""

import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.db import get_db
from app.auth_helpers import get_current_patient
from app.models import Image, User, PatientDoctorLink
from app.schemas import ImageUploadResponse

router = APIRouter(prefix="/images", tags=["Images"])

# Ensure media directory exists
MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "media")
os.makedirs(MEDIA_DIR, exist_ok=True)


@router.post("", response_model=ImageUploadResponse)
async def upload_image(
    image: UploadFile = File(...),
    current_patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db)
) -> ImageUploadResponse:
    """
    Upload a skin lesion image for analysis.
    
    Requires the patient to have a linked doctor before uploading.
    The image is saved to the media directory and an Image record is created.
    
    Args:
        image: The uploaded image file
        current_patient: The authenticated patient user
        db: Database session
        
    Returns:
        ImageUploadResponse with image_id, image_url, and doctor_id
        
    Raises:
        HTTPException 400: If patient has no linked doctor
        HTTPException 400: If file type is not supported
    """
    # Check if patient has a linked doctor
    link = db.query(PatientDoctorLink).filter(
        PatientDoctorLink.patient_id == current_patient.id,
        PatientDoctorLink.status == "active"
    ).first()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must select a doctor before uploading images"
        )
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {image.content_type}. Allowed: {', '.join(allowed_types)}"
        )
    
    # Generate unique filename
    file_extension = image.filename.split(".")[-1] if "." in image.filename else "png"
    filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(MEDIA_DIR, filename)
    
    # Save file to disk
    try:
        content = await image.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save image: {str(e)}"
        )
    
    # Create database record
    # Store relative path for portability
    image_url = f"/media/{filename}"
    
    db_image = Image(
        patient_id=current_patient.id,
        doctor_id=link.doctor_id,
        image_url=image_url
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    
    return ImageUploadResponse(
        image_id=db_image.id,
        image_url=image_url,
        doctor_id=link.doctor_id
    )
