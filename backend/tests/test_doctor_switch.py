"""
Tests for safe doctor switch functionality.

Tests the POST /patient/change-doctor endpoint including:
- Successful doctor change
- Block when patient has pending case
- Block when patient has accepted case
- Allow after case is reviewed
- Prevent switching to same doctor
- Historical reports preserve original doctor
"""

import pytest
from app.models import (
    AnalysisReport,
    DoctorChangeLog,
    DoctorProfile,
    Image,
    PatientDoctorLink,
    User,
)
from app.services.auth import create_access_token, get_password_hash


@pytest.fixture
def doctor1(db_session):
    """Create first doctor user with profile."""
    user = User(
        email="doctor1@test.com", 
        password=get_password_hash("testpass123"), 
        role="doctor"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    profile = DoctorProfile(
        user_id=user.id,
        full_name="Dr. Alice Smith",
        clinic_name="City Clinic",
        bio="Experienced dermatologist",
        avatar_url="https://placehold.co/128x128"
    )
    db_session.add(profile)
    db_session.commit()
    return user


@pytest.fixture
def doctor2(db_session):
    """Create second doctor user with profile."""
    user = User(
        email="doctor2@test.com", 
        password=get_password_hash("testpass123"), 
        role="doctor"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    profile = DoctorProfile(
        user_id=user.id,
        full_name="Dr. Bob Jones",
        clinic_name="Health Center",
        bio="Board certified specialist",
        avatar_url="https://placehold.co/128x128"
    )
    db_session.add(profile)
    db_session.commit()
    return user


@pytest.fixture
def patient(db_session):
    """Create patient user."""
    user = User(
        email="patient@test.com", 
        password=get_password_hash("testpass123"), 
        role="patient"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def patient_with_doctor(db_session, patient, doctor1):
    """Create patient linked to doctor1."""
    link = PatientDoctorLink(
        patient_id=patient.id,
        doctor_id=doctor1.id,
        status="active"
    )
    db_session.add(link)
    db_session.commit()
    return patient


@pytest.fixture
def patient_auth_headers(patient):
    """Auth headers for patient with JWT token."""
    # Note: auth_helpers.get_current_user expects 'sub' to be user.id as string
    token = create_access_token(data={"sub": str(patient.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def image_for_patient(db_session, patient, doctor1):
    """Create an image for the patient."""
    image = Image(
        patient_id=patient.id,
        doctor_id=doctor1.id,
        image_url="/uploads/test.jpg"
    )
    db_session.add(image)
    db_session.commit()
    db_session.refresh(image)
    return image


@pytest.fixture
def case_no_review(db_session, patient, doctor1, image_for_patient):
    """Create a case with no review requested (review_status='none')."""
    report = AnalysisReport(
        image_id=image_for_patient.id,
        patient_id=patient.id,
        doctor_id=doctor1.id,
        report_json='{"test": true}',
        review_status="none",
        doctor_active=False
    )
    db_session.add(report)
    db_session.commit()
    db_session.refresh(report)
    return report


@pytest.fixture
def case_pending(db_session, patient, doctor1, image_for_patient):
    """Create a case with pending review (review_status='pending')."""
    report = AnalysisReport(
        image_id=image_for_patient.id,
        patient_id=patient.id,
        doctor_id=doctor1.id,
        report_json='{"test": true}',
        review_status="pending",
        doctor_active=False
    )
    db_session.add(report)
    db_session.commit()
    db_session.refresh(report)
    return report


@pytest.fixture
def case_accepted(db_session, patient, doctor1, image_for_patient):
    """Create a case with accepted review (review_status='accepted')."""
    report = AnalysisReport(
        image_id=image_for_patient.id,
        patient_id=patient.id,
        doctor_id=doctor1.id,
        report_json='{"test": true}',
        review_status="accepted",
        doctor_active=True
    )
    db_session.add(report)
    db_session.commit()
    db_session.refresh(report)
    return report


@pytest.fixture
def case_reviewed(db_session, patient, doctor1, image_for_patient):
    """Create a case with completed review (review_status='reviewed')."""
    report = AnalysisReport(
        image_id=image_for_patient.id,
        patient_id=patient.id,
        doctor_id=doctor1.id,
        report_json='{"test": true}',
        review_status="reviewed",
        doctor_active=False
    )
    db_session.add(report)
    db_session.commit()
    db_session.refresh(report)
    return report


class TestDoctorSwitchEndpoint:
    """Tests for POST /patient/change-doctor endpoint."""

    def test_change_doctor_success_no_active_cases(
        self, client, db_session, patient_with_doctor, doctor1, doctor2, patient_auth_headers
    ):
        """Patient can change doctor when no active cases exist."""
        response = client.post(
            "/patient/change-doctor",
            json={"doctor_id": doctor2.id, "reason": "Closer location"},
            headers=patient_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["doctor"]["id"] == doctor2.id
        assert data["doctor"]["full_name"] == "Dr. Bob Jones"
        assert data["status"] == "active"
        assert data["previous_doctor_id"] == doctor1.id
        
        # Verify link was updated in DB
        link = db_session.query(PatientDoctorLink).filter(
            PatientDoctorLink.patient_id == patient_with_doctor.id
        ).first()
        assert link.doctor_id == doctor2.id
        
        # Verify change log was created
        log = db_session.query(DoctorChangeLog).filter(
            DoctorChangeLog.patient_id == patient_with_doctor.id
        ).first()
        assert log is not None
        assert log.old_doctor_id == doctor1.id
        assert log.new_doctor_id == doctor2.id
        assert log.reason == "Closer location"

    def test_change_doctor_success_with_reviewed_case(
        self, client, db_session, patient_with_doctor, doctor1, doctor2, 
        patient_auth_headers, case_reviewed
    ):
        """Patient can change doctor after a case is fully reviewed."""
        response = client.post(
            "/patient/change-doctor",
            json={"doctor_id": doctor2.id},
            headers=patient_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["doctor"]["id"] == doctor2.id

    def test_change_doctor_blocked_by_pending_case(
        self, client, patient_with_doctor, doctor2, patient_auth_headers, case_pending
    ):
        """Cannot change doctor when patient has a pending case."""
        response = client.post(
            "/patient/change-doctor",
            json={"doctor_id": doctor2.id},
            headers=patient_auth_headers
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "active case" in data["detail"].lower()
        assert "pending" in data["detail"].lower() or "accepted" in data["detail"].lower()

    def test_change_doctor_blocked_by_accepted_case(
        self, client, patient_with_doctor, doctor2, patient_auth_headers, case_accepted
    ):
        """Cannot change doctor when doctor has accepted a case."""
        response = client.post(
            "/patient/change-doctor",
            json={"doctor_id": doctor2.id},
            headers=patient_auth_headers
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "active case" in data["detail"].lower()

    def test_change_doctor_no_existing_link(
        self, client, patient, doctor2
    ):
        """Cannot use change-doctor if patient has no doctor linked."""
        token = create_access_token(data={"sub": str(patient.id)})
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post(
            "/patient/change-doctor",
            json={"doctor_id": doctor2.id},
            headers=headers
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "no doctor" in data["detail"].lower()

    def test_change_to_same_doctor_rejected(
        self, client, patient_with_doctor, doctor1, patient_auth_headers
    ):
        """Cannot change to the same doctor already linked."""
        response = client.post(
            "/patient/change-doctor",
            json={"doctor_id": doctor1.id},
            headers=patient_auth_headers
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "already linked" in data["detail"].lower()

    def test_change_to_nonexistent_doctor(
        self, client, patient_with_doctor, patient_auth_headers
    ):
        """Cannot change to a doctor that doesn't exist."""
        response = client.post(
            "/patient/change-doctor",
            json={"doctor_id": 99999},
            headers=patient_auth_headers
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "doctor" in data["detail"].lower()


class TestHistoricalReportsPreserveDoctor:
    """Tests that historical reports keep their original doctor after switch."""

    def test_old_reports_keep_original_doctor_after_switch(
        self, client, db_session, patient_with_doctor, doctor1, doctor2, 
        patient_auth_headers, case_reviewed
    ):
        """After switching doctors, old reports still show original doctor."""
        # Verify the case has doctor1 before switch
        assert case_reviewed.doctor_id == doctor1.id
        
        # Change to doctor2
        response = client.post(
            "/patient/change-doctor",
            json={"doctor_id": doctor2.id},
            headers=patient_auth_headers
        )
        assert response.status_code == 200
        
        # Refresh the report from DB
        db_session.refresh(case_reviewed)
        
        # The historical report should still reference doctor1
        assert case_reviewed.doctor_id == doctor1.id
        
        # But the patient's link should now be to doctor2
        link = db_session.query(PatientDoctorLink).filter(
            PatientDoctorLink.patient_id == patient_with_doctor.id
        ).first()
        assert link.doctor_id == doctor2.id


class TestDoctorChangeLog:
    """Tests for the DoctorChangeLog model."""

    def test_change_log_created_on_switch(
        self, client, db_session, patient_with_doctor, doctor1, doctor2, patient_auth_headers
    ):
        """A log entry is created when a patient switches doctors."""
        # Initially no logs
        logs = db_session.query(DoctorChangeLog).filter(
            DoctorChangeLog.patient_id == patient_with_doctor.id
        ).all()
        assert len(logs) == 0
        
        # Change doctor
        response = client.post(
            "/patient/change-doctor",
            json={"doctor_id": doctor2.id, "reason": "Specialty preference"},
            headers=patient_auth_headers
        )
        assert response.status_code == 200
        
        # Now we should have one log
        logs = db_session.query(DoctorChangeLog).filter(
            DoctorChangeLog.patient_id == patient_with_doctor.id
        ).all()
        assert len(logs) == 1
        
        log = logs[0]
        assert log.old_doctor_id == doctor1.id
        assert log.new_doctor_id == doctor2.id
        assert log.reason == "Specialty preference"
        assert log.changed_at is not None
