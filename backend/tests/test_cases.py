import pytest
from fastapi import status
from app.models import AnalysisReport, Image, User

from app.services.auth import create_access_token

class TestCasesRoutes:
    def test_request_review_success(self, client, db_session, sample_user, sample_image):
        """Test that a patient can successfully request a review"""
        # Create a report first
        report = AnalysisReport(
            image_id=sample_image.id,
            patient_id=sample_user.id,
            report_json='{"condition": "Test Condition"}',
            review_status="none"
        )
        db_session.add(report)
        db_session.commit()
        db_session.refresh(report)

        # Generate token
        token = create_access_token({"sub": str(sample_user.id)})
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(f"/cases/{report.id}/request-review", headers=headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["review_status"] == "pending"
        
        # Verify in DB
        db_report = db_session.query(AnalysisReport).filter(AnalysisReport.id == report.id).first()
        assert db_report.review_status == "pending"

    def test_request_review_not_found(self, client, sample_user):
        """Test requesting review for non-existent report"""
        token = create_access_token({"sub": str(sample_user.id)})
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/cases/9999/request-review", headers=headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_request_review_unauthorized(self, client, db_session, sample_user, sample_image):
        """Test requesting review for someone else's report"""
        # Report belongs to sample_user
        report = AnalysisReport(
            image_id=sample_image.id,
            patient_id=sample_user.id,
            review_status="none"
        )
        db_session.add(report)
        db_session.commit()

        # Try with another user (id=999) - but we need them in DB for get_current_user to succeed
        other_user = User(email="other@test.com", password="pass", role="patient")
        db_session.add(other_user)
        db_session.commit()
        db_session.refresh(other_user)

        token = create_access_token({"sub": str(other_user.id)})
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(f"/cases/{report.id}/request-review", headers=headers)
        assert response.status_code == status.HTTP_404_NOT_FOUND # Should be 404 because of filter condition

    def test_doctor_accept_case(self, client, db_session, sample_user, sample_image):
        """Test doctor accepting a pending case"""
        # Create pending report
        report = AnalysisReport(
            image_id=sample_image.id,
            patient_id=sample_user.id,
            review_status="pending"
        )
        db_session.add(report)
        
        doctor = User(email="doctor@test.com", password="pass", role="doctor")
        db_session.add(doctor)
        db_session.commit()
        db_session.refresh(doctor)

        token = create_access_token({"sub": str(doctor.id)})
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(f"/cases/{report.id}/accept", headers=headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["review_status"] == "accepted"
        assert data["doctor_active"] is True

    def test_doctor_complete_case(self, client, db_session, sample_user, sample_image):
        """Test doctor completing an accepted case"""
        doctor = User(email="doc2@test.com", password="pass", role="doctor")
        db_session.add(doctor)
        db_session.commit()
        db_session.refresh(doctor)

        report = AnalysisReport(
            image_id=sample_image.id,
            patient_id=sample_user.id,
            review_status="accepted",
            doctor_id=doctor.id,
            doctor_active=True
        )
        db_session.add(report)
        db_session.commit()

        token = create_access_token({"sub": str(doctor.id)})
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.post(f"/cases/{report.id}/complete", headers=headers)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["review_status"] == "reviewed"
        assert data["doctor_active"] is False
