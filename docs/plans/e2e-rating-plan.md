# Implementation Plan - E2E Test for Doctor Rating

## Goal
Create a robust End-to-End (E2E) test to verify the "Post-Consultation Doctor Rating" feature (Task S2-5). This ensures patients can successfully rate a doctor after a case has been reviewed.

## Proposed Changes

### 1. Database Fixtures (`backend/app/seed_e2e_fixtures.py`)
**Need:** A patient case in the `reviewed` state to immediately test the rating UI without manual walkthrough of the doctor flow.
**Action:**
- Add a new fixture entry: `{"patient_email": "e2e_patient_reviewed@test.com", "case_state": "reviewed"}`.
- Ensure `_create_case_in_state` handles the `reviewed` status correctly (setting `doctor_active=False`, `review_status="reviewed"`).
- **Verification:** Run `python backend/app/seed_e2e_fixtures.py` and inspect the DB (via script) to confirm the user and case exist.

### 2. E2E Test File (`frontend/e2e/patient-rating.spec.js`)
**Need:** A new Playwright specification file.
**Flow:**
1.  **Login**: Authenticate as `e2e_patient_reviewed@test.com` (using `auth.setup.js` pattern or direct login if simpler for this isolated test, but preferably using `test.use({ storageState: ... })` if we can pre-seed that auth state, otherwise perform login in `beforeEach`). *Correction*: The existing pattern uses pre-generated auth states. Since this is a NEW user, we might need to add a step to generate their auth state OR just log them in via UI in the test. Logging in via UI is safer for a new fixture.
2.  **Navigate**: Go to `/patient-dashboard` -> Click "View History" -> Click the specific case.
3.  **Verify UI**:
    - Check for "Review Complete" badge.
    - Assert "Rate Your Physician" section is visible.
    - Check for 5 star buttons and textarea.
    - Check "Submit Rating" button is enabled/visible.
4.  **Interaction**:
    - Click the 5th star.
    - Fill feedback: "Excellent service!"
    - Click "Submit Rating".
5.  **Assertion**:
    - Verify success message: "Thanks for your feedback!".
    - Verify form changes to read-only display of the submitted rating.

### 3. Selector Verification
**File:** `frontend/src/pages/PatientCasePage.jsx`
- **Heading**: `Case #` or `Your Case`? -> Code says `<h1 ...>Your Case</h1>`.
- **Status Badge**: "Review Complete" (Green). -> Code: `✅ Review Complete`.
- **Rating Section Header**: `Rate Your Physician`. -> Code verified.
- **Stars**: Button `aria-label="5 star"`. -> Code verified.
- **Feedback**: `placeholder="Optional feedback..."`. -> Code verified.
- **Submit Button**: Button text `Submit Rating`. -> Code verified.
- **Success Message**: `Thanks for your feedback! Your rating has been saved.`. -> Code verified.

## Problem Statement
The `seed_e2e_fixtures.py` script fails with `sqlite3.OperationalError: no such column: analysis_reports.raw_output` even after a fresh schema creation. This indicates a persistence mismatch between the SQLAlchemy model definition in memory and the actual SQLite database file being accessed at runtime.

## Debugging Plan
1.  **Verify Model Definition**: 
    - Use `python -c "from app.models import AnalysisReport; print(AnalysisReport.__table__.columns.keys())"` to confirm `raw_output` is in the class.
2.  **Verify Database Schema**:
    - Use `sqlite3` CLI or python script to inspect the *physical* `backend/derma.db` file and list columns of `analysis_reports`.
    - Compare the two.
3.  **Validate DB Path**:
    - Add print statements to `seed_e2e_fixtures.py`## Current Status: Completed
*   **Progress**:
    *   [x] Create Test File (`patient-rating.spec.js`)
    *   [x] Create/Update Seed Script (`seed_e2e_fixtures.py`)
    *   [x] Fix API/Frontend sync issues (Selectors, Waits, Port Mismatch)
    *   [x] Verify successful run.

## Outcome
The E2E test `patient-rating.spec.js` is now consistent and passing.
Key fixes included:
1.  **DB**: Reset Postgres DB to ensure schema consistency.
2.  **Test**: Added robust waits for loading states and corrected selectors for buttons/placeholders.
3.  **Env**: Resolved stale backend process issue by verifying against a fresh backend instance.

The feature is fully implemented and tested.
sk Assessment
- **Database State**: If the seed script fails (like it did before), the test will fail. I must ensure the seed script is robust. The previous error `sqlite3.OperationalError` suggests a lock or path issue. I will check `backend/app/db.py` to confirm the DB path and ensure no other process is locking it.
- **Selectors**: Dynamic IDs? constructing selectors based on user-facing text is preferred calling `getByRole` or `getByText`.

## Verification
- Pass the new test `patient-rating.spec.js`.
