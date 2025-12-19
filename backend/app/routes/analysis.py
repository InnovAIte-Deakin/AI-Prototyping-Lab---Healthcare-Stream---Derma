from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import json
import os
from pathlib import Path

from app.config import MEDIA_ROOT, MEDIA_URL
from app.db import get_db
from app.models import Image, User, AnalysisReport
from app.services.gemini_service import gemini_service
from app.auth_helpers import get_current_user, get_current_patient, get_current_doctor
from app.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/analysis", tags=["AI Analysis"])


def _resolve_image_path(image_url: str) -> Path:
    """
    Translate the stored image URL into an absolute filesystem path.
    """
    candidate = Path(image_url)
    if candidate.exists():
        return candidate

    if image_url.startswith(MEDIA_URL):
        relative_path = image_url[len(MEDIA_URL):].lstrip("/")
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
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Analyze an uploaded skin lesion image using AI
    
    Args:
        image_id: ID of the uploaded image to analyze
        db: Database session
        current_user: The authenticated user
        
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
    
    # Verify user owns this image

    if image.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to analyze this image"
        )
    
    # Check if there's an existing report with doctor_active flag
    existing_report = db.query(AnalysisReport).filter(
        AnalysisReport.image_id == image_id
    ).first()
    
    if existing_report and existing_report.doctor_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI analysis is paused. A doctor is actively reviewing this case."
        )
    
    # If report already exists, return it instead of re-analyzing
    if existing_report:
        analysis_data = json.loads(existing_report.report_json)
        analysis_data["report_id"] = existing_report.id
        analysis_data["review_status"] = existing_report.review_status
        analysis_data["doctor_active"] = existing_report.doctor_active
        return analysis_data
    
    # Check if image file exists
    image_path = image.image_url
    # Handle both absolute and relative paths
    if image_path.startswith("/media/"):
        # Convert URL path to filesystem path
        image_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            image_path.lstrip("/")
        )
    
    if not os.path.exists(image_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image file not found on server"
        )
    
    # Perform AI analysis
    analysis_result = await gemini_service.analyze_skin_lesion(image_path)
    
    if analysis_result["status"] == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{analysis_result.get('message', 'Analysis failed')} Details: {analysis_result.get('error')}"
        )
    
    # Save analysis results to database - include doctor_id from image
    report = AnalysisReport(
        image_id=image.id,
        patient_id=image.patient_id,
        doctor_id=image.doctor_id,  # Include doctor from image upload
        report_json=json.dumps(analysis_result),
        review_status="none",
        doctor_active=False
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    
    # Add report metadata to response
    analysis_result["report_id"] = report.id
    analysis_result["review_status"] = report.review_status
    analysis_result["doctor_active"] = report.doctor_active
    
    return analysis_result


@router.get("/{image_id}")
async def get_analysis(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    
    if image.patient_id != current_user.id:
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
    analysis_data["report_id"] = report.id
    analysis_data["image_id"] = image.id
    analysis_data["report_id"] = report.id
    analysis_data["review_status"] = report.review_status
    analysis_data["doctor_active"] = report.doctor_active
    
    return analysis_data


@router.post("/{image_id}/chat", response_model=ChatResponse)
async def chat_about_lesion_endpoint(
    image_id: int,
    chat_request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient)
):
    """
    Chat with the AI about a specific lesion analysis.
    """
    # Fetch Analysis Report by image_id
    report = db.query(AnalysisReport).filter(AnalysisReport.image_id == image_id).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found for this image"
        )

    # Verify ownership
    if report.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to chat about this analysis"
        )

    # Extract context
    analysis_data = json.loads(report.report_json)
    
    # Call Service
    reply = await gemini_service.chat_about_lesion(analysis_data, chat_request.message)
    
    return ChatResponse(
        image_id=image_id,
        user_message=chat_request.message,
        ai_response=reply,
        context_used=True
    )


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
        data["report_id"] = report.id
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
        data["report_id"] = report.id
        data["image_id"] = report.image_id
        data["created_at"] = report.created_at.isoformat()
        results.append(data)
        
    return results