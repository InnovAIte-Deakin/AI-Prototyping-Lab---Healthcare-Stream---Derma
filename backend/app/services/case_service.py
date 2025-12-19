"""
Case workflow service layer.

Implements business logic for:
- Doctor review requests
- Case acceptance
- Chat history management
- Permission verification
"""

from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import AnalysisReport, ChatMessage, PatientDoctorLink, Image, User


def verify_doctor_patient_link(db: Session, doctor_id: int, patient_id: int) -> bool:
    """
    Verify that a doctor-patient link exists and is active.
    
    Args:
        db: Database session
        doctor_id: ID of the doctor
        patient_id: ID of the patient
        
    Returns:
        True if link exists and is active
    """
    link = db.query(PatientDoctorLink).filter(
        PatientDoctorLink.doctor_id == doctor_id,
        PatientDoctorLink.patient_id == patient_id,
        PatientDoctorLink.status == "active"
    ).first()
    return link is not None


def verify_case_access(
    db: Session, 
    report_id: int, 
    user_id: int, 
    user_role: str
) -> AnalysisReport:
    """
    Verify user has access to a case and return the report.
    
    Args:
        db: Database session
        report_id: ID of the analysis report
        user_id: ID of the requesting user
        user_role: Role of the requesting user (patient/doctor)
        
    Returns:
        AnalysisReport if access is granted
        
    Raises:
        HTTPException: 404 if report not found, 403 if access denied
    """
    report = db.query(AnalysisReport).filter(AnalysisReport.id == report_id).first()
    
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case not found"
        )
    
    if user_role == "patient":
        if report.patient_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. This is not your case."
            )
    elif user_role == "doctor":
        if not verify_doctor_patient_link(db, user_id, report.patient_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Patient is not linked to you."
            )
    
    return report


def request_doctor_review(
    db: Session, 
    report_id: int, 
    patient_id: int
) -> Dict[str, Any]:
    """
    Patient requests a doctor review for their case.
    
    Args:
        db: Database session
        report_id: ID of the analysis report
        patient_id: ID of the patient making the request
        
    Returns:
        Dict with report_id, review_status, and message
    """
    report = verify_case_access(db, report_id, patient_id, "patient")
    
    if report.review_status == "pending":
        return {
            "report_id": report.id,
            "review_status": report.review_status,
            "message": "Review already requested"
        }
    
    if report.review_status in ["accepted", "reviewed"]:
        return {
            "report_id": report.id,
            "review_status": report.review_status,
            "message": "Doctor has already responded to this case"
        }
    
    # Check if patient has a linked doctor
    link = db.query(PatientDoctorLink).filter(
        PatientDoctorLink.patient_id == patient_id,
        PatientDoctorLink.status == "active"
    ).first()
    
    if not link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must select a doctor before requesting a review"
        )
    
    # Update the report with the linked doctor
    report.review_status = "pending"
    report.doctor_id = link.doctor_id
    db.commit()
    db.refresh(report)
    
    return {
        "report_id": report.id,
        "review_status": report.review_status,
        "message": "Review request sent to your doctor"
    }


def accept_review(
    db: Session, 
    report_id: int, 
    doctor_id: int
) -> Dict[str, Any]:
    """
    Doctor accepts a pending review request.
    
    Args:
        db: Database session
        report_id: ID of the analysis report
        doctor_id: ID of the doctor accepting
        
    Returns:
        Dict with report_id, review_status, doctor_active, and message
    """
    report = verify_case_access(db, report_id, doctor_id, "doctor")
    
    if report.review_status == "none":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No review has been requested for this case"
        )
    
    if report.review_status in ["accepted", "reviewed"]:
        return {
            "report_id": report.id,
            "review_status": report.review_status,
            "doctor_active": report.doctor_active,
            "message": "Review already accepted"
        }
    
    report.review_status = "accepted"
    report.doctor_active = True
    db.commit()
    db.refresh(report)
    
    return {
        "report_id": report.id,
        "review_status": report.review_status,
        "doctor_active": report.doctor_active,
        "message": "Review accepted. AI responses are now paused."
    }


def get_chat_history(
    db: Session, 
    report_id: int, 
    user_id: int, 
    user_role: str
) -> Dict[str, Any]:
    """
    Get chat history for a case, including AI analysis as the first message.
    
    Args:
        db: Database session
        report_id: ID of the analysis report
        user_id: ID of the requesting user
        user_role: Role of the requesting user
        
    Returns:
        Dict with report_id, doctor_active, review_status, and messages list
    """
    report = verify_case_access(db, report_id, user_id, user_role)
    
    # Get all chat messages
    messages = db.query(ChatMessage).filter(
        ChatMessage.report_id == report_id
    ).order_by(ChatMessage.created_at.asc()).all()
    
    # Convert to response format
    message_list = [
        {
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_role": msg.sender_role,
            "message": msg.message,
            "created_at": msg.created_at
        }
        for msg in messages
    ]
    
    return {
        "report_id": report.id,
        "doctor_active": report.doctor_active,
        "review_status": report.review_status,
        "messages": message_list
    }


def add_chat_message(
    db: Session, 
    report_id: int, 
    sender_id: int, 
    sender_role: str, 
    message: str
) -> ChatMessage:
    """
    Add a message to the case chat.
    
    Args:
        db: Database session
        report_id: ID of the analysis report
        sender_id: ID of the message sender
        sender_role: Role of the sender (patient/doctor/ai)
        message: Message content
        
    Returns:
        Created ChatMessage object
    """
    report = verify_case_access(db, report_id, sender_id, sender_role)
    
    # If doctor sends a message, mark case as reviewed
    if sender_role == "doctor" and report.review_status == "accepted":
        report.review_status = "reviewed"
        db.commit()
    
    chat_message = ChatMessage(
        report_id=report_id,
        sender_id=sender_id,
        sender_role=sender_role,
        message=message
    )
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)
    
    return chat_message


def get_patient_cases(db: Session, patient_id: int) -> List[Dict[str, Any]]:
    """
    Get all cases for a patient with image URLs.
    
    Args:
        db: Database session
        patient_id: ID of the patient
        
    Returns:
        List of case dictionaries
    """
    reports = db.query(AnalysisReport, Image).join(
        Image, AnalysisReport.image_id == Image.id
    ).filter(
        AnalysisReport.patient_id == patient_id
    ).order_by(AnalysisReport.created_at.desc()).all()
    
    return [
        {
            "id": report.id,
            "image_id": report.image_id,
            "image_url": image.image_url,
            "patient_id": report.patient_id,
            "doctor_id": report.doctor_id,
            "review_status": report.review_status,
            "doctor_active": report.doctor_active,
            "created_at": report.created_at,
            "report_json": report.report_json
        }
        for report, image in reports
    ]


def get_doctor_cases(
    db: Session, 
    doctor_id: int, 
    status_filter: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Get cases assigned to a doctor, optionally filtered by status.
    
    Args:
        db: Database session
        doctor_id: ID of the doctor
        status_filter: Optional filter for review_status
        
    Returns:
        List of case dictionaries
    """
    query = db.query(AnalysisReport, Image, User).join(
        Image, AnalysisReport.image_id == Image.id
    ).join(
        User, AnalysisReport.patient_id == User.id
    ).filter(
        AnalysisReport.doctor_id == doctor_id
    )
    
    if status_filter:
        query = query.filter(AnalysisReport.review_status == status_filter)
    
    reports = query.order_by(AnalysisReport.created_at.desc()).all()
    
    return [
        {
            "id": report.id,
            "image_id": report.image_id,
            "image_url": image.image_url,
            "patient_id": report.patient_id,
            "patient_email": patient.email,
            "doctor_id": report.doctor_id,
            "review_status": report.review_status,
            "doctor_active": report.doctor_active,
            "created_at": report.created_at,
            "report_json": report.report_json
        }
        for report, image, patient in reports
    ]
