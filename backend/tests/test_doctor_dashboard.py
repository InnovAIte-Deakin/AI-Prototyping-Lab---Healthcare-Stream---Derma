import pytest
from app.models import DoctorProfile, PatientDoctorLink, User
from app.auth_helpers import get_current_doctor, get_current_user
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
    test_db.commit()
    return doctor_id

def create_patient(client, email: str) -> int:
    """Helper to create a patient user."""
    response = client.post(
        "/auth/signup",
        json={"email": email, "password": "password123", "role": "patient"},
    )
    return response.json()["user_id"]

def link_patient(client, patient_id: int, doctor_id: int):
    """Helper to link a patient to a doctor."""
    user = User(id=patient_id, role="patient", email="p@t.com")
    app.dependency_overrides[get_current_user] = lambda: user
    
    client.post(
        "/patient/select-doctor",
        json={"doctor_id": doctor_id},
    )
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_current_doctor, None)

class TestDoctorDashboard:
    def test_get_my_patients_returns_list(self, client, test_db):
        """Doctor should see their linked patients."""
        doctor_id = create_doctor(client, test_db, "dr.dashboard@test.com", "Dr. Dashboard")
        patient1_id = create_patient(client, "p1@test.com")
        patient2_id = create_patient(client, "p2@test.com")

        # Link patients to doctor
        link_patient(client, patient1_id, doctor_id)
        link_patient(client, patient2_id, doctor_id)

        # Fetch patients as doctor
        user = User(id=doctor_id, role="doctor", email="dr.dashboard@test.com")
        app.dependency_overrides[get_current_doctor] = lambda: user

        response = client.get(
            "/doctor/patients",
        )
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_current_doctor, None)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        emails = [p["email"] for p in data]
        assert "p1@test.com" in emails
        assert "p2@test.com" in emails

    def test_get_my_patients_empty(self, client, test_db):
        """Doctor with no patients should see empty list."""
        doctor_id = create_doctor(client, test_db, "dr.lonely@test.com", "Dr. Lonely")

        user = User(id=doctor_id, role="doctor", email="dr.lonely@test.com")
        app.dependency_overrides[get_current_doctor] = lambda: user

        response = client.get(
            "/doctor/patients",
        )
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_current_doctor, None)

        assert response.status_code == 200
        assert response.json() == []

    def test_patient_cannot_access_doctor_dashboard(self, client):
        """Patient cannot access doctor dashboard endpoints."""
        patient_id = create_patient(client, "intruder@test.com")

        # Mock as patient but trying to access doctor route
        # Dependency get_current_doctor will check role and raise 403
        user = User(id=patient_id, role="patient", email="intruder@test.com")
        # We need to override get_current_user only, get_current_doctor depends on it
        # But get_current_doctor is the one explicitly called by the route
        # So we override get_current_user to return the patient
        app.dependency_overrides[get_current_user] = lambda: user

        response = client.get(
            "/doctor/patients",
        )
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_current_doctor, None)

        assert response.status_code == 403
