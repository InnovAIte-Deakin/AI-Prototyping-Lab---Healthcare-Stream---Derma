"""
Tests for the image upload endpoint.
"""
from pathlib import Path

from app.config import MEDIA_ROOT, MEDIA_URL
from app.models import Image, User
from app.auth_helpers import get_current_user
from app.main import app


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


def _media_path_from_url(image_url: str) -> Path:
    relative_part = image_url.replace(MEDIA_URL, "", 1).lstrip("/")
    return MEDIA_ROOT / relative_part


class TestImageUpload:
    def test_upload_requires_linked_doctor(self, client):
        """Uploading without selecting a doctor returns 400."""
        patient_id = create_user(client, "nolink@test.com", "patient")

        user = User(id=patient_id, role="patient", email="nolink@test.com")
        app.dependency_overrides[get_current_user] = lambda: user

        response = client.post(
            "/images",
            files={"file": ("lesion.png", b"fake-bytes", "image/png")},
        )
        app.dependency_overrides.pop(get_current_user, None)

        assert response.status_code == 400
        assert "linked doctor" in response.json()["detail"]

    def test_upload_saves_record_and_file(self, client, test_db):
        """Uploading persists the file and DB record."""
        patient_id = create_user(client, "patientupload@test.com", "patient")
        doctor_id = create_user(client, "doctorupload@test.com", "doctor")
        link_patient_to_doctor(client, patient_id, doctor_id)

        user = User(id=patient_id, role="patient", email="patientupload@test.com")
        app.dependency_overrides[get_current_user] = lambda: user

        response = client.post(
            "/images",
            files={"file": ("lesion.png", b"fake-image", "image/png")},
        )
        app.dependency_overrides.pop(get_current_user, None)

        assert response.status_code == 201
        payload = response.json()
        assert payload["image_url"].startswith(MEDIA_URL)

        image = test_db.query(Image).filter(Image.id == payload["image_id"]).first()
        assert image is not None
        assert image.patient_id == patient_id
        assert image.doctor_id == doctor_id
        assert image.image_url == payload["image_url"]

        file_path = _media_path_from_url(payload["image_url"])
        try:
            assert file_path.exists()
        finally:
            if file_path.exists():
                file_path.unlink()
