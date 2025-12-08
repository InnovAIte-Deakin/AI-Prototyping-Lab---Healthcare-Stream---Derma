import pytest
from app.models import DoctorProfile, PatientDoctorLink, User

def create_doctor(client, test_db, email: str, full_name: str) -> int:
    """Helper to create a doctor user and set profile details."""
    response = client.post(
        "/auth/signup",
        json={"email": email, "password": "password123", "role": "doctor"},
    )
    doctor_id = response.json()["id"]

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
    return response.json()["id"]

def link_patient(client, patient_id: int, doctor_id: int):
    """Helper to link a patient to a doctor."""
    client.post(
        "/patient/select-doctor",
        json={"doctor_id": doctor_id},
        headers={"X-User-Id": str(patient_id)},
    )

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
        response = client.get(
            "/doctor/patients",
            headers={"X-User-Id": str(doctor_id), "X-User-Role": "doctor"}
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        emails = [p["email"] for p in data]
        assert "p1@test.com" in emails
        assert "p2@test.com" in emails

    def test_get_my_patients_empty(self, client, test_db):
        """Doctor with no patients should see empty list."""
        doctor_id = create_doctor(client, test_db, "dr.lonely@test.com", "Dr. Lonely")

        response = client.get(
            "/doctor/patients",
            headers={"X-User-Id": str(doctor_id), "X-User-Role": "doctor"}
        )

        assert response.status_code == 200
        assert response.json() == []

    def test_patient_cannot_access_doctor_dashboard(self, client):
        """Patient cannot access doctor dashboard endpoints."""
        patient_id = create_patient(client, "intruder@test.com")

        response = client.get(
            "/doctor/patients",
            headers={"X-User-Id": str(patient_id), "X-User-Role": "patient"}
        )

        assert response.status_code == 403
