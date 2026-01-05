import os
import pytest
import bcrypt
from unittest.mock import patch

@pytest.fixture(scope="session", autouse=True)
def fast_bcrypt():
    """
    Force bcrypt to use minimum rounds (4) for speed during tests.
    """
    original_gensalt = bcrypt.gensalt
    
    def fast_gensalt(rounds=None, prefix=b"2b"):
        return original_gensalt(rounds=4, prefix=prefix)
        
    with patch("bcrypt.gensalt", side_effect=fast_gensalt):
        yield

# -------------------------------------------------------------------
# Test database setup – use in-memory SQLite and fake env vars
# IMPORTANT: Set environment variables BEFORE importing app modules
# because app.db.py creates the engine at module load time.
# -------------------------------------------------------------------

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("GOOGLE_API_KEY", "test-api-key")

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db import Base, get_db
from app.models import User, Image, DoctorProfile

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def test_db():
    """
    Main DB fixture that the existing tests (test_models.py, test_seed_doctors.py, etc.)
    already expect.
    Creates a fresh schema for each test.
    """
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(test_db):
    """
    Alias fixture for our new tests. Just returns the same session as test_db.
    """
    return test_db


# -------------------------------------------------------------------
# FastAPI TestClient with DB override
# -------------------------------------------------------------------

@pytest.fixture(scope="function")
def client(db_session):
    """
    Create a TestClient and override get_db to use the in-memory test session.
    """

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# -------------------------------------------------------------------
# Data fixtures – generic but aligned with models
# -------------------------------------------------------------------

@pytest.fixture
def sample_user_data():
    """
    Return a dict of fields that matches the User model columns.
    We introspect the table so we don't guess column names.
    """
    columns = {c.name for c in User.__table__.columns}
    data = {}

    if "email" in columns:
        data["email"] = "test@example.com"
    if "role" in columns:
        data["role"] = "patient"

    # Fill any password-like column
    for col in columns:
        if col in {"id", "created_at", "updated_at"}:
            continue
        if col in data:
            continue

        if "password" in col:
            data[col] = "hashedpassword123"
        else:
            # generic placeholder
            data[col] = "test_value"

    return data


@pytest.fixture
def sample_doctor_data():
    """
    Return a dict of fields that matches the DoctorProfile model columns.
    """
    columns = {c.name for c in DoctorProfile.__table__.columns}
    data = {}

    if "full_name" in columns:
        data["full_name"] = "Test Doctor"
    if "specialty" in columns:
        data["specialty"] = "Dermatology"
    if "clinic_name" in columns:
        data["clinic_name"] = "Test Clinic"
    if "bio" in columns:
        data["bio"] = "Test bio"
    if "avatar_url" in columns:
        data["avatar_url"] = "https://placehold.co/128x128?text=Test"
    if "location" in columns:
        data["location"] = "Test City"

    for col in columns:
        if col in {"id", "user_id", "created_at", "updated_at"}:
            continue
        if col in data:
            continue
        data[col] = "test_value"

    return data


@pytest.fixture
def sample_user(db_session, sample_user_data):
    """
    Actually insert a User into the test DB using sample_user_data.
    Used by the new analysis tests.
    """
    user = User(**sample_user_data)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def sample_image(db_session, sample_user, tmp_path):
    """
    Create a fake image record + actual temp file on disk so
    the analysis route tests can find it.
    """
    # create a temporary file to simulate an uploaded image
    image_file = tmp_path / "test_image.jpg"
    image_file.write_bytes(b"fake image data")

    image = Image(
        patient_id=sample_user.id,
        image_url=str(image_file),
    )
    db_session.add(image)
    db_session.commit()
    db_session.refresh(image)
    return image
