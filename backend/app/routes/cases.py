from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.db import get_db
from app.models import AnalysisReport, User, PatientDoctorLink, ChatMessage
from app.auth_helpers import get_current_user, get_current_patient, get_current_doctor
from app.routes.websocket import manager as ws_manager

router = APIRouter(prefix="/cases", tags=["Cases/Escalation"])

@router.get("/pending")
async def get_pending_cases(
    db: Session = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor)
) -> Any:
    """
    List all pending review requests for patients linked to this doctor.
    """
    # Join with PatientDoctorLink to ensure we only see our own patients' pending requests
    pending = (
        db.query(AnalysisReport, User.email)
        .join(User, AnalysisReport.patient_id == User.id)
        .join(PatientDoctorLink, PatientDoctorLink.patient_id == User.id)
        .filter(
            PatientDoctorLink.doctor_id == current_doctor.id,
            AnalysisReport.review_status == "pending"
        )
        .all()
    )

    return [
        {
            "report_id": report.id,
            "patient_id": report.patient_id,
            "patient_email": email,
            "condition": report.condition,
            "created_at": report.created_at,
            "review_status": report.review_status
        }
        for report, email in pending
    ]

@router.post("/{report_id}/request-review")
async def request_doctor_review(
    report_id: int,
    db: Session = Depends(get_db),
    current_patient: User = Depends(get_current_patient)
) -> Dict[str, Any]:
    """
    Patient requests a doctor review for an existing analysis report.
    """
    report = db.query(AnalysisReport).filter(
        AnalysisReport.id == report_id,
        AnalysisReport.patient_id == current_patient.id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis report not found or you don't have permission"
        )

    # Constraint: Only one active case (pending or accepted) per patient
    active_case = db.query(AnalysisReport).filter(
        AnalysisReport.patient_id == current_patient.id,
        AnalysisReport.review_status.in_(["pending", "accepted"])
    ).first()

    if active_case:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active case with a doctor. Please complete it before escalating another."
        )

    if report.review_status != "none":
        return {
            "message": f"Review already in status: {report.review_status}",
            "review_status": report.review_status
        }

    report.review_status = "pending"
    db.commit()
    db.refresh(report)

    return {
        "message": "Doctor review requested successfully",
        "report_id": report.id,
        "review_status": report.review_status
    }

@router.post("/{report_id}/accept")
async def accept_case(
    report_id: int,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor)
) -> Dict[str, Any]:
    """
    Doctor accepts a pending review request.
    """
    report = db.query(AnalysisReport).filter(AnalysisReport.id == report_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Analysis report not found")

    if report.review_status != "pending":
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot accept case in status: {report.review_status}"
        )

    # In a real app, we'd also check if the doctor is linked to the patient
    # For now, let's assign the current doctor
    report.doctor_id = current_doctor.id
    report.review_status = "accepted"
    report.doctor_active = True
    
    # Add system message to chat
    system_msg = ChatMessage(
        report_id=report.id,
        sender_role="system",
        message="A physician has been assigned to your case and will respond shortly."
    )
    db.add(system_msg)
    
    db.commit()
    db.refresh(report)
    db.refresh(system_msg)
    
    # Broadcast to connected WebSocket clients
    conns = ws_manager.connections.get(report.id, {})
    print(f"[Cases] ACCEPT: Found {len(conns)} active connections for report {report.id}")
    
    broadcast_data = {
        "type": "new_message",
        "id": system_msg.id,
        "sender_role": "system",
        "sender_id": None,
        "message": system_msg.message,
        "created_at": system_msg.created_at.isoformat()
    }
    
    # Broadcast asynchronously to all connected users for this report
    import asyncio
    for user_id, ws in conns.items():
        try:
            print(f"[Cases] Broadcasting to user {user_id}")
            asyncio.create_task(ws.send_json(broadcast_data))
        except Exception as e:
            print(f"[Cases] Error broadcasting to {user_id}: {e}")

    return {
        "message": "Case accepted",
        "report_id": report.id,
        "review_status": report.review_status,
        "doctor_active": report.doctor_active
    }

@router.post("/{report_id}/complete")
async def complete_case(
    report_id: int,
    db: Session = Depends(get_db),
    current_doctor: User = Depends(get_current_doctor)
) -> Dict[str, Any]:
    """
    Doctor marks a case as reviewed/complete.
    """
    report = db.query(AnalysisReport).filter(
        AnalysisReport.id == report_id,
        AnalysisReport.doctor_id == current_doctor.id
    ).first()

    if not report:
        raise HTTPException(
            status_code=404, 
            detail="Analysis report not found or you are not the assigned doctor"
        )

    report.review_status = "reviewed"
    report.doctor_active = False
    
    # Add system message to chat
    system_msg = ChatMessage(
        report_id=report.id,
        sender_role="system",
        message="The physician has closed this consultation. You can continue chatting with the AI assistant if you have further questions."
    )
    db.add(system_msg)
    
    db.commit()
    db.refresh(report)
    db.refresh(system_msg)
    
    # Broadcast to connected WebSocket clients
    conns = ws_manager.connections.get(report.id, {})
    print(f"[Cases] COMPLETE: Found {len(conns)} active connections for report {report.id}")

    broadcast_data = {
        "type": "new_message",
        "id": system_msg.id,
        "sender_role": "system",
        "sender_id": None,
        "message": system_msg.message,
        "created_at": system_msg.created_at.isoformat()
    }
    
    import asyncio
    for user_id, ws in conns.items():
        try:
            print(f"[Cases] Broadcasting to user {user_id}")
            asyncio.create_task(ws.send_json(broadcast_data))
        except Exception as e:
             print(f"[Cases] Error broadcasting to {user_id}: {e}")

    return {
        "message": "Case review completed",
        "report_id": report.id,
        "review_status": report.review_status,
        "doctor_active": report.doctor_active
    }
