"""
Seed script to insert test doctors into the database.

Run manually:
    python -m app.seed_doctors
"""

from typing import Optional

from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.auth_helpers import hash_password
from app.db import Base, SessionLocal, engine
from app.models import DoctorProfile, User


DOCTORS = [
    {
        "email": "alice@derma.com",
        "password": "password123",
        "full_name": "Dr. Alice Henderson",
        "clinic_name": "DermaAI Clinic",
        "bio": "Board-certified dermatologist specializing in acne and eczema.",
    },
    {
        "email": "bob@derma.com",
        "password": "password123",
        "full_name": "Dr. Bob Martinez",
        "clinic_name": "Downtown Derm Care",
        "bio": "Focused on teledermatology and rapid triage workflows.",
    },
    {
        "email": "carol@derma.com",
        "password": "password123",
        "full_name": "Dr. Carol Singh",
        "clinic_name": "Sunrise Skin Center",
        "bio": "Experienced with pigmentary disorders and pediatric dermatology.",
    },
    {
        "email": "dan@derma.com",
        "password": "password123",
        "full_name": "Dr. Dan Okafor",
        "clinic_name": "Harbor Dermatology",
        "bio": "Passionate about patient education and preventive care.",
    },
]


def seed_doctors(
    db: Optional[Session] = None,
    bind_engine: Optional[Engine] = None,
) -> None:
    """Insert test doctors if they don't already exist."""
    Base.metadata.create_all(bind=bind_engine or engine)
    session = db or SessionLocal()
    close_session = db is None
    try:
        for doctor in DOCTORS:
            user = session.query(User).filter(User.email == doctor["email"]).first()

            if not user:
                user = User(
                    email=doctor["email"],
                    password=hash_password(doctor["password"]),
                    role="doctor",
                )
                session.add(user)
                session.commit()
                session.refresh(user)
                print(f"Created doctor user: {doctor['email']}")
            elif user.role != "doctor":
                print(
                    f"Skipping {doctor['email']}: existing user has role '{user.role}'"
                )
                continue

            profile = (
                session.query(DoctorProfile)
                .filter(DoctorProfile.user_id == user.id)
                .first()
            )
            if not profile:
                profile = DoctorProfile(
                    user_id=user.id,
                    full_name=doctor["full_name"],
                    clinic_name=doctor["clinic_name"],
                    bio=doctor["bio"],
                )
                session.add(profile)
                session.commit()
                print(f"Created profile for: {doctor['full_name']}")
            else:
                updated = False
                if not profile.full_name:
                    profile.full_name = doctor["full_name"]
                    updated = True
                if not profile.clinic_name:
                    profile.clinic_name = doctor["clinic_name"]
                    updated = True
                if not profile.bio:
                    profile.bio = doctor["bio"]
                    updated = True
                if updated:
                    session.commit()
                    print(f"Updated profile for: {doctor['full_name']}")

        print("Doctor seeding completed.")
    except Exception:  # pragma: no cover - defensive rollback, not expected in normal runs
        session.rollback()
        raise
    finally:
        if close_session:
            session.close()


if __name__ == "__main__":
    seed_doctors()
