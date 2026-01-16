import pytest
from app.main import app
from app.models import User
from app.auth_helpers import get_current_user
from app.config import MAX_UPLOAD_SIZE_MB

def create_user(client, email: str, role: str) -> int:
    response = client.post(
        "/auth/signup",
        json={"email": email, "password": "password123", "role": role},
    )
    assert response.status_code == 201
    return response.json()["user_id"]

def link_patient_to_doctor(client, patient_id: int, doctor_id: int) -> None:
    user = User(id=patient_id, role="patient", email="link@test.com")
    app.dependency_overrides[get_current_user] = lambda: user
    
    response = client.post(
        "/patient/select-doctor",
        json={"doctor_id": doctor_id},
    )
    app.dependency_overrides.pop(get_current_user, None)
    assert response.status_code == 200

class TestImageUploadResilience:
    def test_upload_invalid_type(self, client):
        """Uploading a non-image file returns 400."""
        patient_id = create_user(client, "type@resilience.com", "patient")
        doctor_id = create_user(client, "dr_type@resilience.com", "doctor")
        link_patient_to_doctor(client, patient_id, doctor_id)

        user = User(id=patient_id, role="patient", email="type@resilience.com")
        app.dependency_overrides[get_current_user] = lambda: user

        response = client.post(
            "/images",
            files={"file": ("test.txt", b"some text content", "text/plain")},
        )
        app.dependency_overrides.pop(get_current_user, None)

        assert response.status_code == 400
        assert "Invalid file type" in response.json()["detail"]

    def test_upload_too_large(self, client):
        """Uploading a file exceeding MAX_UPLOAD_SIZE_MB returns 400."""
        patient_id = create_user(client, "size@resilience.com", "patient")
        doctor_id = create_user(client, "dr_size@resilience.com", "doctor")
        link_patient_to_doctor(client, patient_id, doctor_id)

        user = User(id=patient_id, role="patient", email="size@resilience.com")
        app.dependency_overrides[get_current_user] = lambda: user

        # Create "large" file (MAX + 0.1MB)
        large_content = b"a" * (MAX_UPLOAD_SIZE_MB * 1024 * 1024 + 1024 * 100)
        
        response = client.post(
            "/images",
            files={"file": ("large.png", large_content, "image/png")},
        )
        app.dependency_overrides.pop(get_current_user, None)

        assert response.status_code == 400
        assert "File too large" in response.json()["detail"]

    def test_upload_valid_image(self, client):
        """Uploading a valid image works."""
        patient_id = create_user(client, "valid@resilience.com", "patient")
        doctor_id = create_user(client, "dr_valid@resilience.com", "doctor")
        link_patient_to_doctor(client, patient_id, doctor_id)

        user = User(id=patient_id, role="patient", email="valid@resilience.com")
        app.dependency_overrides[get_current_user] = lambda: user

        response = client.post(
            "/images",
            files={"file": ("lesion.png", b"fake-image-bytes", "image/png")},
        )
        app.dependency_overrides.pop(get_current_user, None)

        assert response.status_code == 201
        assert "image_id" in response.json()
