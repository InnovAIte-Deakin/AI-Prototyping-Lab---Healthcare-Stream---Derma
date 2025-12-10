# DERMA Task Sheet – Proposed Changes Execution

**Where this lives & how to use it:** This file resides at `docs/task_sheet_proposed_changes.md` in the repo. Open it directly from there, follow the onboarding steps below in a fresh session, and then paste the relevant task prompt for your assignment.

## How to start (copy/paste for every teammate)
1) Open a fresh agent session in the repo root (`/workspace/AI-Prototyping-Lab---Healthcare-Stream---Derma`).
2) Run the following prompt so the agent fully discovers the codebase structure, guardrails, and AGENTS instructions **before** touching any task prompt:
   - """
   You are working in the DERMA repo at /workspace/AI-Prototyping-Lab---Healthcare-Stream---Derma. First, locate and read every AGENTS.md that applies to your work. Summarize the key rules. Then briefly inventory the project structure (backend FastAPI, frontend React/Vite, docs) and note the main entrypoints (backend/main.py, frontend/src). Do **not** make changes yet—just confirm understanding of the codebase layout, conventions (service-layer, async, typing), and testing tools. Reply with a concise recap of rules and structure so I know you’re ready for the task prompt.
   """
3) After the discovery recap, paste the specific task prompt from the sections below.

Use these copy-paste-ready prompts to hand off the new feature set. Each task is split into frontend and backend ownership. Prompts assume the current DERMA codebase layout (`backend/` FastAPI + `frontend/` React/Vite) and should be run from the repo root. Follow the service-layer pattern (business logic in `backend/app/services/`, routes in `backend/app/routes/`) and preserve TypeScript/JS/pythonic typing conventions.

## Frontend Tasks

### 1) Landing, Auth Navigation, and Logout
**Goal:** Create a dedicated landing page (DermaAI branding) and clean auth navigation.

**Prompt to hand off:**
- Build a new public landing screen (e.g., `frontend/src/pages/LandingPage.jsx`) with hero copy for the fictional clinic "DermaAI" and primary buttons: **Get Started** and **Login**.
- Route `/` should render the landing page; move the existing login UI to `/login`. Ensure router updates in `frontend/src/App.jsx` and keep layout via `components/Layout`.
- Remove role selection from public views; rely on backend-provided role after login/signup (AuthContext already normalizes `role`).
- Add a persistent logout control inside `components/Layout` nav that clears AuthContext and returns to `/`.
- Add "Back to Dashboard" affordances on protected pages (PatientDashboard, PatientUpload, PatientHistory, DoctorDashboard, DoctorPatientDetail) using React Router navigation helpers.
- Keep Axios auth headers injection in `context/AuthContext.jsx`; ensure logout clears headers/localStorage.

### 2) Results UI & AI Chat Surface
**Goal:** Replace raw JSON results with a readable card and add a conversational helper.

**Prompt to hand off:**
- In `pages/PatientUpload.jsx` (and any place results render), swap JSON dumps for a styled summary card showing Condition, Confidence, and Recommendation. Reuse existing CSS/Tailwind patterns from `App.css` and `components`.
- Add a chat panel beneath the result summary. It should call a new backend chat endpoint (to be delivered) with the last analysis report as system context. Allow free-form patient questions like “What does this mean?”; show streaming or simple appended messages.
- Keep the existing upload/analyze flow: `POST /images`, then `POST /images/{id}/analyze`; render the returned analysis and feed it into the chat context.
- Make the chat UI tolerant of loading/error states; gate behind authentication and role `patient`.

### 3) Doctor Profile Display Robustness
**Goal:** Handle missing doctor data gracefully on the patient-facing UI.

**Prompt to hand off:**
- Update doctor list rendering (PatientDashboard doctor selection and any doctor listings) to show placeholders for missing avatar, name, clinic, or bio rather than blank fields.
- Add default avatar asset under `frontend/src/assets` if none exists; wire into doctor cards.
- Ensure components handle null/undefined profile fields without crashing; prefer concise placeholders like “Clinic unavailable”.

### 4) Patient-to-Doctor Flow & Escalation UI
**Goal:** Let patients pick a doctor, request review, and share chat history once a doctor joins.

**Prompt to hand off:**
- Extend PatientDashboard/PatientUpload to prompt doctor selection before or during case creation. Persist the chosen doctor ID when uploading an image.
- After AI analysis, add a "Request Doctor Review" button that triggers the backend escalation endpoint and surfaces status (pending/accepted). Disable or mark once requested.
- For chat: when a doctor joins, pause AI responses and display that the doctor is now responding. Show the combined patient+AI chat history to the doctor when they open DoctorPatientDetail.
- Add UI indicators in doctor views for open review requests and allow the doctor to reply within the unified chat panel (reusing or extending existing chat component once available).

### 5) Anonymous/Public Flow
**Goal:** Support a lightweight, no-login flow that still encourages signup.

**Prompt to hand off:**
- Add an anonymous upload path reachable from the landing page (e.g., a CTA: “Try without signing up”).
- Implement a limited upload+analysis experience without auth (temporary in-memory/session state). After result + chat preview, show a call-to-action: “Sign up to save this case” linking to `/login`.
- Guard protected routes as-is; ensure anonymous flow does not pollute AuthContext or send auth headers.

### 6) E2E Coverage (Playwright)
**Goal:** Capture the critical happy path from landing to analysis.

**Prompt to hand off:**
- Add Playwright tests under `frontend/src/__tests__/e2e/` covering: Landing → Login → Upload → Analysis display (and chat visibility if available).
- Use the dev server at `http://localhost:5173`; seed or stub network calls as needed. Provide fixtures/mocks for backend endpoints if the real API isn’t running (consider MSW or Playwright route mocks).
- Integrate into existing test runner setup in `frontend/src/__tests__` (Vitest + Playwright). Document commands in `docs/TESTING.md` if new.

## Backend Tasks

### 1) Auth Overhaul to JWT + Navigation Support
**Goal:** Replace header-based auth with JWT sessions and support logout.

**Prompt to hand off:**
- Implement JWT issuing/verification in `backend/app/services` (new module) and expose via `routes/auth.py`. Issue tokens on login/signup; add refresh if needed.
- Update `auth_helpers.py` dependencies to extract user from `Authorization: Bearer` instead of `X-User-*`. Keep role checks (`get_current_patient`, `get_current_doctor`).
- Add logout/invalidate path (blacklist or short-lived tokens + client-side removal). Ensure CORS/config in `backend/main.py` supports the frontend origins.
- Provide migration notes for the frontend to swap to Authorization headers.

### 2) DoctorProfile Integrity & Seeding
**Goal:** Mandate realistic doctor data and seed meaningful dev fixtures.

**Prompt to hand off:**
- Update `models.DoctorProfile` to require full_name, clinic_name, bio, avatar_url (or similar). Add alembic migration accordingly.
- Enhance `seed_doctors.py` to populate realistic names, avatars, bios; ensure idempotent inserts. Sync with any default assets the frontend expects.
- Adjust doctor listing endpoints (`routes/doctors.py`, any patient doctor fetch endpoints) to include the new fields; ensure null-safe serialization.

### 3) Analysis Result Formatting & Chat Context
**Goal:** Deliver structured summaries and chat-ready analysis context.

**Prompt to hand off:**
- Refine the AI analysis service (`services/analysis.py` or equivalent) to output condition, confidence, recommendation fields (persisted in `AnalysisReport.report_json`). Keep raw model output if useful.
- Add a chat endpoint (e.g., `POST /analysis/{image_id}/chat`) that takes user messages and replies using the stored analysis as system/context prompt (LLM provider already wired in `services/gemini_service.py`).
- Ensure response schemas are defined in `schemas.py`; keep async patterns and error handling consistent with existing routers.

### 4) Doctor-Patient Workflow Glue
**Goal:** Connect patient doctor selection, escalation, and unified chat.

**Prompt to hand off:**
- Add/extend endpoints to attach a doctor to an image/case during upload (`routes/images.py` and related services). Persist doctor_id on Image/AnalysisReport.
- Implement “Request Doctor Review” endpoint that marks a case for doctor attention; surface status fields in responses.
- When a doctor joins a chat, pause AI replies: include a flag in chat responses once doctor participation is active. Provide a doctor chat endpoint that returns prior patient+AI messages for context.
- Update permissions so doctors can only access linked patients; reuse existing `PatientDoctorLink` model for enforcement.

### 5) Security Hardening & Data Safety
**Goal:** Tighten storage and transport security for images and reports.

**Prompt to hand off:**
- Review image persistence: if long-term storage isn’t required, add lifecycle cleanup; otherwise, encrypt at rest or store in a protected bucket. Document the decision in `docs/TESTING.md` or a new security note.
- Ensure uploaded media paths served via `StaticFiles` are access-controlled if sensitive (e.g., signed URLs or auth checks).
- Add unit tests for new security behaviors in `backend/tests` (mock external services; follow pytest patterns already in place).

