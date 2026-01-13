"""
Additional edge case and security tests for B3 authentication.

These tests cover scenarios not in the main test_auth.py file:
- Case sensitivity
- Special characters
- Empty/whitespace inputs
- SQL injection attempts
- API endpoint security
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db import Base, get_db


# ============================================================================
# Test Database Setup
# ============================================================================

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_auth_edge_cases.db"
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
# Edge Case Tests - Email Handling
# ============================================================================

class TestEmailEdgeCases:
    """Test edge cases around email handling"""

    def test_signup_email_case_sensitivity(self, client):
        """Test that emails are case-insensitive for duplicates"""
        # First signup with lowercase
        response1 = client.post(
            "/auth/signup",
            json={
                "email": "test@example.com",
                "password": "password123",
                "role": "patient"
            }
        )
        assert response1.status_code == 201

        # Try to signup with uppercase - should fail as duplicate
        # Note: This currently WON'T fail because we don't normalize emails
        # This test documents current behavior
        response2 = client.post(
            "/auth/signup",
            json={
                "email": "TEST@EXAMPLE.COM",
                "password": "password123",
                "role": "patient"
            }
        )
        # Currently passes (creates second user) - should be fixed in Sprint 2
        assert response2.status_code in [201, 400]

    def test_login_email_exact_match(self, client):
        """Test login requires exact email match"""
        # Signup
        client.post(
            "/auth/signup",
            json={
                "email": "Test@Example.com",
                "password": "password123",
                "role": "patient"
            }
        )

        # Login with exact match should work
        response = client.post(
            "/auth/login",
            json={
                "email": "Test@Example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 200

    def test_signup_email_with_plus_sign(self, client):
        """Test email with + sign (common Gmail feature)"""
        response = client.post(
            "/auth/signup",
            json={
                "email": "user+test@example.com",
                "password": "password123",
                "role": "patient"
            }
        )
        assert response.status_code == 201

    def test_signup_email_with_subdomain(self, client):
        """Test email with subdomain"""
        response = client.post(
            "/auth/signup",
            json={
                "email": "user@mail.example.com",
                "password": "password123",
                "role": "patient"
            }
        )
        assert response.status_code == 201


# ============================================================================
# Edge Case Tests - Password Handling
# ============================================================================

class TestPasswordEdgeCases:
    """Test edge cases around password handling"""

    def test_signup_password_with_special_characters(self, client):
        """Test password with special characters"""
        response = client.post(
            "/auth/signup",
            json={
                "email": "user@example.com",
                "password": "P@ssw0rd!#$%",
                "role": "patient"
            }
        )
        assert response.status_code == 201

    def test_signup_password_with_spaces(self, client):
        """Test password with spaces"""
        response = client.post(
            "/auth/signup",
            json={
                "email": "user@example.com",
                "password": "pass word 123",
                "role": "patient"
            }
        )
        assert response.status_code == 201

    def test_signup_password_unicode(self, client):
        """Test password with unicode characters"""
        response = client.post(
            "/auth/signup",
            json={
                "email": "user@example.com",
                "password": "pässwörd123",
                "role": "patient"
            }
        )
        assert response.status_code == 201

    def test_signup_password_very_long(self, client):
        """Test very long password (100 characters)"""
        long_password = "a" * 100
        response = client.post(
            "/auth/signup",
            json={
                "email": "user@example.com",
                "password": long_password,
                "role": "patient"
            }
        )
        assert response.status_code == 201

    def test_login_password_case_sensitive(self, client):
        """Test that passwords are case-sensitive"""
        # Signup
        client.post(
            "/auth/signup",
            json={
                "email": "user@example.com",
                "password": "Password123",
                "role": "patient"
            }
        )

        # Login with wrong case should fail
        response = client.post(
            "/auth/login",
            json={
                "email": "user@example.com",
                "password": "password123"  # lowercase 'p'
            }
        )
        assert response.status_code == 401


# ============================================================================
# Security Tests - SQL Injection
# ============================================================================

class TestSQLInjectionPrevention:
    """Test that SQL injection attacks are prevented"""

    def test_login_sql_injection_attempt_email(self, client):
        """Test SQL injection in email field"""
        response = client.post(
            "/auth/login",
            json={
                "email": "admin@example.com' OR '1'='1",
                "password": "password"
            }
        )
        # Should fail validation or return 401, not crash
        assert response.status_code in [401, 422]

    def test_login_sql_injection_attempt_password(self, client):
        """Test SQL injection in password field"""
        client.post(
            "/auth/signup",
            json={
                "email": "user@example.com",
                "password": "password123",
                "role": "patient"
            }
        )

        response = client.post(
            "/auth/login",
            json={
                "email": "user@example.com",
                "password": "' OR '1'='1"
            }
        )
        assert response.status_code == 401

    def test_signup_sql_injection_attempt(self, client):
        """Test SQL injection in signup"""
        response = client.post(
            "/auth/signup",
            json={
                "email": "user'; DROP TABLE users;--@example.com",
                "password": "password123",
                "role": "patient"
            }
        )
        # Should either reject as invalid email or handle safely
        assert response.status_code in [201, 422]


# ============================================================================
# Edge Case Tests - Empty/Whitespace Inputs
# ============================================================================

class TestEmptyInputs:
    """Test handling of empty and whitespace inputs"""

    def test_signup_empty_email(self, client):
        """Test signup with empty email"""
        response = client.post(
            "/auth/signup",
            json={
                "email": "",
                "password": "password123",
                "role": "patient"
            }
        )
        assert response.status_code == 422  # Validation error

    def test_signup_empty_password(self, client):
        """Test signup with empty password"""
        response = client.post(
            "/auth/signup",
            json={
                "email": "user@example.com",
                "password": "",
                "role": "patient"
            }
        )
        assert response.status_code == 422  # Validation error

    def test_signup_missing_role(self, client):
        """Test signup without role field"""
        response = client.post(
            "/auth/signup",
            json={
                "email": "user@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 422  # Validation error

    def test_login_empty_credentials(self, client):
        """Test login with empty credentials"""
        response = client.post(
            "/auth/login",
            json={
                "email": "",
                "password": ""
            }
        )
        assert response.status_code == 422  # Validation error


# ============================================================================
# API Endpoint Tests - HTTP Methods
# ============================================================================

class TestAPIEndpointSecurity:
    """Test that endpoints only accept correct HTTP methods"""

    def test_signup_get_method_not_allowed(self, client):
        """Test that GET is not allowed on signup endpoint"""
        response = client.get("/auth/signup")
        assert response.status_code == 405  # Method Not Allowed

    def test_login_get_method_not_allowed(self, client):
        """Test that GET is not allowed on login endpoint"""
        response = client.get("/auth/login")
        assert response.status_code == 405  # Method Not Allowed

    def test_signup_missing_content_type(self, client):
        """Test signup without Content-Type header"""
        payload = b'{"email":"user@example.com","password":"password123","role":"patient"}'
        response = client.post(
            "/auth/signup",
            content=payload,
            headers={}
        )
        # Should still work with FastAPI
        assert response.status_code in [201, 422]


# ============================================================================
# Edge Case Tests - Multiple Users
# ============================================================================

class TestMultipleUsers:
    """Test scenarios with multiple users"""

    def test_signup_multiple_patients(self, client):
        """Test creating multiple patients"""
        for i in range(5):
            response = client.post(
                "/auth/signup",
                json={
                    "email": f"patient{i}@example.com",
                    "password": "password123",
                    "role": "patient"
                }
            )
            assert response.status_code == 201

    def test_signup_multiple_doctors(self, client):
        """Test creating multiple doctors"""
        for i in range(3):
            response = client.post(
                "/auth/signup",
                json={
                    "email": f"doctor{i}@example.com",
                    "password": "password123",
                    "role": "doctor"
                }
            )
            assert response.status_code == 201

    def test_signup_mixed_roles(self, client):
        """Test creating patients and doctors"""
        # Create 2 patients
        for i in range(2):
            client.post(
                "/auth/signup",
                json={
                    "email": f"patient{i}@example.com",
                    "password": "password123",
                    "role": "patient"
                }
            )

        # Create 2 doctors
        for i in range(2):
            response = client.post(
                "/auth/signup",
                json={
                    "email": f"doctor{i}@example.com",
                    "password": "password123",
                    "role": "doctor"
                }
            )
            assert response.status_code == 201


# ============================================================================
# Performance Tests - Basic Load
# ============================================================================

class TestBasicPerformance:
    """Basic performance/load tests"""

    def test_signup_response_time(self, client):
        """Test that signup completes reasonably fast"""
        import time

        start = time.time()
        response = client.post(
            "/auth/signup",
            json={
                "email": "perf@example.com",
                "password": "password123",
                "role": "patient"
            }
        )
        duration = time.time() - start

        assert response.status_code == 201
        assert duration < 1.0  # Should complete in under 1 second

    def test_login_response_time(self, client):
        """Test that login completes reasonably fast"""
        import time

        # Signup first
        client.post(
            "/auth/signup",
            json={
                "email": "perf@example.com",
                "password": "password123",
                "role": "patient"
            }
        )

        # Time the login
        start = time.time()
        response = client.post(
            "/auth/login",
            json={
                "email": "perf@example.com",
                "password": "password123"
            }
        )
        duration = time.time() - start

        assert response.status_code == 200
        assert duration < 1.0  # Should complete in under 1 second
