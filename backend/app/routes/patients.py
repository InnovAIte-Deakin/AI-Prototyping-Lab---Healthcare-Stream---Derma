"""
Patient routes for account management.

Provides endpoints for patients to manage their own data, including:
- Account deletion (GDPR right to erasure)
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth_helpers import get_current_patient
from app.db import get_db
from app.models import User
from app.services.data_lifecycle_service import delete_patient_account

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.delete("/me")
def delete_my_account(
    current_patient: User = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    """
    Delete the authenticated patient's account and anonymize their data.
    
    This action is IRREVERSIBLE. It will:
    - Mark all doctor links as inactive
    - Delete all uploaded media files
    - Anonymize analysis reports (preserve aggregate statistics)
    - Anonymize chat messages
    - Delete the user account
    
    After deletion, any existing JWT tokens will fail on the next request
    since the user record no longer exists.
    
    Returns:
        Summary of deleted/anonymized items
    """
    result = delete_patient_account(db, current_patient.id)
    
    return {
        "message": "Account deleted successfully",
        "summary": result
    }
