# Testing Strategy for DERMA (SkinScope)

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

## 3. End-to-End (E2E) Testing (Future Scope)
**Goal:** Verify the entire user flow from browser to backend to database.
**Tools:** Playwright or Cypress.
**Scope:**
- Patient Login -> Upload Image -> View Result.
- Doctor Login -> View Dashboard -> Review Case.

## 4. CI/CD Integration
- Configure GitHub Actions to run `pytest` and `npm test` on every Pull Request to `main`.
