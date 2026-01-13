# AGENTS.md - Context Window Primer

## 1. Mission
**Goal:** Build a secure, scalable, and user-friendly Teledermatology platform (DERMA) that connects patients with doctors for AI-assisted skin analysis.

## 2. Map
Key locations for context:
- **Requirements:** [docs/SRS.md](docs/SRS.md) - Detailed software requirements and schema definitions.
- **Testing:** [docs/TESTING.md](docs/TESTING.md) - Testing strategy, commands, and coverage.
- **Tasks:** [TASKS.md](TASKS.md) - Active checklist of current work items.
- **Backend:** `backend/` - FastAPI application (Python).
- **Frontend:** `frontend/` - React application (Vite + TypeScript).

## 3. Rulebook

### Tech Stack
- **Backend:** FastAPI, SQLAlchemy (Async), Pydantic V2, PostgreSQL (Production) / SQLite (Dev).
- **Frontend:** React 18, Vite, JavaScript (JSX), TailwindCSS.
- **Testing:** Pytest (Backend), Vitest (Frontend Unit), Playwright (E2E).
- **AI:** Google Gemini API for image analysis.

### Patterns
- **Service Layer Pattern:** Business logic lives in `services/`, not in `routers/`.
- **No Logic in Routes:** Routes should only handle request parsing and response formatting.
- **Async First:** Use `async def` for all I/O bound operations (DB, API calls).

### Testing Rules
- **Always write a test for new logic.**
- **Test Coverage:** Aim for high coverage on core business logic.
- **Mock External APIs:** Use `MOCK_AI=true` for E2E tests in CI. Never call real external APIs in automated tests.

## 4. Context Links
- **Database Schema:** See `docs/SRS.md` (Data Requirements section).
- **API Design:** See `backend/main.py` and `routers/` for current implementation.

## 5. Protocol
- **Branching:** Follow the strict "One Task = One Branch" policy.
  - **Start:** Always pull the latest `main` first.
  - **Create:** Create a new branch for every task: `git checkout -b feat/task-name`.
  - **Commit:** Never commit directly to `main`.
