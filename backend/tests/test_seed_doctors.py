"""
Tests for doctor seeding script.
"""

from app.models import DoctorProfile, User
from app.seed_doctors import DOCTORS, seed_doctors


def test_seed_doctors_inserts_expected_records(test_db):
    """Seeding inserts all test doctors with profiles."""
    seed_doctors(db=test_db, bind_engine=test_db.bind)

    doctors = test_db.query(User).filter(User.role == "doctor").all()
    profiles = test_db.query(DoctorProfile).all()

    assert len(doctors) == len(DOCTORS)
    assert len(profiles) == len(DOCTORS)
    emails = {doctor.email for doctor in doctors}
    for doctor in DOCTORS:
        assert doctor["email"] in emails


def test_seed_doctors_idempotent(test_db):
    """Running the seeder twice should not duplicate records."""
    seed_doctors(db=test_db, bind_engine=test_db.bind)
    seed_doctors(db=test_db, bind_engine=test_db.bind)

    doctor_count = test_db.query(User).filter(User.role == "doctor").count()
    profile_count = test_db.query(DoctorProfile).count()

    assert doctor_count == len(DOCTORS)
    assert profile_count == len(DOCTORS)


def test_seed_doctors_skips_non_doctor_user(test_db):
    """Seeder skips existing users with same email but non-doctor role."""
    first = DOCTORS[0]
    existing_user = User(
        email=first["email"],
        password="dummy",
        role="patient",
    )
    test_db.add(existing_user)
    test_db.commit()

    seed_doctors(db=test_db, bind_engine=test_db.bind)

    # Original user role remains patient and no profile was created
    reloaded = test_db.query(User).filter(User.email == first["email"]).first()
    assert reloaded.role == "patient"
    profile = (
        test_db.query(DoctorProfile)
        .filter(DoctorProfile.user_id == reloaded.id)
        .first()
    )
    assert profile is None


def test_seed_doctors_updates_incomplete_profile(test_db):
    """Seeder fills missing profile fields for existing doctor."""
    target = DOCTORS[1]
    user = User(email=target["email"], password="dummy", role="doctor")
    test_db.add(user)
    test_db.commit()
    profile = DoctorProfile(user_id=user.id, full_name="", clinic_name=None, bio=None)
    test_db.add(profile)
    test_db.commit()

    seed_doctors(db=test_db, bind_engine=test_db.bind)

    updated = test_db.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
    assert updated.full_name == target["full_name"]
    assert updated.clinic_name == target["clinic_name"]
    assert updated.bio == target["bio"]


def test_seed_doctors_uses_internal_session(monkeypatch):
    """Seeder path without provided session should still succeed."""
    # Use a dedicated engine bound to an in-memory SQLite database
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Session = sessionmaker(bind=engine)

    # Ensure tables exist on this engine
    from app.db import Base
    Base.metadata.create_all(bind=engine)

    # Patch SessionLocal to use our test session
    from app import seed_doctors as seeder

    monkeypatch.setattr(seeder, "SessionLocal", Session)
    seeder.seed_doctors()

    with Session() as session:
        doctor_count = session.query(User).filter(User.role == "doctor").count()
        assert doctor_count == len(DOCTORS)
    engine.dispose()
