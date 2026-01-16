from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Dict, Any, List
import json
from app.services.media_service import resolve_media_path
from app.db import get_db
from app.models import Image, User, AnalysisReport, ChatMessage, DoctorProfile
from app.services.gemini_service import get_gemini_service
from app.auth_helpers import get_current_user, get_current_patient, get_current_doctor
from app.schemas import ChatRequest, ChatResponse
from app.services.report_service import (
    ensure_image_access,
    ensure_report_access,
    get_image_or_404,
    get_report_or_404,
)

router = APIRouter(prefix="/api/analysis", tags=["AI Analysis"])




@router.post("/{image_id}")
async def analyze_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_patient)
) -> Dict[str, Any]:
    """
    Analyze an uploaded skin lesion image using AI
    
    Args:
        image_id: ID of the uploaded image to analyze
        db: Database session
        current_user: Authenticated patient user
        
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
    
    # Resolve image path on disk
    image_path = str(resolve_media_path(image.image_url))
    
    # Perform AI analysis
    analysis_result = await get_gemini_service().analyze_skin_lesion(image_path)
    
    if analysis_result["status"] == "error":
        error_code = analysis_result.get('error', 'Unknown error')
        error_msg = analysis_result.get('message', 'Failed to analyze the image.')
        print(f"[Analysis] Error encountered: {error_code} - {error_msg}")
        
        # Create descriptive fallback based on error code
        recommendation = "The AI service is currently unavailable. Please escalate this case to a human physician for review."
        explanation = f"Service Error: {error_msg}. Please try again later or consult a doctor directly."
        
        if error_code == "TIMEOUT":
            explanation = "The AI analysis took too long to respond. This can happen with very high-resolution images or high server load."
        elif error_code == "API_KEY_MISSING":
            explanation = "The AI service is not properly configured. Please contact the administrator."

        # Create fallback result so user flow isn't blocked
        fallback_result = {
            "status": "error",
            "error_code": error_code,
            "condition": "Analysis Unavailable",
            "severity": "Unknown",
            "confidence": 0,
            "recommendation": recommendation,
            "explanation": explanation,
            "precautions": ["Consult a doctor"],
            "is_fallback": True
        }
        
        # We continue to save this as a valid (but error-state) report
        # This allows the user to still use the chat and escalate features
        report = AnalysisReport(
            image_id=image.id,
            report_json=fallback_result, # SQLAlchemy handles dict to JSON if configured, or use json.dumps
            patient_id=current_user.id
        )
        # Note: AnalysisReport.report_json is Text in models.py, so we should dumps it if not handled by SQLAlchemy
        if isinstance(report.report_json, dict):
            report.report_json = json.dumps(report.report_json)

        db.add(report)
        db.commit()
        db.refresh(report)
        
        # Add a system message to the chat explaining the situation
        system_msg = ChatMessage(
            report_id=report.id,
            sender_role="system",
            message=f"⚠️ Analysis Unavailable: {explanation}\n\nYou can still discuss this with our team or escalate it for human review."
        )
        db.add(system_msg)
        db.commit()
        
        # Add return fields
        fallback_result["report_id"] = report.id
        fallback_result["image_id"] = image.id
        fallback_result["review_status"] = report.review_status
        fallback_result["doctor_active"] = report.doctor_active
        
        return fallback_result
    
    # Save analysis results to database
    report = AnalysisReport(
        image_id=image.id,
        report_json=json.dumps(analysis_result),
        patient_id=current_user.id
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    
    # Add report ID and tracking to response
    analysis_result["report_id"] = report.id
    analysis_result["image_id"] = image.id
    analysis_result["review_status"] = report.review_status
    analysis_result["doctor_active"] = report.doctor_active
    
    # --- PHASE 4: Seed initial AI message ---
    msg_text = f"Hello! I've analyzed your image. Based on the scan, I detect signs of {analysis_result.get('condition', 'Unknown')}. My confidence is {int(analysis_result.get('confidence', 0)) or 0}%. {analysis_result.get('recommendation', '')}"
    
    first_msg = ChatMessage(
        report_id=report.id,
        sender_role="ai",
        message=msg_text
    )
    db.add(first_msg)
    db.commit()
    
    return analysis_result


@router.get("/report/{report_id}")
async def get_analysis_by_report_id(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Retrieve existing analysis by report ID
    """
    report = get_report_or_404(db, report_id)
    image = get_image_or_404(db, report.image_id)
    ensure_report_access(db, report, current_user)
    
    analysis_data = report.report_json
    if isinstance(analysis_data, str):
        analysis_data = json.loads(analysis_data)
    
    analysis_data["report_id"] = report.id
    analysis_data["image_id"] = report.image_id
    analysis_data["review_status"] = report.review_status
    analysis_data["doctor_active"] = report.doctor_active
    analysis_data["patient_rating"] = report.patient_rating
    analysis_data["patient_feedback"] = report.patient_feedback
    analysis_data["created_at"] = report.created_at.isoformat()
    
    # Include doctor details if assigned
    if report.doctor_id:
        doctor_profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == report.doctor_id).first()
        if doctor_profile:
            analysis_data["doctor"] = {
                "full_name": doctor_profile.full_name,
                "avatar_url": doctor_profile.avatar_url,
                "clinic_name": doctor_profile.clinic_name
            }

    return analysis_data


@router.get("/image/{image_id}")
async def get_analysis_by_image_id(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Retrieve existing analysis for an image by image ID
    """
    image = get_image_or_404(db, image_id)
    ensure_image_access(db, image, current_user)
    
    report = db.query(AnalysisReport).filter(AnalysisReport.image_id == image_id).order_by(desc(AnalysisReport.created_at)).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No analysis found for this image"
        )
    
    analysis_data = report.report_json
    if isinstance(analysis_data, str):
        analysis_data = json.loads(analysis_data)
        
    analysis_data["report_id"] = report.id
    analysis_data["image_id"] = image.id
    analysis_data["review_status"] = report.review_status
    analysis_data["doctor_active"] = report.doctor_active
    analysis_data["patient_rating"] = report.patient_rating
    analysis_data["patient_feedback"] = report.patient_feedback
    analysis_data["created_at"] = report.created_at.isoformat()

    # Include doctor details if assigned
    if report.doctor_id:
        doctor_profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == report.doctor_id).first()
        if doctor_profile:
            analysis_data["doctor"] = {
                "full_name": doctor_profile.full_name,
                "avatar_url": doctor_profile.avatar_url,
                "clinic_name": doctor_profile.clinic_name
            }
    
    return analysis_data


@router.get("/{image_id}/chat")
async def get_chat_history(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get chat history for a specific analysis (Patient or Doctor).
    """
    report = db.query(AnalysisReport).filter(AnalysisReport.image_id == image_id).order_by(desc(AnalysisReport.created_at)).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Analysis report not found")
        
    # Permission check: Patient owner OR associated Doctor
    is_patient = current_user.role == "patient" and report.patient_id == current_user.id
    is_doctor = current_user.role == "doctor" and (report.doctor_id == current_user.id or report.review_status == "pending")
    
    if not (is_patient or is_doctor):
        raise HTTPException(status_code=403, detail="Forbidden")
        
    messages = db.query(ChatMessage).filter(ChatMessage.report_id == report.id).order_by(ChatMessage.created_at.asc()).all()
    
    return [
        {
            "id": m.id,
            "sender_role": m.sender_role,
            "sender_id": m.sender_id,
            "message": m.message,
            "created_at": m.created_at.isoformat()
        } for m in messages
    ]

@router.post("/{image_id}/chat", response_model=ChatResponse)
async def chat_about_lesion_endpoint(
    image_id: int,
    chat_request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Unified chat endpoint. Handles Patient -> AI, Patient -> Doctor, and Doctor -> Patient.
    AI responds only if doctor_active is False.
    """
    # Fetch Analysis Report by image_id
    report = db.query(AnalysisReport).filter(AnalysisReport.image_id == image_id).order_by(desc(AnalysisReport.created_at)).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Analysis not found")

    # Permission check
    is_patient = current_user.role == "patient" and report.patient_id == current_user.id
    is_doctor = current_user.role == "doctor" and report.doctor_id == current_user.id
    
    if not (is_patient or is_doctor):
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Save incoming message
    new_msg = ChatMessage(
        report_id=report.id,
        sender_id=current_user.id,
        sender_role=current_user.role,
        message=chat_request.message
    )
    db.add(new_msg)
    
    ai_reply = None
    # AI responds ONLY to patient and ONLY if doctor is not active
    if is_patient and not report.doctor_active:
        # Get history for context
        history = db.query(ChatMessage).filter(ChatMessage.report_id == report.id).all()
        
        # Call AI
        analysis_data = report.report_json
        if isinstance(analysis_data, str):
            analysis_data = json.loads(analysis_data)
        ai_reply = await get_gemini_service().chat_about_lesion(analysis_data, chat_request.message, history=history)
        
        # Save AI message
        ai_msg = ChatMessage(
            report_id=report.id,
            sender_role="ai",
            message=ai_reply
        )
        db.add(ai_msg)

    db.commit()

    # Determine response message:
    # - If AI replied, use that response
    # - If patient sent to active doctor, confirm message was sent to doctor
    # - Otherwise (doctor sending), confirm message was sent to patient
    if ai_reply:
        response_message = ai_reply
    elif is_patient and report.doctor_active:
        response_message = "Message sent to doctor."
    else:
        response_message = "Message sent to patient."

    return ChatResponse(
        image_id=image_id,
        user_message=chat_request.message,
        ai_response=response_message,
        context_used=True if ai_reply else False
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
        data = report.report_json
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                data = {}
        
        if not isinstance(data, dict):
            data = {}

        data["report_id"] = report.id
        data["image_id"] = report.image_id
        data["review_status"] = report.review_status
        data["doctor_active"] = report.doctor_active
        data["patient_rating"] = report.patient_rating
        data["patient_feedback"] = report.patient_feedback
        data["created_at"] = report.created_at.isoformat()
        data["doctor_id"] = report.doctor_id
        
        # Fetch doctor name if doctor_id exists (for historical display - S2-4)
        if report.doctor_id:
            profile = db.query(DoctorProfile).filter(
                DoctorProfile.user_id == report.doctor_id
            ).first()
            data["doctor_name"] = profile.full_name if profile else None
        else:
            data["doctor_name"] = None
            
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
        data = report.report_json
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                data = {}
        
        if not isinstance(data, dict):
            data = {}

        data["report_id"] = report.id
        data["image_id"] = report.image_id
        data["review_status"] = report.review_status
        data["doctor_active"] = report.doctor_active
        data["patient_rating"] = report.patient_rating
        data["patient_feedback"] = report.patient_feedback
        data["created_at"] = report.created_at.isoformat()
        results.append(data)
        
    return results
