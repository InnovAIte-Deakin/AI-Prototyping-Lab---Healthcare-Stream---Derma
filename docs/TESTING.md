# Testing Strategy for DERMA (DermaAI)

This document outlines the testing strategy for the DERMA project, ensuring reliability and correctness across the Backend (FastAPI) and Frontend (React).

## 🚀 Quick Start (Recommended)

For the simplest and most robust way to run ALL tests (Backend, Frontend, and E2E) with automatic configuration and data seeding, use the provided PowerShell script in the root directory:

```powershell
./run_tests.ps1
```

This script will:
1.  Configure the environment (`MOCK_AI=true`).
2.  Run Backend Unit Tests (`pytest`).
3.  Run Frontend Unit Tests (`vitest`).
4.  Reset and Seed E2E Test Data.
5.  Run End-to-End Tests (`playwright`).

---

## Security & Data Safety (B11)

The backend now treats uploaded media as sensitive content:

- Authenticated uploads are stored under the private `MEDIA_ROOT` and are no longer served via public static files. Clients receive short-lived signed URLs (`/media/... ?token=...`) and the TTL is configurable via `MEDIA_URL_TTL_SECONDS` (default: 300 seconds).
- Anonymous "try now" uploads are stored under `media/anonymous` and deleted when the public session expires (default: 20 minutes). Expired sessions trigger file cleanup automatically.
- Report endpoints (`/api/analysis/report/*` and `/api/analysis/image/*`) now require authentication and enforce patient/doctor access checks.

---

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

## 3. End-to-End (E2E) Testing (Playwright)

We use **Playwright** for end-to-end testing of full user journeys.

### 3.0 Quick Start

**Local Development (with real AI):**
```bash
# Terminal 1: Backend
cd backend
python -m app.seed_data          # Seed doctors
python -m app.seed_e2e_fixtures  # Seed E2E test accounts + cases
python -m uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Run Tests
cd frontend
npx playwright test --headed
```

**CI Mode (with mock AI, no API key needed):**
```powershell
# Set mock mode before starting backend
$env:MOCK_AI = "true"
python -m uvicorn app.main:app --reload
```

### 3.1 Setup
1. **Install Browsers**:
   ```bash
   cd frontend
   npx playwright install
   ```
2. **Seed Test Data**: 
   - `python -m app.seed_data` — Seeds doctors only
   - `python -m app.seed_e2e_fixtures` — Creates test patients with cases in specific states

### 3.2 Running Tests
**Standard Run (Headed)**:
```bash
cd frontend
npx playwright test --headed
```

**Visual Debugging (Trace Viewer)**:
If a test fails, open the trace file to see exactly what happened:
```bash
npx playwright show-trace test-results/*/trace.zip
```

**UI Mode** (element inspection):
```bash
npx playwright test --ui
```

### 3.3 E2E Test Accounts (Fixtures)

| Account | Password | Purpose |
|---------|----------|---------|
| `alice@derma.com` | password123 | Doctor (seeded by `seed_data.py`) |
| `e2e_patient_aichat@test.com` | password123 | AI chat test (case not escalated) |
| `e2e_patient_pending@test.com` | password123 | Doctor-review test (case pending) |
| `e2e_patient_accepted@test.com` | password123 | Patient-doctor chat test |

### 3.4 CI Mock Mode

In GitHub Actions, we set `MOCK_AI=true` to run tests without a Gemini API key. The `MockGeminiService` returns deterministic responses for predictable test behavior.

### 3.5 Selector Strategy

Use **user-first selectors** that don't break when implementation changes:

| ❌ Brittle | ✅ Resilient |
|------------|-------------|
| `#upload-input` | `getByLabel('Upload image')` |
| `.text-red-700` | `getByRole('alert')` |
| `form button[type="submit"]` | `getByRole('button', { name: /send/i })` |

### 3.6 Authenticated State Reuse

Tests use pre-authenticated sessions saved by `auth.setup.js`:
```javascript
test.use({ storageState: '.auth/doctor.json' });

test('Doctor can view dashboard', async ({ page }) => {
  await page.goto('/doctor-dashboard'); // Already logged in!
});
```

### 3.7 Test Scenarios & Flows

Here is the expected behavior for each test file:

#### 1. `auth.setup.js` (Infrastructure)
*   **Goal:** Create reuseable session files (`.auth/*.json`) for other tests.
*   **Flow:**
    1.  Logs in as **Doctor** (`alice@derma.com`) -> Verification: Dashboard -> Saves `.auth/doctor.json`
    2.  Logs in as **Patient A** (`e2e_patient_aichat`) -> Verification: Dashboard -> Saves `.auth/patient_aichat.json`
    3.  Logs in as **Patient B** (`e2e_patient_pending`) -> Verification: Dashboard -> Saves `.auth/patient_pending.json`
    4.  Logs in as **Patient C** (`e2e_patient_accepted`) -> Verification: Dashboard -> Saves `.auth/patient_accepted.json`
*   **Note:** Runs automatically via Playwright dependencies.

#### 2. `auth-flow.spec.js` (Lifecycle)
*   **Goal:** Verify login, logout, and route protection.
*   **Flow:**
    1.  **Login:** Manually logs in with seeded credentials.
    2.  **Verify:** Checks "Patient Dashboard" heading.
    3.  **Logout:** Clicks "Logout" button.
    4.  **Verify:** Redirected to landing page (`/`).
    5.  **Protect:** Attempts to force-navigate to `/patient-dashboard`.
    6.  **Verify:** Redirected back to landing page.

#### 3. `anonymous-flow.spec.js` (Public)
*   **Goal:** Test "Try without signing up" workflow.
*   **Flow:**
    1.  **Start:** Navigate to `/try-anonymous`.
    2.  **Upload:** Uploads `test_skin_image.png`.
    3.  **Analyze:** Clicks "Run quick analysis" -> Mock AI returns results.
    4.  **Preview:** Sees "Chat Preview" (limited chat interface).
    5.  **Convert:** Clicks "Sign up to save this case".
    6.  **Signup:** Fills signup form with a *new* unique email.
    7.  **Verify:** Redirects to Patient Dashboard -> Checks History -> Finds the saved case.

#### 4. `patient-ai-chat.spec.js` (Golden Path: Step 1)
*   **Goal:** Test patient interaction with AI before doctor involvement.
*   **State:** Uses `patient_aichat` (Fixtures: 1 case, status="none").
*   **Flow:**
    1.  **Load:** Uses saved session -> Navigates to `/patient-history`.
    2.  **Open:** Clicks "Open Conversation" on the case.
    3.  **Chat:** Types specifically to AI ("Is this serious?") -> Sends.
    4.  **Verify:** Message appears in chat -> AI responds.
    5.  **Check:** "Request Physician Review" button is visible (not yet escalated).

#### 5. `doctor-review.spec.js` (Golden Path: Step 2)
*   **Goal:** Test doctor accepting and triaging a case.
*   **State:** Uses `doctor` session + `patient_pending` (Fixtures: 1 case, status="pending").
*   **Flow:**
    1.  **Load:** Uses saved session -> Navigates to Doctor Dashboard.
    2.  **Find:** Locates the pending case card.
    3.  **Accept:** Clicks "Accept Case" -> Status changes to "Patient Consultation".
    4.  **Chat:** Doctor types message ("Medical review started") -> Sends.
    5.  **Verify:** Message appears in chat stream.

#### 6. `patient-doctor-chat.spec.js` (Golden Path: Step 3)
*   **Goal:** Test patient replying to a doctor.
*   **State:** Uses `patient_accepted` (Fixtures: 1 case, status="accepted").
*   **Flow:**
    1.  **Load:** Uses saved session -> Navigates to `/patient-history`.
    2.  **Open:** Clicks the accepted case.
    3.  **View:** Sees previous doctor messages.
    4.  **Reply:** Patient types ("Thank you doctor") -> Sends.
    5.  **Verify:** Message appears in chat stream.

## 4. CI/CD Integration
- GitHub Actions runs `pytest` for backend and `npx playwright test` for E2E on every PR to `main`.
- **No API keys required** — Uses `MOCK_AI=true` for deterministic AI responses.


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

### Live AI Integration Test
To verify the **real** Google Gemini API integration (requires API key):
```bash
# Windows
$env:MOCK_AI = "false"
pytest tests/test_live_gemini.py -v -s

# Mac/Linux
export MOCK_AI=false
pytest tests/test_live_gemini.py -v -s
```
*Note: This consumes API quota.*

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

