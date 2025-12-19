"""
Tests for authentication routes and helpers (JWT version).
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db import Base, get_db
from app.models import User, DoctorProfile
from app.services.auth import get_password_hash, verify_password, create_access_token
from fastapi import HTTPException

# ============================================================================
# Test Database Setup
# ============================================================================

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_auth_jwt.db"
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
# Password Utility Tests
# ============================================================================

class TestPasswordHelpers:
    """Test password hashing and validation"""

    def test_hash_password(self):
        password = "test_password_123"
        hashed = get_password_hash(password)
        assert hashed != password
        # bcrypt hashes are not deterministic (salt included), so we check validity
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        password = "correct_password"
        wrong_password = "wrong_password"
        hashed = get_password_hash(password)
        assert verify_password(wrong_password, hashed) is False


# ============================================================================
# Auth Routes Tests
# ============================================================================

class TestAuthRoutes:
    """Test auth endpoints (Signup, Login, Me)"""

    def test_signup_success(self, client):
        response = client.post(
            "/auth/signup",
            json={
                "email": "user@example.com",
                "password": "password123",
                "role": "patient"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "user@example.com"
        assert "password" not in data

    def test_login_success(self, client):
        # 1. Signup
        client.post(
            "/auth/signup",
            json={
                "email": "login@example.com",
                "password": "password123",
                "role": "patient"
            }
        )

        # 2. Login
        response = client.post(
            "/auth/login",
            json={
                "email": "login@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["email"] == "login@example.com"

    def test_access_protected_route(self, client):
        # 1. Signup & Login to get token
        client.post(
            "/auth/signup",
            json={
                "email": "protected@example.com",
                "password": "password123",
                "role": "patient"
            }
        )
        login_res = client.post(
            "/auth/login",
            json={"email": "protected@example.com", "password": "password123"}
        )
        token = login_res.json()["access_token"]

        # 2. Access /auth/me with token
        response = client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        assert response.json()["email"] == "protected@example.com"

    def test_access_protected_route_no_token(self, client):
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_access_protected_route_invalid_token(self, client):
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
