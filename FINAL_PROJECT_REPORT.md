# Final Project Report & Handover - DermaAI (Healthcare Stream)

## 1. Project Overview
**DermaAI** (branded as **Aurora Skin Clinic**) is a telemedicine platform designed to bridge the gap between AI-driven preliminary analysis and professional dermatological care. The application serves as a triage and consultation tool where patients can upload skin images for instant analysis and seamlessly connect with medical professionals for diagnosis.

### Core Value Proposition
*   **For Patients**: Instant, 24/7 preliminary assessment of skin conditions using Generative AI (Gemini Vision), reducing anxiety and waiting times.
*   **For Doctors**: A streamlined dashboard to review high-priority cases, access patient history, and communicate efficiently.
*   **For Clinics**: A scalable digital front-door that handles intake, triage, and patient engagement automatically.

---

## 2. System Architecture
The solution follows a modern, containerized client-server architecture.

### Technology Stack
| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend** | **React 19 (Vite) + Tailwind CSS** | Fast, responsive, component-based UI with rapid build times. |
| **Backend** | **FastAPI (Python)** | High-performance async API with native Pydantic validation and easy AI library integration. |
| **Database** | **PostgreSQL (Prod) / SQLite (Dev)** | Relational integrity for user data and case history. SQLAlchemy ORM for abstraction. |
| **AI Engine** | **Google Gemini Vision Pro** | Multimodal analysis capabilities for dermatology imaging. |
| **Testing** | **Playwright + Vitest + Pytest** | Full-stack coverage from unit logic to end-to-end user flows. |
| **Infrastructure** | **Docker + GitHub Actions** | Consistent environments and automated CI validation. |

---

## 3. Development Methodology
The team adopted an agile, rigorous software engineering process to ensure code quality and stability.

### Workflow: "One Task = One Branch"
We adhered to a strict branching strategy to isolate features:
1.  **Branching**: Every Jira/Task ID (e.g., `S2-6`) corresponds to a dedicated feature branch (e.g., `feat/S2-6-medical-admin`).
2.  **Pull Requests**: No direct commits to `main`. All changes merge via Pull Requests (PRs).
3.  **Automated Quality Gates**:
    *   **CI Pipeline**: A `playwright.yml` workflow triggers on every PR.
    *   **Checks**: The pipeline runs Backend Unit Tests (Pytest), Frontend Unit Tests (Vitest), and End-to-End Tests (Playwright).
    *   **Merging**: Merging is blocked unless all tests pass.

### Documentation-Driven Development
*   **SRS First**: Features began with updating the `docs/SRS.md`.
*   **Task Lists**: Implementation plans were tracked in a living `TASKS.md` document.
*   **Verification**: "Walkthrough" artifacts were generated to prove feature completion before merging.

---

## 4. Key Feature Delivery
The project is split into three distinct role-based experiences:

### 👤 Patient Experience
1.  **Guided Intake**: Secure sign-up/login flow with email validation (B7).
2.  **AI Analysis**: Upload skin images for instant analysis (Condition, Confidence, Recommendation) (B6/F7).
3.  **Unified Chat**: Discuss results with the AI immediately. If a doctor review is requested, the chat seamlessly invites the doctor, preserving context (B10).
4.  **Doctor Selection**: Browse doctor profiles (with bios/avatars) and request specifics reviews (S2-4).

### 👨‍⚕️ Doctor Experience
1.  **Triage Dashboard**: View a list of assigned patients with status indicators (Pending, Reviewed) (F4).
2.  **Case Review**: High-resolution image viewer with side-by-side AI findings.
3.  **Patient History**: Access past cases and previous AI reports for the same patient.
4.  **Intervention**: Join the chat to take over from the AI, providing medical advice.

### 🛡️ Medical Admin Experience (New in Sprint 2)
1.  **System Oversight**: Dashboard showing total patient/doctor counts and system activity (S2-6).
2.  **User Management**: Monitor doctor performance and patient engagement (implied via metrics).

---

## 5. Implementation Status
The project successfully completed **100%** of the scheduled tasks for Sprint 1 and Sprint 2.

| Task ID | Description | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Basic (B1-F5)** | Core Skeleton & Features | ✅ Complete | foundation layout, auth, db, models. |
| **F6/B7** | Auth Overhaul (JWT) | ✅ Complete | Secure session management. |
| **F7/B9** | AI Chat Interface | ✅ Complete | Context-aware chat implemented. |
| **S2-3** | Clinic Branding | ✅ Complete | Rebranded as "Aurora Skin Clinic". |
| **S2-4** | Safe Doctor Switch | ✅ Complete | Maintains case integrity during switch. |
| **S2-6** | Medical Admin Role | ✅ Complete | Dashboard & seeded admin account. |
| **S2-8** | Data Lifecycle | ✅ Complete | User deletion & retention policies. |

**Current Health:**
*   **Build**: Passing (CI/CD pipeline active).
*   **Tests**: All unit and E2E tests passing as of last run.
*   **Security**: RBAC enforced on all endpoints; inputs validated.

---

## 6. Resources & Documentation
All project resources are contained within the repository.

### Key Documentation
*   **[docs/USER_GUIDE.md](./docs/USER_GUIDE.md)**: **Start Here**. Detailed manual for Patients and Doctors tailored for end-users.
*   **[docs/OPERATIONS.md](./docs/OPERATIONS.md)**: System administrator's guide. Covers deployment, secrets, and database management.
*   **[docs/TESTING.md](./docs/TESTING.md)**: Detailed guide on the testing strategy, including command-line references for running the test suites.
*   **[docs/SECURITY.md](./docs/SECURITY.md)**: Data retention policies, PII handling, and security architecture.
*   **[TASKS.md](./TASKS.md)**: The original development checklist, now fully completed.

### Source Code
*   **Backend**: `/backend` (FastAPI app, Database migrations).
*   **Frontend**: `/frontend` (React app, E2E tests).
*   **Scripts**: Root directory contains `run_tests.ps1` for automated local verification.

---

## 7. Operations & Handoff Guide

### Quick Start (Local)
1.  **Backend**:
    ```bash
    cd backend
    python -m venv venv
    ./venv/Scripts/Activate
    pip install -r requirements.txt
    docker-compose up -d  # Start DB
    python -m app.seed_doctors && python -m app.seed_admin
    uvicorn app.main:app --reload
    ```
2.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

### Access Credentials (Dev)
*   **Admin**: `admin@derma.com` / `adminpass123`
*   **Doctor**: `alice@derma.com` / `password123`
*   **Patient**: Self-register via `/login`.

### Environment Variables
Located in `backend/.env`:
*   `DATABASE_URL`: Connection string for Postgres.
*   `GOOGLE_API_KEY`: Required for AI analysis.
*   `SECRET_KEY`: For JWT generation.

---

## 8. Recommendations & Roadmap (Sprint 3+)
Based on the current MVPs capabilites, we recommend the following features to align with Australian Digital Health standards and clinical best practices.

### Enhanced Clinical Intake & Medicare Integration
*   **Comprehensive Registration**: Expand the `User` model to capture critical demographics (DOB, Gender), strict Australian mobile number validation (+61), and Residential Address.
*   **Medicare Verification**: Integrate with **Medicare Online API** (via PRODA) to validate patient entitlements in real-time during sign-up. This is a critical prerequisite for bulk-billing or lodging MBS claims.

### Security Compliance (Australian Context)
*   **Privacy Audit**: Conduct a formal **Privacy Impact Assessment (PIA)** to ensure compliance with the *Privacy Act 1988* (Cth) and *Australian Privacy Principles (APPs)*.
*   **Data Sovereignty**: Ensure the production PostgreSQL database and object storage are hosted strictly within Australian Data Centres (e.g., AWS Sydney Region) to satisfy health data residency requirements.
*   **My Health Record**: Explore integration to upload "Event Summaries" of dermatologist consultations to the patient's My Health Record.

### Telehealth & Mobile Experience
*   **Native Mobile App**: We strongly recommend porting the React frontend to **React Native**. This enables better access to device hardware (high-res camera, flashlight) for standardized skin photography.
*   **Integrated Video Consultations**: Implement **WebRTC** (via Twilio Video or Daily.co) to allow doctors to initiate secure video calls directly from the Triage Dashboard, replacing external tools like Zoom.

### Enhanced Administrative Oversight
*   **Doctor Lifecycle Management**: Provide Admins with a UI to Invite/Create new doctor accounts (sending signup links) and **Suspend/Close** accounts for staff who leave the clinic.
*   **Feedback & QA Loop**: Give Admins access to read specific patient feedback (`patient_feedback` derived from S2-5) to monitor quality of care.
*   **Doctor Performance Metrics**: Expand the Admin Dashboard to track "Time to Review" (TTR) and "Patient Satisfaction Scores".
*   **Audit Logging**: Create an immutable audit log of all record accesses (who viewed which patient and when) to meet clinical governance standards.

### Reputation & Transparency
*   **Public Ratings**: Aggregate the `patient_rating` data (S2-5) and display an **Average Satisfaction Score** (e.g., "4.8 ★") on the doctor selection cards, helping patients make informed choices.

---

## 9. Contributors
This project was delivered by the **Healthcare Stream Team**.

*   **Software Engineers (Backend/Frontend)**: Built the core architecture and features.
*   **QA Engineers**: Developed the Playwright E2E suite and `run_tests.ps1` automation.
*   **Product Owner**: Defined the "Aurora" brand and user journey requirements.
