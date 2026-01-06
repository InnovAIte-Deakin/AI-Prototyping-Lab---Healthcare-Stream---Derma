# Sprint 2 Plug-and-Play Prompts (XML-Ready)

These prompts are designed to be handed directly to coding agents without additional repo spelunking. Each XML block is self-contained, cites relevant files/endpoints, and reminds the agent to follow the rulebook in `AGENTS.md` (service-layer pattern, async I/O, typed Python/TypeScript, and tests for new logic). Replace placeholders (e.g., credentials) only if you intentionally change them.

## How to use
- Copy the XML for the task owner, paste into the coding agent, and emphasize that the agent should **only** follow the enclosed instructions.
- All paths are relative to the repo root. Frontend runs under `frontend/`, backend under `backend/`.
- Keep PRs small and focused: one task per branch/PR.

## Task Prompts

### 1) Frontend Doctor Profiles (Hoang)
```xml
<task id="frontend-doctor-profiles" owner="Hoang">
  <mission>Enrich doctor profiles shown to patients with fuller data and resilient rendering.</mission>
  <context>
    <frontend>
      <files>
        <file>frontend/src/pages/PatientDashboard.jsx</file>
        <file>frontend/src/components/Layout.jsx (uiTokens for spacing/colors)</file>
        <file>frontend/src/App.css and frontend/src/index.css</file>
      </files>
      <flow>PatientDashboard renders doctor cards from availableDoctors and posts selection via apiClient to POST /patient/select-doctor.</flow>
    </frontend>
    <backend>
      <files>
        <file>backend/app/routes/doctors.py (GET /doctors)</file>
        <file>backend/app/services/doctor_service.py (doctor assembly)</file>
        <file>backend/app/models.py (Doctor fields: id, email, full_name, clinic_name, bio, avatar_url)</file>
      </files>
    </backend>
  </context>
  <instructions>
    <step>Expand the doctor card to show avatar, clinic name, bio/experience, years practicing (fallback to "Experience pending"), and specialties (comma-joined if present). Keep styling consistent with uiTokens and existing responsive layout.</step>
    <step>Add graceful fallbacks for optional fields so undefined data never breaks rendering.</step>
    <step>Show a small badge for doctors accepting new patients (default true unless backend supplies otherwise) and expose email contact.</step>
    <step>Preserve existing selection flow and loading/disabled states that rely on selectingDoctorId.</step>
    <step>Create or update a React Testing Library test (e.g., frontend/src/__tests__/PatientDashboard.test.jsx) that verifies avatar, clinic name, and bio render for mocked doctors.</step>
    <step>Do not change routing; keep /patient-dashboard entry intact. Respect strictness in the existing JS/TS configuration.</step>
  </instructions>
  <constraints>
    <item>Follow AGENTS.md rulebook; no logic in routes.</item>
    <item>Keep any new props typed if you touch TS files; maintain lint friendliness.</item>
  </constraints>
</task>
```

### 2) Security Hardening (Ahmed)
```xml
<task id="security-hardening" owner="Ahmed">
  <mission>Strengthen protection of clinical data in the FastAPI backend.</mission>
  <context>
    <backend>
      <files>
        <file>backend/app/config.py (MEDIA_ROOT, settings)</file>
        <file>backend/app/main.py (app.mount("/media", ...))</file>
        <file>backend/app/routes/cases.py; backend/app/routes/analysis.py (case/report access)</file>
        <file>backend/app/models.py (AnalysisReport, ChatMessage)</file>
        <file>backend/app/services/auth.py and backend/app/auth_helpers.py (JWT + dependencies)</file>
        <file>backend/tests/ (pytest suite)</file>
      </files>
    </backend>
  </context>
  <instructions>
    <step>Restrict media serving: add signed URL or token-check middleware so /media/** files require authenticated patients or their linked doctors. Document the approach in docs/SECURITY.md.</step>
    <step>Add lifecycle cleanup or encryption-at-rest for uploaded images. If cleaning, create a scheduled job hook (placeholder async task) that removes media and DB rows older than N days; make retention configurable via env var.</step>
    <step>Enforce role-based access on analysis/chat endpoints to prevent cross-patient access.</step>
    <step>Add regression tests in backend/tests/ for unauthorized media fetch and report access.</step>
    <step>Update threat-model notes in docs/TESTING.md if new risks/mitigations are added.</step>
  </instructions>
  <constraints>
    <item>Async first; do not wrap imports in try/except.</item>
    <item>Use service-layer pattern for business logic.</item>
    <item>Mock external services in tests.</item>
  </constraints>
</task>
```

### 3) Playwright End-to-End Tests (Ash)
```xml
<task id="playwright-e2e" owner="Ash">
  <mission>Add browser-level coverage for critical patient and doctor flows.</mission>
  <context>
    <frontend>
      <files>
        <file>frontend/src/App.jsx (routes)</file>
        <file>frontend/src/context/AuthContext.jsx (JWT auth)</file>
        <file>frontend/src/pages/PatientUpload.jsx, PatientDashboard.jsx, PatientCasePage.jsx</file>
        <file>frontend/src/pages/DoctorDashboard.jsx, DoctorCasePage.jsx</file>
      </files>
      <existingTests>Vitest/RTL live under frontend/src/__tests__.</existingTests>
    </frontend>
    <data>
      <seed>Doctors seeded via backend/app/seed_doctors.py.</seed>
      <creds>Test creds: alice@derma.com / password123 (adjust if you change seeds).</creds>
    </data>
  </context>
  <instructions>
    <step>Initialize Playwright in frontend/ (npm create playwright@latest with TypeScript). Configure baseURL to http://localhost:5173.</step>
    <step>Write specs for: (a) patient login → upload dummy image → trigger analyze → see structured result card; (b) doctor login → view pending cases at /doctor-dashboard → open a case → post a note → mark case complete; (c) anonymous try flow via /try-anonymous → upload image → receive AI response → sign up → ensure session links to history (public_session_id linkage).</step>
    <step>Add CI-friendly scripts to frontend/package.json (test:e2e) with headless mode; document run instructions in docs/TESTING.md.</step>
    <step>Use data-testid hooks only where necessary; prefer stable text selectors.</step>
  </instructions>
  <constraints>
    <item>Keep existing routing/auth intact.</item>
    <item>Do not skip cleanup—ensure fixtures reset storage/state between tests.</item>
  </constraints>
</task>
```

### 4) UI Improvements (Hani)
```xml
<task id="ui-improvements" owner="Hani">
  <mission>Polish UI per scope doc while respecting existing layout system.</mission>
  <context>
    <frontend>
      <files>
        <file>frontend/src/components/Layout.jsx (nav, shell, uiTokens)</file>
        <file>frontend/src/App.css and frontend/src/index.css (global styles)</file>
        <file>frontend/src/pages/LandingPage.jsx, Login pages, PatientDashboard/Upload/History, DoctorDashboard/Case views</file>
      </files>
    </frontend>
  </context>
  <instructions>
    <step>Apply scope from Hani to enhance spacing, typography, and card states using existing Tailwind utility classes.</step>
    <step>Keep Layout navigation structure intact; refine CTA hierarchy and add hover/active states to primary/secondary buttons via uiTokens.</step>
    <step>Improve accessibility: add aria labels to upload inputs, ensure alert contrast, and keep focus rings visible.</step>
    <step>Update relevant RTL tests or snapshots under frontend/src/__tests__ if DOM changes occur.</step>
    <step>Avoid altering routing or business logic; focus strictly on presentation.</step>
  </instructions>
  <constraints>
    <item>Respect responsive behavior already present.</item>
    <item>Keep styles co-located with existing CSS/Tailwind patterns.</item>
  </constraints>
</task>
```

### 5) Usage Guides for Patients and Doctors
```xml
<task id="user-guides" owner="Docs">
  <mission>Deliver clear guides describing how patients and doctors use the app.</mission>
  <context>
    <flows>
      <patient>Select doctor (PatientDashboard) → upload &amp; analyze (PatientUpload) → view history/cases (PatientHistory, PatientCasePage).</patient>
      <doctor>DoctorDashboard and DoctorCasePage for triage and chat.</doctor>
      <anonymous>Anonymous try links through backend/app/routes/public_try.py and signup linking in backend/app/routes/auth.py via public_session_id.</anonymous>
    </flows>
  </context>
  <instructions>
    <step>Add docs/USER_GUIDE.md with sections: Patient Journey and Doctor Journey. Include step-by-step instructions, placeholders for screenshots, and referenced pages/endpoints.</step>
    <step>Reference seeded doctor accounts and how patients pick doctors; include the AI disclaimer from README.</step>
    <step>Align directions with current navigation paths (Landing → Login → Dashboard, etc.).</step>
    <step>Link the new guide from README.md under Documentation.</step>
  </instructions>
  <constraints>
    <item>Keep tone instructional, not marketing.</item>
    <item>Make paths and buttons explicit so the guide is actionable without reading code.</item>
  </constraints>
</task>
```

### 6) Fictional Clinic Information
```xml
<task id="clinic-branding" owner="Content">
  <mission>Embed cohesive fictional clinic branding across app and seed data.</mission>
  <context>
    <backend>
      <file>backend/app/seed_doctors.py (doctor seed data)</file>
    </backend>
    <frontend>
      <file>frontend/src/pages/LandingPage.jsx (hero copy)</file>
      <file>frontend/src/components/Layout.jsx (nav title)</file>
    </frontend>
    <branding>Current branding: DermaAI; replace with consistent fictional clinic name (e.g., "Aurora Skin Clinic") while preserving product name.</branding>
  </context>
  <instructions>
    <step>Update seed_doctors.py to use the chosen clinic name, realistic bios, and avatar URLs; keep seeding idempotent.</step>
    <step>Refresh LandingPage hero copy and nav title to reference the fictional clinic while keeping DermaAI product naming.</step>
    <step>Add a clinic overview section to README.md or a new docs/CLINIC.md describing services and safety disclaimers.</step>
    <step>Verify doctor listing responses include new fields so PatientDashboard renders updated info.</step>
  </instructions>
  <constraints>
    <item>Do not break existing endpoints or selection flow.</item>
    <item>Keep new assets lightweight and properly licensed.</item>
  </constraints>
</task>
```

### 7) Allow Patients to Change Doctors Safely
```xml
<task id="safe-doctor-switch" owner="Backend+Frontend">
  <mission>Let patients switch doctors without breaking existing cases.</mission>
  <context>
    <backend>
      <files>
        <file>backend/app/routes/patient_doctor.py (current selection endpoints)</file>
        <file>backend/app/routes/cases.py and backend/app/services/chat_service.py (case workflow and websocket manager)</file>
        <file>backend/app/models.py (AnalysisReport with doctor_id)</file>
      </files>
    </backend>
    <frontend>
      <file>frontend/src/pages/PatientDashboard.jsx (selection UI)</file>
      <file>frontend/src/pages/PatientHistory.jsx and frontend/src/pages/PatientCasePage.jsx (history rendering)</file>
    </frontend>
  </context>
  <instructions>
    <step>Add backend constraints so changing doctor updates the active PatientDoctorLink while preserving historical reports tied to previous doctors.</step>
    <step>Expose an endpoint like POST /patient/change-doctor that records a change log and prevents switching while an active case is pending/accepted.</step>
    <step>Frontend: add a "Change doctor" CTA on PatientDashboard when linked, using a modal to list available doctors and call the new endpoint; show validation if an active case blocks switching.</step>
    <step>Update cached doctor references when rendering patient history so past cases still show original doctor info.</step>
    <step>Add tests: backend unit tests for switching with/without active cases; frontend RTL test for UI states.</step>
  </instructions>
  <constraints>
    <item>Keep websocket/chat flows intact for active cases.</item>
    <item>Guard against race conditions in concurrent switch requests.</item>
  </constraints>
</task>
```

### 8) Post-Consultation Doctor Rating
```xml
<task id="doctor-rating" owner="Backend+Frontend">
  <mission>Allow patients to rate doctors after cases are reviewed.</mission>
  <context>
    <backend>
      <files>
        <file>backend/app/models.py (AnalysisReport.review_status)</file>
        <file>backend/app/routes/cases.py (complete_case)</file>
      </files>
    </backend>
    <frontend>
      <file>frontend/src/pages/PatientCasePage.jsx (chat and status rendering)</file>
      <file>frontend/src/pages/DoctorDashboard.jsx (case list)</file>
    </frontend>
  </context>
  <instructions>
    <step>Extend AnalysisReport with optional patient_rating (1-5) and patient_feedback text; include migration.</step>
    <step>Add endpoint POST /cases/{report_id}/rating secured to the owning patient; allow rating only when review_status == "reviewed" and prevent multiple submissions.</step>
    <step>Frontend: when a case is reviewed and not yet rated, render a rating form (stars + textarea) on PatientCasePage; submit via apiClient and show confirmation.</step>
    <step>Ensure ratings appear in doctor dashboards/Medical Admin views (if available) as a performance signal.</step>
    <step>Add tests: backend pytest for permissions/validation; frontend RTL for form visibility and submission.</step>
  </instructions>
  <constraints>
    <item>Preserve existing case completion flow.</item>
    <item>Persist rating data atomically with validation.</item>
  </constraints>
</task>
```

### 9) Medical Admin Role & Seeded Account
```xml
<task id="medical-admin" owner="Fullstack">
  <mission>Introduce clinic-wide admin oversight with a seeded account.</mission>
  <context>
    <backend>
      <files>
        <file>backend/app/auth_helpers.py and backend/app/services/auth.py (roles and JWT issuance)</file>
        <file>backend/app/routes/auth.py (login/signup)</file>
        <file>backend/app/models.py and backend/app/schemas.py (user validation)</file>
      </files>
    </backend>
    <frontend>
      <file>frontend/src/context/AuthContext.jsx (role handling)</file>
      <file>frontend/src/App.jsx (routing) and frontend/src/components/PrivateRoute.jsx (guards)</file>
    </frontend>
    <data>Doctor performance implied via AnalysisReport and PatientDoctorLink.</data>
  </context>
  <instructions>
    <step>Add admin role to User validation and authorization helpers. Seed an admin user (env-driven credentials) in backend/app/seed_doctors.py or a new seeder.</step>
    <step>Create admin API endpoints (e.g., /admin/overview) to surface metrics: total patients, total doctors, pending cases, average rating (if implemented), and recent case list via service-layer queries.</step>
    <step>Frontend: add an AdminDashboard route/page showing these metrics with tables/cards, protected by role admin using existing PrivateRoute logic.</step>
    <step>Tests: backend unit tests for role protection and metrics correctness; frontend RTL smoke test ensuring admin page renders for admin and rejects others.</step>
    <step>Update README.md or docs/USER_GUIDE.md with admin credentials and capabilities.</step>
  </instructions>
  <constraints>
    <item>Ensure seeded admin credentials are configurable and not hard-coded in code paths.</item>
    <item>Do not regress existing patient/doctor roles.</item>
  </constraints>
</task>
```

### 10) Observability & Operational Readiness
```xml
<task id="observability" owner="Ops+Fullstack">
  <mission>Add structured logging, health signals, and a handoff runbook.</mission>
  <context>
    <backend>
      <files>
        <file>backend/app/main.py (middleware, route registration)</file>
        <file>backend/app/config.py (env toggles)</file>
        <file>backend/app/services/ai_service.py or equivalent Gemini wrapper</file>
      </files>
    </backend>
    <frontend>
      <file>frontend/src/main.jsx (global providers)</file>
      <file>frontend/src/pages/PatientUpload.jsx and frontend/src/pages/DoctorDashboard.jsx (surface errors)</file>
    </frontend>
    <docs>
      <file>docs/TESTING.md</file>
      <file>README.md</file>
    </docs>
  </context>
  <instructions>
    <step>Add a request-id middleware (e.g., X-Request-ID) in FastAPI that propagates to structured JSON logs so backend logs can be correlated per request.</step>
    <step>Centralize logging config (log level via env) and ensure AI/Gemini failures and media errors emit actionable log messages; avoid printing secrets.</step>
    <step>Add a lightweight /health (and optional /ready) endpoint that checks DB connectivity and env configuration; document its usage for monitors.</step>
    <step>Frontend: introduce a top-level error boundary/toast path that surfaces backend errors in PatientUpload and DoctorDashboard without breaking navigation.</step>
    <step>Create docs/OPERATIONS.md with: how to start/stop services, rotate secrets, read logs, run migrations/seeds, and how to capture diagnostics when errors occur.</step>
    <step>Update README.md and docs/TESTING.md to point to the new health checks/logging guidance.</step>
  </instructions>
  <constraints>
    <item>Keep middleware async and lightweight; do not wrap imports in try/except.</item>
    <item>Health endpoints must not leak secrets or heavy data; return minimal status JSON.</item>
  </constraints>
</task>
```

### 11) Data Lifecycle & Patient Deletion
```xml
<task id="data-lifecycle" owner="Security+Backend">
  <mission>Give patients control over their data and define retention.</mission>
  <context>
    <backend>
      <files>
        <file>backend/app/routes/auth.py (user creation)</file>
        <file>backend/app/routes/cases.py and backend/app/routes/images.py (case/image lifecycle)</file>
        <file>backend/app/models.py (User, Image, AnalysisReport, ChatMessage, PatientDoctorLink)</file>
        <file>backend/app/config.py (new retention env vars)</file>
      </files>
      <media>Uploaded assets live under backend/app/media/ (mounted at /media).</media>
    </backend>
    <docs>
      <file>docs/SECURITY.md</file>
    </docs>
  </context>
  <instructions>
    <step>Add a patient-authenticated endpoint (e.g., DELETE /patients/me) that queues deletion/anonymization: revoke tokens, mark PatientDoctorLink inactive, delete media files, and scrub AnalysisReport/ChatMessage PII while preserving aggregate stats.</step>
    <step>Implement configurable retention for media/chat/analysis rows (env-driven days); a scheduled cleanup job can be placeholder but callable to enforce deletion.</step>
    <step>Ensure doctor-facing history preserves case references as anonymized after deletion (no emails/names).</step>
    <step>Back tests: pytest for deletion permissions, retention window enforcement, and file cleanup; mock filesystem access.</step>
    <step>Document retention policy and deletion steps in docs/SECURITY.md and reference any env vars.</step>
  </instructions>
  <constraints>
    <item>Do not break existing patient/doctor role checks.</item>
    <item>File deletion must be safe/idempotent; guard against path traversal.</item>
  </constraints>
</task>
```

### 12) Resilience for AI + Upload Pipeline
```xml
<task id="resilience" owner="Reliability">
  <mission>Gracefully handle AI outages and invalid uploads end-to-end.</mission>
  <context>
    <backend>
      <files>
        <file>backend/app/services/ai_service.py or equivalent Gemini client</file>
        <file>backend/app/routes/analysis.py (analysis endpoint)</file>
        <file>backend/app/routes/images.py (upload validation)</file>
      </files>
    </backend>
    <frontend>
      <file>frontend/src/pages/PatientUpload.jsx (upload + analyze flow)</file>
      <file>frontend/src/utils/apiClient.js</file>
    </frontend>
    <docs>
      <file>docs/TESTING.md</file>
    </docs>
  </context>
  <instructions>
    <step>Add strict backend validation for file type/size on /images upload and surface clear 4xx errors (e.g., reject non-image or >N MB).</step>
    <step>Implement AI fallback: if Gemini API key is missing or the request times out, return a safe degraded response that the UI can display ("analysis unavailable") without throwing.</step>
    <step>Frontend: handle validation and degraded analysis states with user-friendly messaging and retry CTA; avoid crashing the page.</step>
    <step>Add tests: backend unit tests for validation and fallback; frontend RTL for error banners and retry.</step>
    <step>Document how to toggle fallback and validation limits in docs/TESTING.md.</step>
  </instructions>
  <constraints>
    <item>Do not alter existing successful analysis response shape; add fallback flags instead.</item>
    <item>Keep latency impact minimal; timeouts should be configurable.</item>
  </constraints>
</task>
```

---
These XML prompts are intentionally exhaustive so coding agents can execute without reading the codebase first. Hand the relevant block to each student to minimize ambiguity and prevent accidental regressions.
