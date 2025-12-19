"""
Case workflow routes.

Implements doctor-patient workflow:
- Patient: view cases, request review
- Doctor: view pending cases, accept review, send messages
- Both: view chat history
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db import get_db
from app.auth_helpers import get_current_user, get_current_patient, get_current_doctor
from app.models import User
from app.schemas import (
    CaseListResponse,
    CaseResponse,
    RequestReviewResponse,
    AcceptReviewResponse,
    ChatHistoryResponse,
    ChatMessageCreate,
    ChatMessageResponse
)
from app.services.case_service import (
    request_doctor_review,
    accept_review,
    get_chat_history,
    add_chat_message,
    get_patient_cases,
    get_doctor_cases
)

router = APIRouter(prefix="/cases", tags=["Cases"])


# ============================================================================
# PATIENT ENDPOINTS
# ============================================================================

@router.get("", response_model=CaseListResponse)
async def list_my_cases(
    current_patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db)
) -> CaseListResponse:
    """
    List all cases for the current patient.
    
    Returns cases with their images, review status, and doctor assignment.
    """
    cases = get_patient_cases(db, current_patient.id)
    return CaseListResponse(cases=[CaseResponse(**case) for case in cases])


@router.post("/{report_id}/request-review", response_model=RequestReviewResponse)
async def request_review(
    report_id: int,
    current_patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db)
) -> RequestReviewResponse:
    """
    Request a doctor review for a case.
    
    Sets the case status to 'pending' and assigns the patient's linked doctor.
    """
    result = request_doctor_review(db, report_id, current_patient.id)
    return RequestReviewResponse(**result)


# ============================================================================
# DOCTOR ENDPOINTS
# ============================================================================

@router.get("/doctor/pending", response_model=CaseListResponse)
async def list_pending_cases(
    current_doctor: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
) -> CaseListResponse:
    """
    List all pending review requests for the current doctor.
    """
    cases = get_doctor_cases(db, current_doctor.id, status_filter="pending")
    return CaseListResponse(cases=[CaseResponse(**case) for case in cases])


@router.get("/doctor/all", response_model=CaseListResponse)
async def list_all_doctor_cases(
    status: Optional[str] = Query(None, description="Filter by review_status"),
    current_doctor: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
) -> CaseListResponse:
    """
    List all cases assigned to the current doctor.
    
    Optionally filter by status: none, pending, accepted, reviewed
    """
    cases = get_doctor_cases(db, current_doctor.id, status_filter=status)
    return CaseListResponse(cases=[CaseResponse(**case) for case in cases])


@router.post("/{report_id}/accept", response_model=AcceptReviewResponse)
async def accept_case_review(
    report_id: int,
    current_doctor: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
) -> AcceptReviewResponse:
    """
    Accept a pending review request.
    
    Sets doctor_active=True to pause AI responses.
    """
    result = accept_review(db, report_id, current_doctor.id)
    return AcceptReviewResponse(**result)


# ============================================================================
# SHARED ENDPOINTS (Patient & Doctor)
# ============================================================================

@router.get("/{report_id}/chat", response_model=ChatHistoryResponse)
async def get_case_chat(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ChatHistoryResponse:
    """
    Get chat history for a case.
    
    Returns all messages including AI analysis context.
    Both patient (owner) and linked doctor can access.
    """
    result = get_chat_history(db, report_id, current_user.id, current_user.role)
    return ChatHistoryResponse(**result)


@router.post("/{report_id}/chat", response_model=ChatMessageResponse)
async def send_chat_message(
    report_id: int,
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ChatMessageResponse:
    """
    Send a message in the case chat.
    
    - Doctors can send messages to patients
    - Patients can send messages (future feature)
    - When doctor sends first message, case is marked as 'reviewed'
    """
    message = add_chat_message(
        db=db,
        report_id=report_id,
        sender_id=current_user.id,
        sender_role=current_user.role,
        message=payload.message
    )
    return ChatMessageResponse(
        id=message.id,
        sender_id=message.sender_id,
        sender_role=message.sender_role,
        message=message.message,
        created_at=message.created_at
    )
