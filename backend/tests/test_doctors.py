"""
Tests for doctor listing and patient-doctor linking (B4).
"""
import pytest

from app.models import DoctorProfile, PatientDoctorLink, User
from app.auth_helpers import get_current_user
from app.main import app


def create_doctor(client, test_db, email: str, full_name: str) -> int:
    """Helper to create a doctor user and set profile details."""
    response = client.post(
        "/auth/signup",
        json={"email": email, "password": "password123", "role": "doctor"},
    )
    doctor_id = response.json()["user_id"]
    
    profile = test_db.query(DoctorProfile).filter(DoctorProfile.user_id == doctor_id).first()
    profile.full_name = full_name
    profile.clinic_name = "Test Clinic"
    profile.bio = "Test bio"
    profile.avatar_url = "https://placehold.co/128x128?text=TestDoctor"
    test_db.commit()
    return doctor_id


def create_patient(client, email: str) -> int:
    """Helper to create a patient user."""
    response = client.post(
        "/auth/signup",
        json={"email": email, "password": "password123", "role": "patient"},
    )
    return response.json()["user_id"]


class TestDoctorListing:
    def test_get_doctors_returns_profiles(self, client, test_db):
        """Doctors endpoint should return doctor and profile data."""
        doctor_id = create_doctor(client, test_db, "doctor1@test.com", "Dr. Test One")

        response = client.get("/doctors")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        doctor = data[0]
        assert doctor["id"] == doctor_id
        assert doctor["email"] == "doctor1@test.com"
        assert doctor["full_name"] == "Dr. Test One"
        assert doctor["clinic_name"] == "Test Clinic"
        assert doctor["bio"] == "Test bio"
        assert doctor["avatar_url"] == "https://placehold.co/128x128?text=TestDoctor"


class TestPatientDoctorLinking:
    def test_select_doctor_creates_link(self, client, test_db):
        """Selecting a doctor should create a PatientDoctorLink."""
        patient_id = create_patient(client, "patient@test.com")
        doctor_id = create_doctor(client, test_db, "doctor2@test.com", "Dr. Link Target")

        user = User(id=patient_id, role="patient", email="patient@test.com")
        app.dependency_overrides[get_current_user] = lambda: user

        response = client.post(
            "/patient/select-doctor",
            json={"doctor_id": doctor_id},
        )
        app.dependency_overrides.pop(get_current_user, None)

        assert response.status_code == 200
        payload = response.json()
        assert payload["status"] == "active"
        assert payload["doctor"]["id"] == doctor_id

        link = (
            test_db.query(PatientDoctorLink)
            .filter(PatientDoctorLink.patient_id == patient_id)
            .first()
        )
        assert link is not None
        assert link.doctor_id == doctor_id

    def test_select_doctor_updates_existing_link(self, client, test_db):
        """Selecting a different doctor should update the existing link."""
        patient_id = create_patient(client, "patient2@test.com")
        first_doctor = create_doctor(client, test_db, "doctor3@test.com", "Dr. First")
        second_doctor = create_doctor(client, test_db, "doctor4@test.com", "Dr. Second")

        user = User(id=patient_id, role="patient", email="patient2@test.com")
        app.dependency_overrides[get_current_user] = lambda: user

        client.post(
            "/patient/select-doctor",
            json={"doctor_id": first_doctor},
        )

        response = client.post(
            "/patient/select-doctor",
            json={"doctor_id": second_doctor},
        )
        app.dependency_overrides.pop(get_current_user, None)

        assert response.status_code == 200
        payload = response.json()
        assert payload["doctor"]["id"] == second_doctor

        link = (
            test_db.query(PatientDoctorLink)
            .filter(PatientDoctorLink.patient_id == patient_id)
            .first()
        )
        assert link.doctor_id == second_doctor

    def test_my_doctor_returns_current_link(self, client, test_db):
        """Retrieving current doctor returns the linked doctor."""
        patient_id = create_patient(client, "patient3@test.com")
        doctor_id = create_doctor(client, test_db, "doctor5@test.com", "Dr. Current")

        user = User(id=patient_id, role="patient", email="patient3@test.com")
        app.dependency_overrides[get_current_user] = lambda: user

        client.post(
            "/patient/select-doctor",
            json={"doctor_id": doctor_id},
        )

        response = client.get(
            "/patient/my-doctor",
        )
        app.dependency_overrides.pop(get_current_user, None)

        assert response.status_code == 200
        payload = response.json()
        assert payload["doctor"]["id"] == doctor_id
        assert payload["status"] == "active"

    def test_select_doctor_requires_patient_role(self, client, test_db):
        """Non-patient users cannot select a doctor."""
        doctor_as_user = create_doctor(client, test_db, "doctor6@test.com", "Dr. Not Patient")
        target_doctor = create_doctor(client, test_db, "doctor7@test.com", "Dr. Target")

        user = User(id=doctor_as_user, role="doctor", email="doctor6@test.com")
        app.dependency_overrides[get_current_user] = lambda: user

        response = client.post(
            "/patient/select-doctor",
            json={"doctor_id": target_doctor},
        )
        app.dependency_overrides.pop(get_current_user, None)

        assert response.status_code == 403
        assert "Patient role required" in response.json()["detail"]

    def test_select_doctor_not_found(self, client):
        """Selecting a non-existent doctor returns 404."""
        patient_id = create_patient(client, "patient4@test.com")

        user = User(id=patient_id, role="patient", email="patient4@test.com")
        app.dependency_overrides[get_current_user] = lambda: user

        response = client.post(
            "/patient/select-doctor",
            json={"doctor_id": 9999},
        )
        app.dependency_overrides.pop(get_current_user, None)

        assert response.status_code == 404
        assert "Doctor not found" in response.json()["detail"]

    def test_select_doctor_missing_profile(self, client, test_db):
        """Selecting a doctor without profile returns 404."""
        patient_id = create_patient(client, "patient5@test.com")
        doctor_id = create_doctor(client, test_db, "doctor8@test.com", "Dr. Missing Profile")

        # Remove profile to simulate missing profile case
        profile = test_db.query(DoctorProfile).filter(DoctorProfile.user_id == doctor_id).first()
        test_db.delete(profile)
        test_db.commit()

        user = User(id=patient_id, role="patient", email="patient5@test.com")
        app.dependency_overrides[get_current_user] = lambda: user

        response = client.post(
            "/patient/select-doctor",
            json={"doctor_id": doctor_id},
        )
        app.dependency_overrides.pop(get_current_user, None)

        assert response.status_code == 404
        assert "Doctor profile not found" in response.json()["detail"]

    def test_my_doctor_no_link(self, client):
        """Fetching current doctor without link returns 404."""
        patient_id = create_patient(client, "patient6@test.com")

        user = User(id=patient_id, role="patient", email="patient6@test.com")
        app.dependency_overrides[get_current_user] = lambda: user

        response = client.get(
            "/patient/my-doctor",
        )
        app.dependency_overrides.clear()

        assert response.status_code == 404
        assert "No doctor linked" in response.json()["detail"]
