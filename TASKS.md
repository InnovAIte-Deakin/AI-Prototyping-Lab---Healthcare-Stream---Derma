# DermaAI Project Tasks

This document contains all development tasks for the DermaAI application, organized by backend and frontend components.

---

## 🟦 Backend Tasks

### 🟦 B1 – Backend Skeleton (Dev 1)

**Paste this into Codex:**

I need you to initialize the backend for this new project.

**Context:**
- Root folders must be `/backend` and `/frontend`.
- Tech Stack: FastAPI, Python 3.10+, PostgreSQL.

**Action:** Create the following files and structure in the repository:

1. `backend/.env`:
   - Content: `DATABASE_URL=postgresql://skinscope:skinscope@localhost:5432/skinscope` and `GOOGLE_API_KEY=placeholder`.

2. `backend/requirements.txt`:
   - Add: fastapi, uvicorn, python-dotenv, sqlalchemy, alembic, psycopg2-binary, pydantic, python-multipart, httpx, google-generativeai

3. `backend/app/__init__.py`: (Empty file).

4. `backend/app/config.py`:
   - Use `os.getenv` to load DATABASE_URL and GOOGLE_API_KEY.

5. `backend/app/main.py`:
   - Initialize `app = FastAPI()`.
   - Add `CORSMiddleware` allowing origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"].
   - Add a root GET `/` endpoint returning `{"message": "DermaAI API is running"}`.

6. `backend/README.md`:
   - Add instructions on how to create a virtual environment and run `uvicorn app.main:app --reload`.

---

### 🟦 B2 – Database & Models (Dev 1)

**Paste this into Codex:**

I need to set up the Database schema and Alembic.

**Context:**
- We are using SQLAlchemy and PostgreSQL.
- `backend/app/main.py` already exists.

**Action:** Create/Update the following files:

1. `backend/docker-compose.yml`:
   - Service: `db` using image `postgres:15`.
   - Ports: `5432:5432`.
   - Environment: POSTGRES_USER=skinscope, POSTGRES_PASSWORD=skinscope, POSTGRES_DB=skinscope.

2. `backend/app/db.py`:
   - Setup `create_engine` using DATABASE_URL.
   - Setup `SessionLocal` and `Base`.
   - Create a `get_db` dependency.

3. `backend/app/models.py`:
   - Define these exact SQLAlchemy models:
   - `User`: id (int, pk), email (unique), password (str), role (str), created_at.
   - `DoctorProfile`: id (pk), user_id (FK->User.id), full_name, clinic_name, bio.
   - `PatientDoctorLink`: id (pk), patient_id (FK->User.id), doctor_id (FK->User.id), status (default="active").
   - `Image`: id (pk), patient_id (FK->User.id), doctor_id (FK->User.id), image_url, uploaded_at.
   - `AnalysisReport`: id (pk), image_id (FK->Image.id), patient_id, doctor_id, report_json (Text), created_at.

4. `backend/alembic/env.py` (Initialize Alembic first if needed):
   - You must modify `env.py` to import `from app.models import Base` and set `target_metadata = Base.metadata` so autogenerate works.

---

### 🟦 B3 – Auth System (Dev 2)

**Paste this into Codex:**

I need to implement simple Authentication (No JWT).

**Context:**
- Use the existing `User` model.
- We trust headers `X-User-Id` and `X-User-Role` for this sprint.

**Action:** Create the following files:

1. `backend/app/schemas.py`:
   - Pydantic models: `UserSignup` (email, password, role), `UserLogin` (email, password), `UserResponse` (id, email, role).

2. `backend/app/auth_helpers.py`:
   - Func `get_current_user(request: Request, db: Session)`: Reads `X-User-Id` header. If missing or user not found, raise 401.
   - Func `get_current_patient()`: Verifies role is "patient".
   - Func `get_current_doctor()`: Verifies role is "doctor".

3. `backend/app/routes/auth.py`:
   - `POST /auth/signup`: Create User. If role="doctor", also create an empty DoctorProfile row.
   - `POST /auth/login`: Check email/password (plain text). Return {user_id, email, role}.

4. Update `backend/app/main.py`:
   - Include the auth router.

---

### 🟦 B4 – Doctor Logic & Seeding (Dev 3)

**Paste this into Codex:**

I need to implement Doctor listings and a Seeding script.

**Action:** Create/Update the following:

1. `backend/app/seed_doctors.py`:
   - Create a standalone script to insert 4 test doctors (Dr. Alice, Dr. Bob, etc.) if they don't exist.
   - Must create both `User` and `DoctorProfile` entries for them.
   - Use `if __name__ == "__main__":` so I can run it manually.

2. `backend/app/routes/doctors.py`:
   - `GET /doctors`: List all doctors (join User + DoctorProfile).

3. `backend/app/routes/patient_doctor.py`:
   - `POST /patient/select-doctor`: (Patient only) Body {doctor_id}. Upsert a `PatientDoctorLink` record.
   - `GET /patient/my-doctor`: Return the currently linked doctor.

4. Update `backend/app/main.py`:
   - Include these routers.

---

### 🟦 B5 – Image Uploads (Dev 4)

**Paste this into Codex:**

I need to implement Image Uploading.

**Context:**
- Images should be stored locally in `backend/media`.

**Action:** Create/Update the following:

1. `backend/app/main.py`:
   - Mount `StaticFiles` at `/media` pointing to the `backend/media` directory.

2. `backend/app/routes/images.py`:
   - `POST /images`:
     - Dependency: `get_current_patient`.
     - **Constraint:** Check if patient has a linked doctor in `PatientDoctorLink`. If not, raise HTTP 400.
     - Save file to `backend/media/{uuid}.png`.
     - Save to `Image` table (patient_id, doctor_id, image_url).
     - Return `{image_id, image_url}`.

3. Update `backend/app/main.py`:
   - Include the images router.

---

### 🟦 B6 – Analysis Service (Dev 5)

**Paste this into Codex:**

I need to implement the AI Analysis endpoint.

**Context:**
- `GOOGLE_API_KEY` is in `.env`.

**Action:** Create/Update the following:

1. `backend/app/services/gemini_service.py`:
   - Func `analyze_image(image_url)`.
   - Call Google Gemini Vision model.
   - **Crucial:** Strip any markdown formatting (like ```json) from the response string before parsing JSON to avoid errors.

2. `backend/app/routes/analysis.py`:
   - `POST /images/{id}/analyze`:
     - Calculate analysis.
     - Save to `AnalysisReport` table.
     - Return JSON.
   - `GET /patient/reports`: List reports for current patient.
   - `GET /doctor/patients/{id}/reports`: List reports for specific patient (Doctor only).

3. Update `backend/app/main.py`:
   - Include the analysis router.

---

### 🟦 B7 – Auth Overhaul to JWT + Navigation Support

**Goal:** Replace header-based auth with JWT sessions and support logout.

**Action:**
- Implement JWT issuing/verification in `backend/app/services` (new module) and expose via `routes/auth.py`. Issue tokens on login/signup; add refresh if needed.
- Update `auth_helpers.py` dependencies to extract user from `Authorization: Bearer` instead of `X-User-*`. Keep role checks (`get_current_patient`, `get_current_doctor`).
- Add logout/invalidate path (blacklist or short-lived tokens + client-side removal). Ensure CORS/config in `backend/main.py` supports the frontend origins.
- Provide migration notes for the frontend to swap to Authorization headers.

---

### 🟦 B8 – Doctor Profile Integrity & Seeding

**Goal:** Mandate realistic doctor data and seed meaningful dev fixtures.

**Action:**
- Update `models.DoctorProfile` to require full_name, clinic_name, bio, avatar_url (or similar). Add alembic migration accordingly.
- Enhance `seed_doctors.py` to populate realistic names, avatars, bios; ensure idempotent inserts. Sync with any default assets the frontend expects.
- Adjust doctor listing endpoints (`routes/doctors.py`, any patient doctor fetch endpoints) to include the new fields; ensure null-safe serialization.

---

### 🟦 B9 – Analysis Result Formatting & Chat Context

**Goal:** Deliver structured summaries and chat-ready analysis context.

**Action:**
- Refine the AI analysis service (`services/analysis.py` or equivalent) to output condition, confidence, recommendation fields (persisted in `AnalysisReport.report_json`). Keep raw model output if useful.
- Add a chat endpoint (e.g., `POST /analysis/{image_id}/chat`) that takes user messages and replies using the stored analysis as system/context prompt (LLM provider already wired in `services/gemini_service.py`).
- Ensure response schemas are defined in `schemas.py`; keep async patterns and error handling consistent with existing routers.

---

### 🟦 B10 – Doctor-Patient Workflow Glue

**Goal:** Connect patient doctor selection, escalation, and unified chat.

**Action:**
- Add/extend endpoints to attach a doctor to an image/case during upload (`routes/images.py` and related services). Persist doctor_id on Image/AnalysisReport.
- Implement “Request Doctor Review” endpoint that marks a case for doctor attention; surface status fields in responses.
- When a doctor joins a chat, pause AI replies: include a flag in chat responses once doctor participation is active. Provide a doctor chat endpoint that returns prior patient+AI messages for context.
- Update permissions so doctors can only access linked patients; reuse existing `PatientDoctorLink` model for enforcement.

---

### 🟦 B11 – Security Hardening & Data Safety

**Goal:** Tighten storage and transport security for images and reports.

**Action:**
- Review image persistence: if long-term storage isn’t required, add lifecycle cleanup; otherwise, encrypt at rest or store in a protected bucket. Document the decision in `docs/TESTING.md` or a new security note.
- Ensure uploaded media paths served via `StaticFiles` are access-controlled if sensitive (e.g., signed URLs or auth checks).
- Add unit tests for new security behaviors in `backend/tests` (mock external services; follow pytest patterns already in place).

## 🟩 Frontend Tasks

### 🟩 F1 – Frontend Skeleton (Dev 1)

**Paste this into Codex:**

I need to initialize the Frontend.

**Context:**
- Root folder: `/frontend`.
- Stack: React + Vite + Tailwind.

**Action:** Create the following:

1. Initialize a Vite React app in `/frontend`.

2. Install dependencies: `react-router-dom`, `axios`, `clsx`, `tailwind-merge`.

3. Configure Tailwind CSS (create tailwind.config.js).

4. Create `frontend/src/pages/` with placeholder files (just an H1 in each):
   - LoginPage.jsx
   - PatientDashboard.jsx
   - PatientUpload.jsx
   - DoctorDashboard.jsx
   - DoctorPatientDetail.jsx

5. Setup `frontend/src/App.jsx` with Routes for all the pages above.

---

### 🟩 F2 – Auth Logic (Dev 2)

**Paste this into Codex:**

I need to implement Frontend Auth.

**Context:**
- Backend is at `http://localhost:8000`.
- We use LocalStorage for auth (no JWT).

**Action:** Create the following:

1. `frontend/src/context/AuthContext.jsx`:
   - Manage state `user` ({id, email, role}).
   - `login(email, password)`: POST to backend. Save `id/role` to localStorage.
   - **Crucial:** Setup an Axios interceptor to inject `X-User-Id` and `X-User-Role` headers into every request.

2. `frontend/src/components/ProtectedRoute.jsx`:
   - Check if user is logged in.
   - Check if user.role matches `allowedRoles` prop.
   - Redirect to `/login` if failed.

3. Update `App.jsx` to wrap the dashboard routes in ProtectedRoute.

---

### 🟩 F3 – Patient Features (Dev 3)

**Paste this into Codex:**

I need to build the Patient Dashboard.

**Action:** Update these files:

1. `frontend/src/pages/PatientDashboard.jsx`:
   - Fetch `GET /patient/my-doctor`.
   - If null, fetch `GET /doctors` and show a selection list.
   - If doctor exists, show buttons for "New Upload" and "View History".

2. `frontend/src/pages/PatientUpload.jsx`:
   - File input + "Analyze" button.
   - On submit:
     1. `POST /images` (upload file).
     2. `POST /images/{id}/analyze` (trigger AI).
     3. Display the JSON result on screen.

---

### 🟩 F4 – Doctor Features (Dev 4)

**Paste this into Codex:**

I need to build the Doctor Dashboard

**Action:** Update these files:

1. `frontend/src/pages/DoctorDashboard.jsx`:
   - Fetch list of patients (you may need to use `GET /doctors` endpoint logic or a new endpoint if backend provided one, to find patients linked to me).
   - Render a table of patients.

2. `frontend/src/pages/DoctorPatientDetail.jsx`:
   - Get `patientId` from URL.
   - Fetch `GET /doctor/patients/{id}/reports`.
   - Display each report:
     - Image (use `http://localhost:8000` + image_url).
     - AI Findings (Risk, Advice).

---

### 🟩 F5 – Styling & Layout (Dev 5)

**Paste this into Codex:**

I need to Apply Styling and Layout

**Action:** Create/Update:

1. `frontend/src/components/Layout.jsx`:
   - A wrapper component with a Navbar ("DermaAI", Logout button).
   - Apply this layout to all pages in `App.jsx`.

2. `frontend/src/components/Disclaimer.jsx`:
   - A Warning Banner: "AI is not a diagnosis."
   - Add this to `PatientUpload` and `DoctorPatientDetail`.

3. Styling:
   - Use Tailwind to make the tables clean.
   - Style buttons (blue-600) and inputs (gray-200).

---

### 🟩 F6 – Landing, Auth Navigation, and Logout

**Goal:** Create a dedicated landing page (DermaAI branding) and clean auth navigation.

**Action:**
- Build a new public landing screen (e.g., `frontend/src/pages/LandingPage.jsx`) with hero copy for the fictional clinic "DermaAI" and primary buttons: **Get Started** and **Login**.
- Route `/` should render the landing page; move the existing login UI to `/login`. Ensure router updates in `frontend/src/App.jsx` and keep layout via `components/Layout`.
- Remove role selection from public views; rely on backend-provided role after login/signup (AuthContext already normalizes `role`).
- Add a persistent logout control inside `components/Layout` nav that clears AuthContext and returns to `/`.
- Add "Back to Dashboard" affordances on protected pages (PatientDashboard, PatientUpload, PatientHistory, DoctorDashboard, DoctorPatientDetail) using React Router navigation helpers.
- Keep Axios auth headers injection in `context/AuthContext.jsx`; ensure logout clears headers/localStorage.

---

### 🟩 F7 – Results UI & AI Chat Surface

**Goal:** Replace raw JSON results with a readable card and add a conversational helper.

**Action:**
- In `pages/PatientUpload.jsx` (and any place results render), swap JSON dumps for a styled summary card showing Condition, Confidence, and Recommendation. Reuse existing CSS/Tailwind patterns from `App.css` and `components`.
- Add a chat panel beneath the result summary. It should call a new backend chat endpoint (to be delivered) with the last analysis report as system context. Allow free-form patient questions like “What does this mean?”; show streaming or simple appended messages.
- Keep the existing upload/analyze flow: `POST /images`, then `POST /images/{id}/analyze`; render the returned analysis and feed it into the chat context.
- Make the chat UI tolerant of loading/error states; gate behind authentication and role `patient`.

---

### 🟩 F8 – Doctor Profile Display Robustness

**Goal:** Handle missing doctor data gracefully on the patient-facing UI.

**Action:**
- Update doctor list rendering (PatientDashboard doctor selection and any doctor listings) to show placeholders for missing avatar, name, clinic, or bio rather than blank fields.
- Add default avatar asset under `frontend/src/assets` if none exists; wire into doctor cards.
- Ensure components handle null/undefined profile fields without crashing; prefer concise placeholders like “Clinic unavailable”.

---

### 🟩 F9 – Patient-to-Doctor Flow & Escalation UI

**Goal:** Let patients pick a doctor, request review, and share chat history once a doctor joins.

**Action:**
- Extend PatientDashboard/PatientUpload to prompt doctor selection before or during case creation. Persist the chosen doctor ID when uploading an image.
- After AI analysis, add a "Request Doctor Review" button that triggers the backend escalation endpoint and surfaces status (pending/accepted). Disable or mark once requested.
- For chat: when a doctor joins, pause AI responses and display that the doctor is now responding. Show the combined patient+AI chat history to the doctor when they open DoctorPatientDetail.
- Add UI indicators in doctor views for open review requests and allow the doctor to reply within the unified chat panel (reusing or extending existing chat component once available).

---

### 🟩 F10 – Anonymous/Public Flow

**Goal:** Support a lightweight, no-login flow that still encourages signup.

**Action:**
- Add an anonymous upload path reachable from the landing page (e.g., a CTA: “Try without signing up”).
- Implement a limited upload+analysis experience without auth (temporary in-memory/session state). After result + chat preview, show a call-to-action: “Sign up to save this case” linking to `/login`.
- Guard protected routes as-is; ensure anonymous flow does not pollute AuthContext or send auth headers.

---

### 🟩 F11 – E2E Coverage (Playwright)

**Goal:** Capture the critical happy path from landing to analysis.

**Action:**
- Add Playwright tests under `frontend/src/__tests__/e2e/` covering: Landing → Login → Upload → Analysis display (and chat visibility if available).
- Use the dev server at `http://localhost:5173`; seed or stub network calls as needed. Provide fixtures/mocks for backend endpoints if the real API isn’t running (consider MSW or Playwright route mocks).
- Integrate into existing test runner setup in `frontend/src/__tests__` (Vitest + Playwright). Document commands in `docs/TESTING.md` if new.

## Task Completion Checklist

### Backend
- [x] B1 – Backend Skeleton
- [x] B2 – Database & Models
- [x] B3 – Auth System
- [x] B4 – Doctor Logic & Seeding
- [x] B5 – Image Uploads
- [x] B6 – Analysis Service
- [ ] B7 – Auth Overhaul to JWT + Navigation Support
- [ ] B8 – Doctor Profile Integrity & Seeding
- [ ] B9 – Analysis Result Formatting & Chat Context
- [ ] B10 – Doctor-Patient Workflow Glue
- [ ] B11 – Security Hardening & Data Safety

### Frontend
- [x] F1 – Frontend Skeleton
- [x] F2 – Auth Logic
- [x] F3 – Patient Features
- [x] F4 – Doctor Features
- [x] F5 – Styling & Layout
- [ ] F6 – Landing, Auth Navigation, and Logout
- [ ] F7 – Results UI & AI Chat Surface
- [ ] F8 – Doctor Profile Display Robustness
- [ ] F9 – Patient-to-Doctor Flow & Escalation UI
- [ ] F10 – Anonymous/Public Flow
- [ ] F11 – E2E Coverage (Playwright)
