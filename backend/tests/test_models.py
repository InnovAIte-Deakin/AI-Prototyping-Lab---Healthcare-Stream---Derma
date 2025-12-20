"""
B2 Tests: SQLAlchemy models
Tests for app/models.py
"""
import pytest
from datetime import datetime
from sqlalchemy import inspect
from app.models import User, DoctorProfile, PatientDoctorLink, Image, AnalysisReport


def test_user_model_exists():
    """Test that User model is defined"""
    assert User is not None
    assert User.__tablename__ == "users"


def test_user_model_columns():
    """Test that User model has required columns"""
    mapper = inspect(User)
    column_names = [col.key for col in mapper.columns]

    assert "id" in column_names
    assert "email" in column_names
    assert "password" in column_names
    assert "role" in column_names
    assert "created_at" in column_names


def test_user_model_primary_key():
    """Test that User model has correct primary key"""
    mapper = inspect(User)
    pk_columns = [col.name for col in mapper.primary_key]

    assert "id" in pk_columns
    assert len(pk_columns) == 1


def test_user_can_be_created(test_db, sample_user_data):
    """Test that a User can be created in the database"""
    user = User(**sample_user_data)
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    assert user.id is not None
    assert user.email == sample_user_data["email"]
    assert user.password == sample_user_data["password"]
    assert user.role == sample_user_data["role"]
    assert user.created_at is not None


def test_user_email_unique_constraint(test_db, sample_user_data):
    """Test that User email has unique constraint"""
    user1 = User(**sample_user_data)
    test_db.add(user1)
    test_db.commit()

    # Try to create another user with same email
    user2 = User(**sample_user_data)
    test_db.add(user2)

    with pytest.raises(Exception):  # Should raise IntegrityError
        test_db.commit()


def test_doctor_profile_model_exists():
    """Test that DoctorProfile model is defined"""
    assert DoctorProfile is not None
    assert DoctorProfile.__tablename__ == "doctor_profiles"


def test_doctor_profile_model_columns():
    """Test that DoctorProfile model has required columns"""
    mapper = inspect(DoctorProfile)
    column_names = [col.key for col in mapper.columns]

    assert "id" in column_names
    assert "user_id" in column_names
    assert "full_name" in column_names
    assert "clinic_name" in column_names
    assert "bio" in column_names


def test_doctor_profile_has_foreign_key():
    """Test that DoctorProfile has foreign key to User"""
    mapper = inspect(DoctorProfile)
    fk_columns = [col for col in mapper.columns if col.foreign_keys]

    assert len(fk_columns) > 0
    # user_id should have foreign key
    user_id_col = mapper.columns['user_id']
    assert len(user_id_col.foreign_keys) > 0


def test_doctor_profile_can_be_created(test_db, sample_user_data, sample_doctor_data):
    """Test that a DoctorProfile can be created"""
    # First create a user (doctor)
    doctor_user_data = sample_user_data.copy()
    doctor_user_data["role"] = "doctor"
    doctor_user_data["email"] = "doctor@example.com"
    user = User(**doctor_user_data)
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)

    # Create doctor profile
    doctor_profile = DoctorProfile(user_id=user.id, **sample_doctor_data)
    test_db.add(doctor_profile)
    test_db.commit()
    test_db.refresh(doctor_profile)

    assert doctor_profile.id is not None
    assert doctor_profile.user_id == user.id
    assert doctor_profile.full_name == sample_doctor_data["full_name"]


def test_patient_doctor_link_model_exists():
    """Test that PatientDoctorLink model is defined"""
    assert PatientDoctorLink is not None
    assert PatientDoctorLink.__tablename__ == "patient_doctor_links"


def test_patient_doctor_link_columns():
    """Test that PatientDoctorLink has required columns"""
    mapper = inspect(PatientDoctorLink)
    column_names = [col.key for col in mapper.columns]

    assert "id" in column_names
    assert "patient_id" in column_names
    assert "doctor_id" in column_names
    assert "status" in column_names


def test_patient_doctor_link_default_status(test_db, sample_user_data):
    """Test that PatientDoctorLink status defaults to 'active'"""
    # Create patient and doctor
    patient_data = sample_user_data.copy()
    patient_data["role"] = "patient"
    patient = User(**patient_data)
    test_db.add(patient)

    doctor = User(email="doctor@example.com", password="pass", role="doctor")
    test_db.add(doctor)
    test_db.commit()
    test_db.refresh(patient)
    test_db.refresh(doctor)

    # Create link without specifying status
    link = PatientDoctorLink(patient_id=patient.id, doctor_id=doctor.id)
    test_db.add(link)
    test_db.commit()
    test_db.refresh(link)

    assert link.status == "active"


def test_image_model_exists():
    """Test that Image model is defined"""
    assert Image is not None
    assert Image.__tablename__ == "images"


def test_image_model_columns():
    """Test that Image model has required columns"""
    mapper = inspect(Image)
    column_names = [col.key for col in mapper.columns]

    assert "id" in column_names
    assert "patient_id" in column_names
    assert "doctor_id" in column_names
    assert "image_url" in column_names
    assert "uploaded_at" in column_names


def test_image_can_be_created(test_db, sample_user_data):
    """Test that an Image can be created"""
    # Create a patient
    patient = User(**sample_user_data)
    test_db.add(patient)
    test_db.commit()
    test_db.refresh(patient)

    # Create image
    image = Image(
        patient_id=patient.id,
        image_url="https://example.com/image.jpg"
    )
    test_db.add(image)
    test_db.commit()
    test_db.refresh(image)

    assert image.id is not None
    assert image.patient_id == patient.id
    assert image.image_url == "https://example.com/image.jpg"
    assert image.uploaded_at is not None


def test_analysis_report_model_exists():
    """Test that AnalysisReport model is defined"""
    assert AnalysisReport is not None
    assert AnalysisReport.__tablename__ == "analysis_reports"


def test_analysis_report_columns():
    """Test that AnalysisReport has required columns"""
    mapper = inspect(AnalysisReport)
    column_names = [col.key for col in mapper.columns]

    assert "id" in column_names
    assert "image_id" in column_names
    assert "patient_id" in column_names
    assert "doctor_id" in column_names
    assert "review_status" in column_names
    assert "doctor_active" in column_names
    assert "report_json" in column_names
    assert "created_at" in column_names


def test_analysis_report_can_be_created(test_db, sample_user_data):
    """Test that an AnalysisReport can be created"""
    # Create patient and image
    patient = User(**sample_user_data)
    test_db.add(patient)
    test_db.commit()
    test_db.refresh(patient)

    image = Image(patient_id=patient.id, image_url="https://example.com/img.jpg")
    test_db.add(image)
    test_db.commit()
    test_db.refresh(image)

    # Create report
    report = AnalysisReport(
        image_id=image.id,
        patient_id=patient.id,
        report_json='{"diagnosis": "test"}'
    )
    test_db.add(report)
    test_db.commit()
    test_db.refresh(report)

    assert report.id is not None
    assert report.image_id == image.id
    assert report.patient_id == patient.id
    assert report.report_json == '{"diagnosis": "test"}'
    assert report.review_status == "none"
    assert report.doctor_active is False
    assert report.created_at is not None


def test_all_models_have_metadata():
    """Test that all models are registered in Base.metadata"""
    from app.db import Base

    table_names = list(Base.metadata.tables.keys())

    assert "users" in table_names
    assert "doctor_profiles" in table_names
    assert "patient_doctor_links" in table_names
    assert "images" in table_names
    assert "analysis_reports" in table_names
    assert len(table_names) == 5


def test_foreign_key_relationships():
    """Test that foreign keys are properly defined"""
    # DoctorProfile -> User
    dp_mapper = inspect(DoctorProfile)
    dp_user_id = dp_mapper.columns['user_id']
    assert len(dp_user_id.foreign_keys) > 0

    # PatientDoctorLink -> User (patient_id and doctor_id)
    pdl_mapper = inspect(PatientDoctorLink)
    pdl_patient_id = pdl_mapper.columns['patient_id']
    pdl_doctor_id = pdl_mapper.columns['doctor_id']
    assert len(pdl_patient_id.foreign_keys) > 0
    assert len(pdl_doctor_id.foreign_keys) > 0

    # Image -> User
    img_mapper = inspect(Image)
    img_patient_id = img_mapper.columns['patient_id']
    assert len(img_patient_id.foreign_keys) > 0

    # AnalysisReport -> Image and User
    ar_mapper = inspect(AnalysisReport)
    ar_image_id = ar_mapper.columns['image_id']
    ar_patient_id = ar_mapper.columns['patient_id']
    assert len(ar_image_id.foreign_keys) > 0
    assert len(ar_patient_id.foreign_keys) > 0
