# Tests for SkinScope Backend

This directory contains comprehensive tests for B1 (Backend Skeleton) and B2 (Database & Models).

## Test Structure

```
tests/
├── __init__.py           # Test package initialization
├── conftest.py           # Pytest fixtures and configuration
├── test_config.py        # B1: Configuration tests
├── test_main.py          # B1: FastAPI app and CORS tests
├── test_db.py            # B2: Database setup tests
└── test_models.py        # B2: SQLAlchemy models tests
```

## Running Tests

### Run all tests:
```bash
pytest
```

### Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

### Run specific test file:
```bash
pytest tests/test_models.py
```

### Run tests with specific marker:
```bash
pytest -m b1  # Run only B1 tests
pytest -m b2  # Run only B2 tests
```

### Run verbose output:
```bash
pytest -v
```

## Test Coverage

### B1 Tests (Backend Skeleton)
- ✅ Configuration loading (DATABASE_URL, OPENAI_API_KEY)
- ✅ FastAPI app initialization
- ✅ CORS middleware configuration
- ✅ Root endpoint functionality
- ✅ OpenAPI documentation endpoints

### B2 Tests (Database & Models)
- ✅ Database engine creation
- ✅ Session management
- ✅ get_db dependency
- ✅ User model (CRUD, constraints)
- ✅ DoctorProfile model (foreign keys, relationships)
- ✅ PatientDoctorLink model (default values)
- ✅ Image model (timestamps, relationships)
- ✅ AnalysisReport model (JSON storage)
- ✅ Foreign key relationships validation
- ✅ Model metadata registration

## Fixtures

### Available Fixtures (from conftest.py)
- `test_db`: Fresh in-memory SQLite database for each test
- `client`: FastAPI test client with database override
- `sample_user_data`: Sample user dictionary for testing
- `sample_doctor_data`: Sample doctor profile dictionary for testing

## Requirements

All test dependencies are listed in `requirements.txt`:
- pytest
- pytest-cov
- httpx (for TestClient)

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: |
    pip install -r requirements.txt
    pytest --cov=app --cov-report=xml
```

## Notes

- Tests use in-memory SQLite database for speed and isolation
- Each test gets a fresh database (no shared state)
- CORS tests verify localhost:5173 origin (frontend URL)
- All models are tested for creation, constraints, and relationships
