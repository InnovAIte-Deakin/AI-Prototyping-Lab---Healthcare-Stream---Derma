# Testing Strategy for DERMA (DermaAI)

This document outlines the testing strategy for the DERMA project, ensuring reliability and correctness across the Backend (FastAPI) and Frontend (React).

## 1. Backend Testing (FastAPI)

We will use **pytest** as the primary test runner.

### 1.1 Unit Tests
**Goal:** Verify individual functions and logic in isolation.
**Tools:** `pytest`, `unittest.mock`
**Scope:**
- **Pydantic Models:** Verify validation logic for request/response schemas.
- **Utility Functions:** Test helper functions (e.g., image processing, string formatting).
- **Service Layer:** Test business logic (e.g., AI service wrapper) by mocking external API calls (Google Gemini).

### 1.2 Integration Tests
**Goal:** Verify API endpoints and database interactions.
**Tools:** `pytest`, `FastAPI TestClient`, `SQLAlchemy` (with a test database or rollback transaction).
**Scope:**
- **API Endpoints:** Send requests to `/api/...` and verify response status codes and bodies.
- **Database:** Ensure data is correctly created, read, updated, and deleted in the DB.
- **Dependency Injection:** Override DB dependencies to use a test database (e.g., SQLite in-memory or a separate Postgres test DB).

### 1.3 Setup Plan
1.  Install `pytest` and `httpx`.
2.  Create `backend/tests/` directory.
3.  Configure `conftest.py` for fixtures (test client, db session).

### 1.4 Recommended Improvements
- **Database Parity:** Use `JSONB` for Postgres columns and handle SQLite compatibility (or use Dockerized Postgres for tests) to ensure production-like behavior.
- **Test Data Factories:** Adopt `polyfactory` or `factory_boy` to generate robust test data instead of manual dictionaries.
- **Static Analysis:** Integrate `ruff` (linting) and `mypy` (type checking) to catch errors early.

## 2. Frontend Testing (React + Vite)

We will use **Vitest** (compatible with Vite) and **React Testing Library**.

### 2.1 Unit Tests
**Goal:** Verify individual UI components render and behave correctly.
**Tools:** `Vitest`, `React Testing Library`, `jsdom`
**Scope:**
- **Components:** Test buttons, inputs, and display components (e.g., `Disclaimer.tsx`).
- **Props:** Verify components render correctly based on different props.
- **Events:** Test click handlers and form submissions.

### 2.2 Integration Tests
**Goal:** Verify interactions between multiple components.
**Tools:** `Vitest`, `React Testing Library`
**Scope:**
- **Forms:** Test filling out the upload form and submitting it.
- **State Management:** Verify context updates (e.g., AuthContext) when actions occur.
- **Mocking API:** Mock `fetch` or `axios` calls to simulate backend responses.

### 2.3 Setup Plan
1.  Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
2.  Configure `vite.config.ts` for testing.
3.  Create `frontend/src/__tests__/` directory.

## 3. End-to-End (E2E) Testing

We use **Playwright** for E2E testing to verify complete user flows.

### 3.1 Setup

Install Playwright and browsers:
```bash
cd frontend
npm install
npx playwright install
```

### 3.2 Running E2E Tests

#### Run all E2E tests (headless):
```bash
npm run test:e2e
```

#### Run with interactive UI:
```bash
npm run test:e2e:ui
```

#### Run with visible browser:
```bash
npm run test:e2e:headed
```

#### Run all tests (unit + E2E):
```bash
npm run test:all
```

### 3.3 E2E Test Structure

```
frontend/src/__tests__/e2e/
└── patient-workflow.spec.js    # Patient happy path tests
```

### 3.4 Test Coverage

#### Patient Workflow Happy Path
- ✅ Landing page loads with login form
- ✅ Patient login and dashboard navigation
- ✅ Dashboard shows linked doctor information
- ✅ Navigation to upload page
- ✅ Complete flow: Upload → Analysis → Request Review
- ✅ Analysis displays with disclaimer

#### Error Handling
- ✅ Shows message when no doctor is linked

### 3.5 API Mocking

Tests use **Playwright route mocks** to simulate backend responses without requiring a live database. Mocked endpoints include:

| Endpoint | Method | Mock Response |
|----------|--------|---------------|
| `/patient/my-doctor` | GET | Linked doctor info |
| `/doctors` | GET | Available doctors list |
| `/images` | POST | Image upload response |
| `/api/analysis/{id}` | POST | AI analysis result |
| `/cases` | GET | Patient cases list |
| `/cases/{id}/request-review` | POST | Review request status |

### 3.6 Configuration

Playwright configuration is in `frontend/playwright.config.js`:
- **Dev server**: Automatically starts on port 5173
- **Browser**: Chromium (default)
- **Screenshots**: On failure only
- **Traces**: On first retry

### 3.7 CI/CD Integration

```yaml
# Example GitHub Actions workflow
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e
```

### 3.8 Debugging

View the HTML test report after running tests:
```bash
npx playwright show-report
```

Run a specific test file:
```bash
npx playwright test patient-workflow.spec.js
```

Run tests in debug mode:
```bash
npx playwright test --debug
```


## 4. CI/CD Integration
- Configure GitHub Actions to run `pytest` and `npm test` on every Pull Request to `main`.

## 5. Detailed Backend Test Documentation

This section contains comprehensive tests for B1 (Backend Skeleton) and B2 (Database & Models).

### Test Structure

```
tests/
├── __init__.py           # Test package initialization
├── conftest.py           # Pytest fixtures and configuration
├── test_config.py        # B1: Configuration tests
├── test_main.py          # B1: FastAPI app and CORS tests
├── test_db.py            # B2: Database setup tests
├── test_models.py        # B2: SQLAlchemy models tests
└── test_auth.py          # B3: Authentication tests
```

### Running Tests

#### Run all tests:
```bash
pytest
```

#### Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

#### Run specific test file:
```bash
pytest tests/test_models.py
```

#### Run tests with specific marker:
```bash
pytest -m b1  # Run only B1 tests
pytest -m b2  # Run only B2 tests
```

#### Run verbose output:
```bash
pytest -v
```

### Test Coverage

#### B1 Tests (Backend Skeleton)
- ✅ Configuration loading (DATABASE_URL, GOOGLE_API_KEY)
- ✅ FastAPI app initialization
- ✅ CORS middleware configuration
- ✅ Root endpoint functionality
- ✅ OpenAPI documentation endpoints

#### B2 Tests (Database & Models)
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

#### B3 Tests (Authentication)
- ✅ User Signup (Patient & Doctor)
- ✅ User Login (Valid & Invalid credentials)
- ✅ Password Hashing & Verification
- ✅ Role-Based Access Control (RBAC) helpers
- ✅ Doctor Profile creation on signup
- ✅ Duplicate email prevention

### Fixtures

#### Available Fixtures (from conftest.py)
- `test_db`: Fresh in-memory SQLite database for each test
- `client`: FastAPI test client with database override
- `sample_user_data`: Sample user dictionary for testing
- `sample_doctor_data`: Sample doctor profile dictionary for testing

### Requirements

All test dependencies are listed in `requirements.txt`:
- pytest
- pytest-cov
- httpx (for TestClient)

### CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: |
    pip install -r requirements.txt
    pytest --cov=app --cov-report=xml
```

### Notes

- Tests use in-memory SQLite database for speed and isolation
- Each test gets a fresh database (no shared state)
- CORS tests verify localhost:5173 origin (frontend URL)
- All models are tested for creation, constraints, and relationships

