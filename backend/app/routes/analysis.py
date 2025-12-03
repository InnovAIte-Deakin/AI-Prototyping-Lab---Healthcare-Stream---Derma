from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any
import os

from app.db import get_db
from app.models import Image, User
from app.services.ai_service import ai_service

router = APIRouter(prefix="/api/analysis", tags=["AI Analysis"])


@router.post("/{image_id}")
async def analyze_image(
    image_id: int,
    db: Session = Depends(get_db),
    user_id: int = None  # This should come from auth middleware
) -> Dict[str, Any]:
    """
    Analyze an uploaded skin lesion image using AI
    
    Args:
        image_id: ID of the uploaded image to analyze
        db: Database session
        user_id: ID of the authenticated user
        
    Returns:
        AI analysis results
    """
    # Fetch the image from database
    image = db.query(Image).filter(Image.id == image_id).first()
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    # Verify user owns this image (if user_id is provided)
    if user_id and image.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to analyze this image"
        )
    
    # Check if image file exists
    image_path = f"media/{image.file_path}"
    if not os.path.exists(image_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image file not found on server"
        )
    
    # Perform AI analysis
    analysis_result = ai_service.analyze_skin_lesion(image_path)
    
    if analysis_result["status"] == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=analysis_result.get("message", "Analysis failed")
        )
    
    # Optionally: Save analysis results to database
    # You might want to add an 'analysis' field to your Image model
    image.analysis = analysis_result["analysis"]
    db.commit()
    
    return analysis_result


@router.get("/{image_id}")
async def get_analysis(
    image_id: int,
    db: Session = Depends(get_db),
    user_id: int = None
) -> Dict[str, Any]:
    """
    Retrieve existing analysis for an image
    """
    image = db.query(Image).filter(Image.id == image_id).first()
    
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    if user_id and image.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this analysis"
        )
    
    if not image.analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No analysis found for this image"
        )
    
    return {
        "status": "success",
        "analysis": image.analysis,
        "image_id": image.id
    }