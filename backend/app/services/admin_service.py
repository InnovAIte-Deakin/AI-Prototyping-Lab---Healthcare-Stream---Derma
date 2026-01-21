"""
Admin service for clinic-wide metrics and oversight.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List

from app.models import User, AnalysisReport, Image


def get_admin_overview(db: Session) -> Dict[str, Any]:
    """
    Get clinic-wide overview metrics for admin dashboard.
    
    Returns:
        Dictionary with:
        - total_patients: count of users with patient role
        - total_doctors: count of users with doctor role
        - pending_cases: count of reports with review_status='pending'
        - average_rating: average patient_rating (nullable)
        - recent_cases: list of 10 most recent cases with details
    """
    # Count patients
    total_patients = db.query(func.count(User.id)).filter(User.role == "patient").scalar() or 0
    
    # Count doctors
    total_doctors = db.query(func.count(User.id)).filter(User.role == "doctor").scalar() or 0
    
    # Count pending cases
    pending_cases = db.query(func.count(AnalysisReport.id)).filter(
        AnalysisReport.review_status == "pending"
    ).scalar() or 0
    
    # Calculate average rating (only for rated cases)
    avg_rating_result = db.query(func.avg(AnalysisReport.patient_rating)).filter(
        AnalysisReport.patient_rating.isnot(None)
    ).scalar()
    average_rating = round(float(avg_rating_result), 2) if avg_rating_result else None
    
    # Get recent cases with patient info
    recent_cases_query = (
        db.query(
            AnalysisReport.id,
            AnalysisReport.condition,
            AnalysisReport.review_status,
            AnalysisReport.created_at,
            User.email.label("patient_email")
        )
        .join(User, AnalysisReport.patient_id == User.id)
        .order_by(AnalysisReport.created_at.desc())
        .limit(10)
        .all()
    )
    
    recent_cases: List[Dict[str, Any]] = [
        {
            "id": case.id,
            "patient_email": case.patient_email,
            "condition": case.condition,
            "review_status": case.review_status,
            "created_at": case.created_at.isoformat() if case.created_at else None,
        }
        for case in recent_cases_query
    ]
    
    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "pending_cases": pending_cases,
        "average_rating": average_rating,
        "recent_cases": recent_cases,
    }
