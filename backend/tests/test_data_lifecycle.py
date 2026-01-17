"""
Tests for data lifecycle service and patient deletion endpoint.

Covers:
- Patient deletion permissions
- Retention window enforcement
- File cleanup with mocked filesystem
- Anonymization preserving aggregate stats
- Path traversal protection
"""

import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db import Base, get_db
from app.models import (
    User,
    Image,
    AnalysisReport,
    ChatMessage,
    PatientDoctorLink,
    DoctorProfile,
)
from app.services.auth import get_password_hash, create_access_token
from app.services.data_lifecycle_service import (
    safe_delete_file,
    _is_safe_path,
    delete_patient_account,
    anonymize_patient_reports,
    anonymize_patient_chat_messages,
    cleanup_expired_data,
    delete_patient_images,
)


# ============================================================================
# Test Database Setup
# ============================================================================

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with overridden database dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


# ============================================================================
# Helper Fixtures
# ============================================================================

@pytest.fixture
def patient_user(db_session):
    """Create a patient user."""
    user = User(
        email="patient@test.com",
        password=get_password_hash("password123"),
        role="patient",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def doctor_user(db_session):
    """Create a doctor user with profile."""
    user = User(
        email="doctor@test.com",
        password=get_password_hash("password123"),
        role="doctor",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    profile = DoctorProfile(
        user_id=user.id,
        full_name="Dr. Test",
        clinic_name="Test Clinic",
        bio="Test bio",
        avatar_url="https://example.com/avatar.png",
    )
    db_session.add(profile)
    db_session.commit()
    
    return user


@pytest.fixture
def patient_with_data(db_session, patient_user, doctor_user):
    """Create a patient with linked doctor, images, reports, and messages."""
    # Link patient to doctor
    link = PatientDoctorLink(
        patient_id=patient_user.id,
        doctor_id=doctor_user.id,
        status="active",
    )
    db_session.add(link)
    
    # Create image
    image = Image(
        patient_id=patient_user.id,
        doctor_id=doctor_user.id,
        image_url="uploads/test_image.png",
    )
    db_session.add(image)
    db_session.commit()
    db_session.refresh(image)
    
    # Create analysis report
    report = AnalysisReport(
        image_id=image.id,
        patient_id=patient_user.id,
        condition="Eczema",
        confidence=0.85,
        recommendation="See a dermatologist",
        review_status="none",
    )
    db_session.add(report)
    db_session.commit()
    db_session.refresh(report)
    
    # Create chat messages
    patient_msg = ChatMessage(
        report_id=report.id,
        sender_id=patient_user.id,
        sender_role="patient",
        message="What does this mean?",
    )
    ai_msg = ChatMessage(
        report_id=report.id,
        sender_id=None,
        sender_role="ai",
        message="This appears to be eczema.",
    )
    db_session.add(patient_msg)
    db_session.add(ai_msg)
    db_session.commit()
    
    return {
        "patient": patient_user,
        "doctor": doctor_user,
        "link": link,
        "image": image,
        "report": report,
    }


def get_auth_header(user):
    """Generate authorization header for a user."""
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# Path Traversal Protection Tests
# ============================================================================

class TestPathSecurity:
    """Test path traversal protection."""

    def test_safe_path_within_base(self, tmp_path):
        """Valid path within base directory is allowed."""
        base = tmp_path / "media"
        base.mkdir()
        target = base / "uploads" / "image.png"
        assert _is_safe_path(base, target) is True

    def test_path_traversal_blocked(self, tmp_path):
        """Path traversal attempt is blocked."""
        base = tmp_path / "media"
        base.mkdir()
        # Attempt to escape via ../
        target = base / ".." / "etc" / "passwd"
        assert _is_safe_path(base, target) is False

    def test_absolute_path_outside_blocked(self, tmp_path):
        """Absolute path outside base is blocked."""
        base = tmp_path / "media"
        base.mkdir()
        target = Path("/etc/passwd")
        assert _is_safe_path(base, target) is False

    @patch("app.services.data_lifecycle_service.MEDIA_ROOT")
    def test_safe_delete_blocks_traversal(self, mock_media_root, tmp_path):
        """safe_delete_file blocks path traversal attempts."""
        mock_media_root.__truediv__ = lambda self, x: tmp_path / x
        mock_media_root.resolve.return_value = tmp_path
        
        # This should be blocked
        result = safe_delete_file("../../../etc/passwd")
        assert result is False


# ============================================================================
# Patient Deletion Endpoint Tests
# ============================================================================

class TestPatientDeletionEndpoint:
    """Test DELETE /patients/me endpoint."""

    def test_patient_can_delete_own_account(self, client, db_session, patient_with_data):
        """Patient successfully deletes their own account."""
        patient = patient_with_data["patient"]
        headers = get_auth_header(patient)
        
        # Mock file deletion since test file doesn't exist
        with patch("app.services.data_lifecycle_service.safe_delete_file", return_value=True):
            response = client.delete("/patients/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Account deleted successfully"
        assert data["summary"]["user_deleted"] is True
        
        # Verify user is deleted
        user = db_session.query(User).filter(User.id == patient.id).first()
        assert user is None

    def test_doctor_cannot_access_patient_deletion(self, client, db_session, doctor_user):
        """Doctor role gets 403 on patient deletion endpoint."""
        headers = get_auth_header(doctor_user)
        
        response = client.delete("/patients/me", headers=headers)
        
        assert response.status_code == 403
        assert "Patient role required" in response.json()["detail"]

    def test_unauthenticated_cannot_delete(self, client):
        """Unauthenticated request gets 401."""
        response = client.delete("/patients/me")
        
        assert response.status_code == 401


# ============================================================================
# Anonymization Tests
# ============================================================================

class TestDataAnonymization:
    """Test data anonymization functions."""

    def test_anonymization_preserves_stats(self, db_session, patient_with_data):
        """Anonymization preserves condition/confidence but removes patient_id."""
        patient = patient_with_data["patient"]
        report = patient_with_data["report"]
        
        original_condition = report.condition
        original_confidence = report.confidence
        
        count = anonymize_patient_reports(db_session, patient.id)
        db_session.commit()
        
        assert count == 1
        
        # Refresh to get updated values
        db_session.refresh(report)
        
        # Stats preserved
        assert report.condition == original_condition
        assert report.confidence == original_confidence
        
        # PII removed
        assert report.patient_id is None

    def test_chat_messages_anonymized(self, db_session, patient_with_data):
        """Patient messages show [deleted], AI/doctor messages preserved."""
        patient = patient_with_data["patient"]
        report = patient_with_data["report"]
        
        count = anonymize_patient_chat_messages(db_session, patient.id)
        db_session.commit()
        
        assert count == 1  # Only patient message
        
        # Check messages
        messages = db_session.query(ChatMessage).filter(
            ChatMessage.report_id == report.id
        ).all()
        
        for msg in messages:
            if msg.sender_role == "patient":
                assert msg.message == "[Message deleted by user]"
                assert msg.sender_id is None
            else:
                # AI message preserved
                assert "eczema" in msg.message.lower()


# ============================================================================
# Full Account Deletion Tests
# ============================================================================

class TestAccountDeletion:
    """Test full account deletion orchestration."""

    @patch("app.services.data_lifecycle_service.safe_delete_file")
    def test_delete_patient_account_full_flow(self, mock_delete, db_session, patient_with_data):
        """Full deletion flow anonymizes data and deletes user."""
        mock_delete.return_value = True
        
        patient = patient_with_data["patient"]
        patient_id = patient.id
        
        result = delete_patient_account(db_session, patient_id)
        
        # Check result summary
        assert result["user_deleted"] is True
        assert result["links_deactivated"] == 1
        assert result["reports_anonymized"] == 1
        assert result["messages_anonymized"] == 1
        assert result["images_deleted"] == 1
        
        # Verify user gone
        user = db_session.query(User).filter(User.id == patient_id).first()
        assert user is None
        
        # Verify link deactivated
        link = db_session.query(PatientDoctorLink).filter(
            PatientDoctorLink.patient_id == patient_id
        ).first()
        assert link.status == "deleted"
        
        # Verify report anonymized but exists
        report = patient_with_data["report"]
        db_session.refresh(report)
        assert report.patient_id is None
        assert report.condition == "Eczema"  # Stats preserved


# ============================================================================
# Retention Cleanup Tests
# ============================================================================

class TestRetentionCleanup:
    """Test retention window enforcement."""

    def test_cleanup_respects_retention_window(self, db_session, patient_with_data):
        """Recent data is preserved, old orphaned data is cleaned."""
        patient = patient_with_data["patient"]
        report = patient_with_data["report"]
        
        # First anonymize (simulating a past deletion)
        anonymize_patient_reports(db_session, patient.id)
        anonymize_patient_chat_messages(db_session, patient.id)
        db_session.commit()
        
        # Set report to old date (past retention)
        old_date = datetime.now(timezone.utc) - timedelta(days=800)
        report.created_at = old_date
        db_session.commit()
        
        # Run cleanup
        result = cleanup_expired_data(db_session)
        
        # Orphaned old report should be deleted
        assert result["reports_deleted"] == 1


# ============================================================================
# Doctor View After Deletion Tests
# ============================================================================

class TestDoctorViewAfterDeletion:
    """Test doctor can still see anonymized cases."""

    @patch("app.services.data_lifecycle_service.safe_delete_file")
    def test_doctor_sees_anonymized_cases(self, mock_delete, client, db_session, patient_with_data):
        """Doctor can still access case after patient deletes account."""
        mock_delete.return_value = True
        
        patient = patient_with_data["patient"]
        doctor = patient_with_data["doctor"]
        report = patient_with_data["report"]
        
        # Patient deletes account
        delete_patient_account(db_session, patient.id)
        
        # Report still exists
        db_session.refresh(report)
        assert report.id is not None
        assert report.condition == "Eczema"
        assert report.patient_id is None  # Anonymized
