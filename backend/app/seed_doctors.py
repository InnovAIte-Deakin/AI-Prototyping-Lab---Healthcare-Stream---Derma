"""
Seed script to insert test doctors into the database.

Run manually:
    python -m app.seed_doctors
"""

from typing import Optional

from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.services.auth import get_password_hash
from app.db import Base, SessionLocal, engine
from app.models import DoctorProfile, User


DOCTORS = [
    {
        "email": "alice@derma.com",
        "password": "password123",
        "full_name": "Dr. Alice Henderson",
        "clinic_name": "DermaAI Clinic",
        "bio": "Board-certified dermatologist specializing in acne and eczema with 10+ years in teledermatology.",
        "avatar_url": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    },
    {
        "email": "bob@derma.com",
        "password": "password123",
        "full_name": "Dr. Bob Martinez",
        "clinic_name": "Downtown Derm Care",
        "bio": "Focused on virtual dermatology workflows and rapid triage for urgent cases.",
        "avatar_url": "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
    },
    {
        "email": "carol@derma.com",
        "password": "password123",
        "full_name": "Dr. Carol Singh",
        "clinic_name": "Sunrise Skin Center",
        "bio": "Experienced with pigmentary disorders, pediatric dermatology, and patient education.",
        "avatar_url": "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80",
    },
    {
        "email": "dan@derma.com",
        "password": "password123",
        "full_name": "Dr. Dan Okafor",
        "clinic_name": "Harbor Dermatology",
        "bio": "Passionate about preventive care, post-treatment follow-ups, and community outreach.",
        "avatar_url": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80",
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
                    password=get_password_hash(doctor["password"]),
                    role="doctor",
                )
                session.add(user)
                session.commit()
                session.refresh(user)
                print(f"Created doctor user: {doctor['email']}")
            else:
                # Update password for existing users to ensure valid hash
                user.password = get_password_hash(doctor["password"])
                session.add(user)
                session.commit()
                print(f"Updated password for doctor: {doctor['email']}")

            if user.role != "doctor":
                print(
                    f"Skipping profile for {doctor['email']}: User exists but has role '{user.role}'"
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
                    avatar_url=doctor["avatar_url"],
                )
                session.add(profile)
                session.commit()
                print(f"Created profile for: {doctor['full_name']}")
            else:
                updated = False
                for field in ["full_name", "clinic_name", "bio", "avatar_url"]:
                    desired = doctor[field]
                    if getattr(profile, field) != desired:
                        setattr(profile, field, desired)
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
