"""
Tests for authentication routes and helpers.

Tests B3 implementation:
- User signup (patient and doctor)
- User login with valid/invalid credentials
- Authentication helper functions
- Role-based access control
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db import Base, get_db
from app.models import User, DoctorProfile
from app.auth_helpers import hash_password, verify_password, get_current_user, get_current_patient, get_current_doctor
from fastapi import Request, HTTPException


# ============================================================================
# Test Database Setup (In-Memory SQLite)
# ============================================================================

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_auth.db"
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
    """Test password hashing and verification"""

    def test_hash_password(self):
        """Test password hashing creates consistent hashes"""
        password = "test_password_123"
        hashed = hash_password(password)

        assert hashed is not None
        assert hashed != password
        assert len(hashed) > 0
        # Same password should produce same hash (for SHA256)
        assert hash_password(password) == hashed

    def test_verify_password_correct(self):
        """Test password verification with correct password"""
        password = "correct_password"
        hashed = hash_password(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password"""
        password = "correct_password"
        wrong_password = "wrong_password"
        hashed = hash_password(password)

        assert verify_password(wrong_password, hashed) is False


# ============================================================================
# Signup Endpoint Tests
# ============================================================================

class TestSignup:
    """Test user signup functionality"""

    def test_signup_patient_success(self, client):
        """Test successful patient signup"""
        response = client.post(
            "/auth/signup",
            json={
                "email": "patient@example.com",
                "password": "password123",
                "role": "patient"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "patient@example.com"
        assert data["role"] == "patient"
        assert "id" in data
        assert "password" not in data  # Should not expose password

    def test_signup_doctor_success(self, client, db_session):
        """Test successful doctor signup creates DoctorProfile"""
        response = client.post(
            "/auth/signup",
            json={
                "email": "doctor@example.com",
                "password": "password123",
                "role": "doctor"
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "doctor@example.com"
        assert data["role"] == "doctor"

        # Verify DoctorProfile was created
        user = db_session.query(User).filter(User.email == "doctor@example.com").first()
        assert user is not None
        doctor_profile = db_session.query(DoctorProfile).filter(DoctorProfile.user_id == user.id).first()
        assert doctor_profile is not None
        assert doctor_profile.full_name == ""

    def test_signup_duplicate_email(self, client):
        """Test signup fails with duplicate email"""
        # First signup
        client.post(
            "/auth/signup",
            json={
                "email": "duplicate@example.com",
                "password": "password123",
                "role": "patient"
            }
        )

        # Duplicate signup
        response = client.post(
            "/auth/signup",
            json={
                "email": "duplicate@example.com",
                "password": "different_password",
                "role": "patient"
            }
        )

        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_signup_invalid_role(self, client):
        """Test signup fails with invalid role"""
        response = client.post(
            "/auth/signup",
            json={
                "email": "test@example.com",
                "password": "password123",
                "role": "admin"  # Invalid role
            }
        )

        assert response.status_code == 422  # Validation error

    def test_signup_invalid_email(self, client):
        """Test signup fails with invalid email format"""
        response = client.post(
            "/auth/signup",
            json={
                "email": "not_an_email",
                "password": "password123",
                "role": "patient"
            }
        )

        assert response.status_code == 422  # Validation error

    def test_signup_short_password(self, client):
        """Test signup fails with password too short"""
        response = client.post(
            "/auth/signup",
            json={
                "email": "test@example.com",
                "password": "123",  # Too short (< 6 chars)
                "role": "patient"
            }
        )

        assert response.status_code == 422  # Validation error


# ============================================================================
# Login Endpoint Tests
# ============================================================================

class TestLogin:
    """Test user login functionality"""

    @pytest.fixture(autouse=True)
    def setup(self, client):
        """Create test users before each test"""
        # Create patient
        client.post(
            "/auth/signup",
            json={
                "email": "patient@test.com",
                "password": "password123",
                "role": "patient"
            }
        )
        # Create doctor
        client.post(
            "/auth/signup",
            json={
                "email": "doctor@test.com",
                "password": "password123",
                "role": "doctor"
            }
        )

    def test_login_patient_success(self, client):
        """Test successful patient login"""
        response = client.post(
            "/auth/login",
            json={
                "email": "patient@test.com",
                "password": "password123"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "patient@test.com"
        assert data["role"] == "patient"
        assert "user_id" in data
        assert data["user_id"] > 0

    def test_login_doctor_success(self, client):
        """Test successful doctor login"""
        response = client.post(
            "/auth/login",
            json={
                "email": "doctor@test.com",
                "password": "password123"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "doctor@test.com"
        assert data["role"] == "doctor"
        assert "user_id" in data

    def test_login_wrong_password(self, client):
        """Test login fails with wrong password"""
        response = client.post(
            "/auth/login",
            json={
                "email": "patient@test.com",
                "password": "wrong_password"
            }
        )

        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, client):
        """Test login fails with non-existent email"""
        response = client.post(
            "/auth/login",
            json={
                "email": "nonexistent@test.com",
                "password": "password123"
            }
        )

        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    def test_login_invalid_email_format(self, client):
        """Test login with invalid email format"""
        response = client.post(
            "/auth/login",
            json={
                "email": "not_an_email",
                "password": "password123"
            }
        )

        assert response.status_code == 422  # Validation error


# ============================================================================
# Authentication Helper Tests
# ============================================================================

class TestAuthHelpers:
    """Test authentication helper functions"""

    @pytest.fixture(autouse=True)
    def setup_users(self, client, db_session):
        """Create test users"""
        # Create patient
        response = client.post(
            "/auth/signup",
            json={
                "email": "patient@helper.com",
                "password": "password123",
                "role": "patient"
            }
        )
        self.patient_id = response.json()["id"]

        # Create doctor
        response = client.post(
            "/auth/signup",
            json={
                "email": "doctor@helper.com",
                "password": "password123",
                "role": "doctor"
            }
        )
        self.doctor_id = response.json()["id"]
        self.db = db_session

    def test_get_current_user_valid(self):
        """Test get_current_user with valid user_id"""
        # Mock request with X-User-Id header
        class MockRequest:
            def __init__(self, user_id):
                self.headers = {"X-User-Id": str(user_id)}

        request = MockRequest(self.patient_id)
        user = get_current_user(request, self.db)

        assert user is not None
        assert user.id == self.patient_id
        assert user.email == "patient@helper.com"

    def test_get_current_user_missing_header(self):
        """Test get_current_user fails without header"""
        class MockRequest:
            def __init__(self):
                self.headers = {}

        request = MockRequest()

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(request, self.db)

        assert exc_info.value.status_code == 401
        assert "Missing X-User-Id" in exc_info.value.detail

    def test_get_current_user_invalid_id(self):
        """Test get_current_user fails with non-existent user_id"""
        class MockRequest:
            def __init__(self):
                self.headers = {"X-User-Id": "99999"}

        request = MockRequest()

        with pytest.raises(HTTPException) as exc_info:
            get_current_user(request, self.db)

        assert exc_info.value.status_code == 401
        assert "not found" in exc_info.value.detail.lower()

    def test_get_current_patient_success(self):
        """Test get_current_patient with patient user"""
        patient = self.db.query(User).filter(User.id == self.patient_id).first()

        result = get_current_patient(patient)
        assert result.id == self.patient_id
        assert result.role == "patient"

    def test_get_current_patient_fails_for_doctor(self):
        """Test get_current_patient fails for doctor user"""
        doctor = self.db.query(User).filter(User.id == self.doctor_id).first()

        with pytest.raises(HTTPException) as exc_info:
            get_current_patient(doctor)

        assert exc_info.value.status_code == 403
        assert "Patient role required" in exc_info.value.detail

    def test_get_current_doctor_success(self):
        """Test get_current_doctor with doctor user"""
        doctor = self.db.query(User).filter(User.id == self.doctor_id).first()

        result = get_current_doctor(doctor)
        assert result.id == self.doctor_id
        assert result.role == "doctor"

    def test_get_current_doctor_fails_for_patient(self):
        """Test get_current_doctor fails for patient user"""
        patient = self.db.query(User).filter(User.id == self.patient_id).first()

        with pytest.raises(HTTPException) as exc_info:
            get_current_doctor(patient)

        assert exc_info.value.status_code == 403
        assert "Doctor role required" in exc_info.value.detail


# ============================================================================
# Integration Tests
# ============================================================================

class TestAuthIntegration:
    """End-to-end authentication flow tests"""

    def test_signup_login_flow(self, client):
        """Test complete signup and login flow"""
        # 1. Signup
        signup_response = client.post(
            "/auth/signup",
            json={
                "email": "flow@test.com",
                "password": "password123",
                "role": "patient"
            }
        )
        assert signup_response.status_code == 201
        user_data = signup_response.json()

        # 2. Login with same credentials
        login_response = client.post(
            "/auth/login",
            json={
                "email": "flow@test.com",
                "password": "password123"
            }
        )
        assert login_response.status_code == 200
        login_data = login_response.json()

        # 3. Verify data consistency
        assert user_data["id"] == login_data["user_id"]
        assert user_data["email"] == login_data["email"]
        assert user_data["role"] == login_data["role"]

    def test_doctor_signup_creates_profile(self, client, db_session):
        """Test doctor signup creates both User and DoctorProfile"""
        # Signup as doctor
        response = client.post(
            "/auth/signup",
            json={
                "email": "newdoctor@test.com",
                "password": "password123",
                "role": "doctor"
            }
        )
        assert response.status_code == 201
        user_id = response.json()["id"]

        # Verify User exists
        user = db_session.query(User).filter(User.id == user_id).first()
        assert user is not None
        assert user.role == "doctor"

        # Verify DoctorProfile exists
        profile = db_session.query(DoctorProfile).filter(DoctorProfile.user_id == user_id).first()
        assert profile is not None
        assert profile.user_id == user_id

    def test_patient_signup_no_doctor_profile(self, client, db_session):
        """Test patient signup does NOT create DoctorProfile"""
        # Signup as patient
        response = client.post(
            "/auth/signup",
            json={
                "email": "patient@test.com",
                "password": "password123",
                "role": "patient"
            }
        )
        assert response.status_code == 201
        user_id = response.json()["id"]

        # Verify User exists
        user = db_session.query(User).filter(User.id == user_id).first()
        assert user is not None
        assert user.role == "patient"

        # Verify NO DoctorProfile exists
        profile = db_session.query(DoctorProfile).filter(DoctorProfile.user_id == user_id).first()
        assert profile is None
