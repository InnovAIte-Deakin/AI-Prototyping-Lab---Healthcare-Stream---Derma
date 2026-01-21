"""
Seed script to insert the admin user into the database.

Run manually:
    python -m app.seed_admin

Environment variables:
    ADMIN_EMAIL - Admin email (default: admin@derma.com)
    ADMIN_PASSWORD - Admin password (default: adminpass123)
"""

import os
from typing import Optional

from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

from app.services.auth import get_password_hash
from app.db import Base, SessionLocal, engine
from app.models import User


def seed_admin(
    db: Optional[Session] = None,
    bind_engine: Optional[Engine] = None,
) -> None:
    from app.config import DATABASE_URL
    print(f"DEBUG SEED: DATABASE_URL={DATABASE_URL}")
    """Insert or update the admin user from environment variables."""
    Base.metadata.create_all(bind=bind_engine or engine)
    session = db or SessionLocal()
    close_session = db is None

    # Get credentials from environment with defaults
    admin_email = os.getenv("ADMIN_EMAIL", "admin@derma.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "adminpass123")

    try:
        user = session.query(User).filter(User.email == admin_email).first()

        if not user:
            user = User(
                email=admin_email,
                password=get_password_hash(admin_password),
                role="admin",
            )
            session.add(user)
            session.commit()
            print(f"Created admin user: {admin_email}")
        else:
            # Update password and ensure role is admin
            user.password = get_password_hash(admin_password)
            user.role = "admin"
            session.add(user)
            session.commit()
            print(f"Updated admin user: {admin_email}")

        print("Admin seeding completed.")
    except Exception:
        session.rollback()
        raise
    finally:
        if close_session:
            session.close()


if __name__ == "__main__":
    seed_admin()
