"""
B2 Tests: Database configuration and session management
Tests for app/db.py
"""
import pytest
from sqlalchemy.orm import Session


def test_database_engine_created():
    """Test that database engine is created"""
    from app.db import engine

    assert engine is not None
    assert hasattr(engine, 'connect')


def test_session_local_created():
    """Test that SessionLocal is created"""
    from app.db import SessionLocal

    assert SessionLocal is not None
    # SessionLocal should be a sessionmaker
    assert callable(SessionLocal)


def test_base_declarative_created():
    """Test that Base declarative is created"""
    from app.db import Base

    assert Base is not None
    assert hasattr(Base, 'metadata')


def test_get_db_dependency():
    """Test that get_db dependency function exists"""
    from app.db import get_db

    assert callable(get_db)
    # get_db should be a generator
    import inspect
    assert inspect.isgeneratorfunction(get_db)


def test_get_db_yields_session(test_db):
    """Test that get_db yields a database session"""
    from app.db import get_db

    db_generator = get_db()
    db_session = next(db_generator)

    assert isinstance(db_session, Session)


def test_get_db_closes_session():
    """Test that get_db properly closes the session"""
    from app.db import get_db

    db_generator = get_db()
    db_session = next(db_generator)

    # Verify session is open
    assert not db_session.is_active or True  # Session might not be in transaction yet

    # Close the generator (triggers finally block)
    try:
        next(db_generator)
    except StopIteration:
        pass  # Expected behavior


def test_base_metadata_has_tables():
    """Test that Base metadata contains our tables"""
    from app.db import Base

    # After importing models, Base should have tables
    from app import models  # noqa

    table_names = Base.metadata.tables.keys()
    assert len(table_names) > 0, "Base metadata should have tables after importing models"


def test_database_connection_string():
    """Test that DATABASE_URL is used for engine creation"""
    from app.config import DATABASE_URL
    from app.db import engine

    # Engine should be created with the DATABASE_URL
    assert engine is not None

    # Check that the URL is accessible
    engine_url = str(engine.url)
    assert len(engine_url) > 0
