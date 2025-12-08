from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import os
from pathlib import Path
import json

from app.config import MEDIA_ROOT, MEDIA_URL
from app.db import get_db
from app.models import Image, User, AnalysisReport
from app.services.gemini_service import gemini_service
from app.auth_helpers import get_current_patient, get_current_doctor

router = APIRouter(prefix="/api/analysis", tags=["AI Analysis"])


def _resolve_image_path(image_url: str) -> Path:
    """
    Translate the stored image URL into an absolute filesystem path.
    """
    candidate = Path(image_url)
    if candidate.exists():
        return candidate

    if image_url.startswith(MEDIA_URL):
        relative_path = image_url[len(MEDIA_URL) :].lstrip("/")
        candidate = MEDIA_ROOT / relative_path
        if candidate.exists():
            return candidate

    trimmed = image_url.lstrip("/")
    candidate = MEDIA_ROOT / trimmed
    if candidate.exists():
        return candidate

    candidate = MEDIA_ROOT / Path(image_url).name
    if candidate.exists():
        return candidate

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Image file not found on server",
    )


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
    if user_id and image.patient_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to analyze this image"
        )
    
    # Resolve image path on disk
    image_path = str(_resolve_image_path(image.image_url))
    
    # Perform AI analysis
    analysis_result = gemini_service.analyze_skin_lesion(image_path)
    
    if analysis_result["status"] == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=analysis_result.get("message", "Analysis failed")
        )
    
    # Save analysis results to database
    report = AnalysisReport(
        image_id=image.id,
        patient_id=image.patient_id,
        report_json=json.dumps(analysis_result)
    )
    db.add(report)
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
    
    if user_id and image.patient_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this analysis"
        )
    
    report = db.query(AnalysisReport).filter(AnalysisReport.image_id == image_id).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No analysis found for this image"
        )
    
    analysis_data = json.loads(report.report_json)
    analysis_data["image_id"] = image.id
    
    return analysis_data


@router.get("/patient/reports")
async def get_patient_reports(
    current_patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    List all analysis reports for the current patient.
    """
    reports = db.query(AnalysisReport).filter(
        AnalysisReport.patient_id == current_patient.id
    ).order_by(AnalysisReport.created_at.desc()).all()
    
    results = []
    for report in reports:
        data = json.loads(report.report_json)
        data["id"] = report.id
        data["image_id"] = report.image_id
        data["created_at"] = report.created_at.isoformat()
        results.append(data)
        
    return results


@router.get("/doctor/patients/{patient_id}/reports")
async def get_doctor_patient_reports(
    patient_id: int,
    current_doctor: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    List all analysis reports for a specific patient (Doctor only).
    """
    # Verify patient exists
    patient = db.query(User).filter(User.id == patient_id, User.role == "patient").first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found"
        )
        
    reports = db.query(AnalysisReport).filter(
        AnalysisReport.patient_id == patient_id
    ).order_by(AnalysisReport.created_at.desc()).all()
    
    results = []
    for report in reports:
        data = json.loads(report.report_json)
        data["id"] = report.id
        data["image_id"] = report.image_id
        data["created_at"] = report.created_at.isoformat()
        results.append(data)
        
    return results
