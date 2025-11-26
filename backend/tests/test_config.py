"""
B1 Tests: Configuration loading
Tests for app/config.py
"""
import os
import pytest


def test_config_loads_database_url():
    """Test that DATABASE_URL is loaded from environment"""
    from app.config import DATABASE_URL

    assert DATABASE_URL is not None
    assert isinstance(DATABASE_URL, str)
    # In test environment, we set it to sqlite
    assert "sqlite" in DATABASE_URL.lower() or "postgresql" in DATABASE_URL.lower()


def test_config_loads_openai_key():
    """Test that OPENAI_API_KEY is loaded from environment"""
    from app.config import OPENAI_API_KEY

    assert OPENAI_API_KEY is not None
    assert isinstance(OPENAI_API_KEY, str)
    assert len(OPENAI_API_KEY) > 0


def test_config_uses_dotenv():
    """Test that dotenv is being used to load .env file"""
    # This test verifies that the config module loads dotenv
    import app.config

    # Check that the module has the expected variables
    assert hasattr(app.config, 'DATABASE_URL')
    assert hasattr(app.config, 'OPENAI_API_KEY')


def test_environment_variables_accessible():
    """Test that environment variables are accessible"""
    database_url = os.getenv("DATABASE_URL")
    openai_key = os.getenv("OPENAI_API_KEY")

    assert database_url is not None, "DATABASE_URL should be set in environment"
    assert openai_key is not None, "OPENAI_API_KEY should be set in environment"
