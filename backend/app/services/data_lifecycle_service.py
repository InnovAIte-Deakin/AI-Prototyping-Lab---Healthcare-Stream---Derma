"""
Data Lifecycle Service

Handles patient data deletion, anonymization, and retention enforcement.
Provides safe file operations with path traversal protection.
"""

import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.config import (
    MEDIA_ROOT,
    MEDIA_RETENTION_DAYS,
    CHAT_RETENTION_DAYS,
    ANALYSIS_RETENTION_DAYS,
)
from app.models import (
    User,
    Image,
    AnalysisReport,
    ChatMessage,
    PatientDoctorLink,
    DoctorChangeLog,
)

logger = logging.getLogger("app.data_lifecycle")

# Placeholder for anonymized patient references
DELETED_PATIENT_PLACEHOLDER = "[Deleted Patient]"
DELETED_MESSAGE_PLACEHOLDER = "[Message deleted by user]"


def _is_safe_path(base: Path, target: Path) -> bool:
    """
    Ensure target path is safely under base directory.
    Prevents path traversal attacks (e.g., ../../etc/passwd).
    
    Args:
        base: The allowed base directory
        target: The path to validate
        
    Returns:
        True if target is safely within base, False otherwise
    """
    try:
        # Resolve both paths to absolute, normalized forms
        resolved_base = base.resolve()
        resolved_target = target.resolve()
        # Check if target is relative to base
        resolved_target.relative_to(resolved_base)
        return True
    except ValueError:
        return False


def safe_delete_file(relative_path: str) -> bool:
    """
    Safely delete a media file with path traversal protection.
    
    Args:
        relative_path: Path relative to MEDIA_ROOT
        
    Returns:
        True if file was deleted, False if file didn't exist or was blocked
    """
    if not relative_path:
        return False
        
    target_path = MEDIA_ROOT / relative_path
    
    # Security check: ensure we're not deleting outside MEDIA_ROOT
    if not _is_safe_path(MEDIA_ROOT, target_path):
        logger.warning(
            "Path traversal attempt blocked",
            extra={"attempted_path": relative_path}
        )
        return False
    
    try:
        resolved_path = target_path.resolve()
        if resolved_path.exists() and resolved_path.is_file():
            resolved_path.unlink()
            logger.info(
                "Media file deleted",
                extra={"path": relative_path}
            )
            return True
        else:
            logger.debug(
                "File not found for deletion",
                extra={"path": relative_path}
            )
            return False
    except OSError as e:
        logger.error(
            "Failed to delete media file",
            extra={"path": relative_path, "error": str(e)}
        )
        return False


def delete_patient_media(db: Session, patient_id: int) -> Dict[str, int]:
    """
    Delete all media files belonging to a patient.
    
    Args:
        db: Database session
        patient_id: ID of the patient
        
    Returns:
        Dict with counts of deleted and failed deletions
    """
    images = db.query(Image).filter(Image.patient_id == patient_id).all()
    
    deleted = 0
    failed = 0
    
    for image in images:
        if image.image_url:
            if safe_delete_file(image.image_url):
                deleted += 1
            else:
                failed += 1
    
    logger.info(
        "Patient media deletion complete",
        extra={"patient_id": patient_id, "deleted": deleted, "failed": failed}
    )
    
    return {"deleted": deleted, "failed": failed}


def anonymize_patient_reports(db: Session, patient_id: int) -> int:
    """
    Anonymize analysis reports by removing patient PII while preserving statistics.
    
    Preserves: condition, confidence, recommendation (for aggregate analytics)
    Removes: patient_id reference (set to NULL)
    
    Args:
        db: Database session
        patient_id: ID of the patient
        
    Returns:
        Number of reports anonymized
    """
    reports = db.query(AnalysisReport).filter(
        AnalysisReport.patient_id == patient_id
    ).all()
    
    count = 0
    for report in reports:
        # Set patient_id to NULL to anonymize
        report.patient_id = None
        # Clear any patient feedback that might contain PII
        report.patient_feedback = None
        count += 1
    
    if count > 0:
        db.flush()
        logger.info(
            "Patient reports anonymized",
            extra={"patient_id": patient_id, "count": count}
        )
    
    return count


def delete_patient_images(db: Session, patient_id: int) -> int:
    """
    Delete image records belonging to a patient.
    
    Note: Actual files should be deleted first via delete_patient_media.
    Image records must be deleted (not anonymized) because patient_id is NOT NULL.
    
    Args:
        db: Database session
        patient_id: ID of the patient
        
    Returns:
        Number of images deleted
    """
    # Delete image records (files should already be deleted via delete_patient_media)
    count = db.query(Image).filter(Image.patient_id == patient_id).delete()
    
    if count > 0:
        db.flush()
        logger.info(
            "Patient images deleted",
            extra={"patient_id": patient_id, "count": count}
        )
    
    return count


def anonymize_patient_chat_messages(db: Session, patient_id: int) -> int:
    """
    Anonymize chat messages sent by the patient.
    
    Preserves: message structure, doctor/AI messages
    Removes: patient message content, sender_id
    
    Args:
        db: Database session
        patient_id: ID of the patient
        
    Returns:
        Number of messages anonymized
    """
    messages = db.query(ChatMessage).filter(
        ChatMessage.sender_id == patient_id
    ).all()
    
    count = 0
    for msg in messages:
        msg.sender_id = None
        msg.message = DELETED_MESSAGE_PLACEHOLDER
        count += 1
    
    if count > 0:
        db.flush()
        logger.info(
            "Patient chat messages anonymized",
            extra={"patient_id": patient_id, "count": count}
        )
    
    return count


def deactivate_patient_doctor_links(db: Session, patient_id: int) -> int:
    """
    Mark all patient-doctor links as deleted/inactive.
    
    Args:
        db: Database session
        patient_id: ID of the patient
        
    Returns:
        Number of links deactivated
    """
    links = db.query(PatientDoctorLink).filter(
        PatientDoctorLink.patient_id == patient_id
    ).all()
    
    count = 0
    for link in links:
        link.status = "deleted"
        count += 1
    
    if count > 0:
        db.flush()
        logger.info(
            "Patient-doctor links deactivated",
            extra={"patient_id": patient_id, "count": count}
        )
    
    return count


def delete_patient_account(db: Session, patient_id: int) -> Dict[str, any]:
    """
    Full patient account deletion with data anonymization.
    
    This is the main orchestration function that:
    1. Deactivates patient-doctor links
    2. Deletes media files
    3. Anonymizes analysis reports (preserves stats)
    4. Anonymizes chat messages
    5. Anonymizes image records
    6. Deletes the User record
    
    Args:
        db: Database session
        patient_id: ID of the patient to delete
        
    Returns:
        Summary dict with counts of affected records
    """
    logger.info(
        "Starting patient account deletion",
        extra={"patient_id": patient_id}
    )
    
    result = {
        "patient_id": patient_id,
        "links_deactivated": 0,
        "media_deleted": 0,
        "media_failed": 0,
        "reports_anonymized": 0,
        "messages_anonymized": 0,
        "images_deleted": 0,
        "user_deleted": False,
    }
    
    # 1. Deactivate patient-doctor links
    result["links_deactivated"] = deactivate_patient_doctor_links(db, patient_id)
    
    # 2. Delete media files (before deleting image records)
    media_result = delete_patient_media(db, patient_id)
    result["media_deleted"] = media_result["deleted"]
    result["media_failed"] = media_result["failed"]
    
    # 3. Anonymize reports (preserves condition/confidence stats)
    result["reports_anonymized"] = anonymize_patient_reports(db, patient_id)
    
    # 4. Anonymize chat messages
    result["messages_anonymized"] = anonymize_patient_chat_messages(db, patient_id)
    
    # 5. Delete image records (NOT NULL constraint on patient_id prevents anonymization)
    result["images_deleted"] = delete_patient_images(db, patient_id)
    
    # 6. Delete doctor change logs for this patient
    db.query(DoctorChangeLog).filter(
        DoctorChangeLog.patient_id == patient_id
    ).delete()
    
    # 7. Delete the User record
    user = db.query(User).filter(User.id == patient_id).first()
    if user:
        db.delete(user)
        result["user_deleted"] = True
    
    # Commit all changes
    db.commit()
    
    logger.info(
        "Patient account deletion complete",
        extra=result
    )
    
    return result


def cleanup_expired_data(db: Session) -> Dict[str, int]:
    """
    Clean up data that has exceeded retention windows.
    
    This is a placeholder for a scheduled job. It enforces:
    - MEDIA_RETENTION_DAYS for uploaded files
    - CHAT_RETENTION_DAYS for chat messages
    - ANALYSIS_RETENTION_DAYS for analysis reports
    
    Note: Only cleans up orphaned/anonymized data (patient_id = NULL).
    Active patient data is only removed via delete_patient_account.
    
    Args:
        db: Database session
        
    Returns:
        Summary of cleaned up records
    """
    result = {
        "chat_messages_deleted": 0,
        "reports_deleted": 0,
        "images_deleted": 0,
        "media_files_deleted": 0,
    }
    
    now = datetime.now(timezone.utc)
    
    # Skip cleanup if retention is disabled (0 days)
    if CHAT_RETENTION_DAYS > 0:
        chat_cutoff = now - timedelta(days=CHAT_RETENTION_DAYS)
        # Only delete orphaned (anonymized) messages past retention
        deleted = db.query(ChatMessage).filter(
            ChatMessage.sender_id.is_(None),
            ChatMessage.created_at < chat_cutoff
        ).delete()
        result["chat_messages_deleted"] = deleted
    
    if ANALYSIS_RETENTION_DAYS > 0:
        analysis_cutoff = now - timedelta(days=ANALYSIS_RETENTION_DAYS)
        # Only delete orphaned (anonymized) reports past retention
        deleted = db.query(AnalysisReport).filter(
            AnalysisReport.patient_id.is_(None),
            AnalysisReport.created_at < analysis_cutoff
        ).delete()
        result["reports_deleted"] = deleted
    
    if MEDIA_RETENTION_DAYS > 0:
        media_cutoff = now - timedelta(days=MEDIA_RETENTION_DAYS)
        # Find orphaned images past retention
        images = db.query(Image).filter(
            Image.patient_id.is_(None),
            Image.uploaded_at < media_cutoff
        ).all()
        
        for image in images:
            if image.image_url and safe_delete_file(image.image_url):
                result["media_files_deleted"] += 1
            db.delete(image)
            result["images_deleted"] += 1
    
    db.commit()
    
    logger.info(
        "Expired data cleanup complete",
        extra=result
    )
    
    return result
