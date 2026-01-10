from app.auth_helpers import get_current_user
from app.main import app
from app.models import AnalysisReport, Image, PatientDoctorLink, User


def _create_user(db_session, email: str, role: str) -> User:
    user = User(email=email, password="hashed", role=role)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_report_and_image_access_controls(client, db_session):
    patient = _create_user(db_session, "patient@access.test", "patient")
    doctor = _create_user(db_session, "doctor@access.test", "doctor")
    other_patient = _create_user(db_session, "other@access.test", "patient")

    db_session.add(PatientDoctorLink(patient_id=patient.id, doctor_id=doctor.id))
    db_session.commit()

    image = Image(
        patient_id=patient.id,
        doctor_id=doctor.id,
        image_url="uploads/access_check.png",
    )
    db_session.add(image)
    db_session.commit()
    db_session.refresh(image)

    report = AnalysisReport(
        image_id=image.id,
        patient_id=patient.id,
        doctor_id=doctor.id,
        report_json={"status": "success"},
    )
    db_session.add(report)
    db_session.commit()
    db_session.refresh(report)

    app.dependency_overrides[get_current_user] = lambda: other_patient
    assert client.get(f"/api/analysis/report/{report.id}").status_code == 403
    assert client.get(f"/api/analysis/image/{image.id}").status_code == 403

    app.dependency_overrides[get_current_user] = lambda: patient
    assert client.get(f"/api/analysis/report/{report.id}").status_code == 200
    assert client.get(f"/api/analysis/image/{image.id}").status_code == 200

    app.dependency_overrides[get_current_user] = lambda: doctor
    assert client.get(f"/api/analysis/report/{report.id}").status_code == 200
    assert client.get(f"/api/analysis/image/{image.id}").status_code == 200

    app.dependency_overrides.clear()
