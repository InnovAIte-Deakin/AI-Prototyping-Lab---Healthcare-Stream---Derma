"""
Tests for admin routes and role protection.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db import Base, get_db
from app.models import User, AnalysisReport, Image
from app.services.auth import get_password_hash, create_access_token


# ============================================================================
# Test Database Setup
# ============================================================================

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_admin.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with overridden database dependency"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


# ============================================================================
# Helper Functions
# ============================================================================

def create_user(db, email: str, role: str) -> User:
    """Create a user with the given role."""
    user = User(
        email=email,
        password=get_password_hash("password123"),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_token_for_user(user: User) -> str:
    """Generate a JWT token for the given user."""
    return create_access_token(data={"sub": str(user.id), "role": user.role})


# ============================================================================
# Admin Role Protection Tests
# ============================================================================

class TestAdminRoleProtection:
    """Test that admin endpoints are protected by role."""

    def test_admin_overview_requires_auth(self, client):
        """Admin endpoint should reject unauthenticated requests."""
        response = client.get("/admin/overview")
        assert response.status_code == 401

    def test_admin_overview_rejects_patient(self, client, db_session):
        """Admin endpoint should reject patient role."""
        patient = create_user(db_session, "patient@test.com", "patient")
        token = get_token_for_user(patient)

        response = client.get(
            "/admin/overview",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
        assert "Admin role required" in response.json()["detail"]

    def test_admin_overview_rejects_doctor(self, client, db_session):
        """Admin endpoint should reject doctor role."""
        doctor = create_user(db_session, "doctor@test.com", "doctor")
        token = get_token_for_user(doctor)

        response = client.get(
            "/admin/overview",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 403
        assert "Admin role required" in response.json()["detail"]

    def test_admin_overview_allows_admin(self, client, db_session):
        """Admin endpoint should allow admin role."""
        admin = create_user(db_session, "admin@test.com", "admin")
        token = get_token_for_user(admin)

        response = client.get(
            "/admin/overview",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200


# ============================================================================
# Admin Metrics Tests
# ============================================================================

class TestAdminMetrics:
    """Test that admin overview returns correct metrics."""

    def test_overview_returns_all_metrics(self, client, db_session):
        """Admin overview should return all expected metric fields."""
        admin = create_user(db_session, "admin@test.com", "admin")
        token = get_token_for_user(admin)

        response = client.get(
            "/admin/overview",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()

        assert "total_patients" in data
        assert "total_doctors" in data
        assert "pending_cases" in data
        assert "average_rating" in data
        assert "recent_cases" in data

    def test_overview_counts_users_correctly(self, client, db_session):
        """Admin overview should count patients and doctors correctly."""
        # Create users
        admin = create_user(db_session, "admin@test.com", "admin")
        create_user(db_session, "patient1@test.com", "patient")
        create_user(db_session, "patient2@test.com", "patient")
        create_user(db_session, "doctor1@test.com", "doctor")

        token = get_token_for_user(admin)
        response = client.get(
            "/admin/overview",
            headers={"Authorization": f"Bearer {token}"}
        )

        data = response.json()
        assert data["total_patients"] == 2
        assert data["total_doctors"] == 1

    def test_overview_counts_pending_cases(self, client, db_session):
        """Admin overview should count pending cases correctly."""
        admin = create_user(db_session, "admin@test.com", "admin")
        patient = create_user(db_session, "patient@test.com", "patient")

        # Create an image for the patient
        image = Image(patient_id=patient.id, image_url="test/image.jpg")
        db_session.add(image)
        db_session.commit()
        db_session.refresh(image)

        # Create reports with different statuses
        for status in ["none", "pending", "pending", "reviewed"]:
            report = AnalysisReport(
                image_id=image.id,
                patient_id=patient.id,
                review_status=status,
            )
            db_session.add(report)
        db_session.commit()

        token = get_token_for_user(admin)
        response = client.get(
            "/admin/overview",
            headers={"Authorization": f"Bearer {token}"}
        )

        data = response.json()
        assert data["pending_cases"] == 2

    def test_overview_recent_cases_limit(self, client, db_session):
        """Admin overview should return at most 10 recent cases."""
        admin = create_user(db_session, "admin@test.com", "admin")
        patient = create_user(db_session, "patient@test.com", "patient")

        # Create an image
        image = Image(patient_id=patient.id, image_url="test/image.jpg")
        db_session.add(image)
        db_session.commit()
        db_session.refresh(image)

        # Create 15 reports
        for i in range(15):
            report = AnalysisReport(
                image_id=image.id,
                patient_id=patient.id,
                condition=f"Condition {i}",
            )
            db_session.add(report)
        db_session.commit()

        token = get_token_for_user(admin)
        response = client.get(
            "/admin/overview",
            headers={"Authorization": f"Bearer {token}"}
        )

        data = response.json()
        assert len(data["recent_cases"]) <= 10
