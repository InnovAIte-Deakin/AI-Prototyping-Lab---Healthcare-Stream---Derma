# High-Level Implementation Plan: DermaAI Evolution

## Goal Description
Enhance the DermaAI prototype from a basic functional app into a polished, user-friendly teledermatology platform. The focus is on improving the user journey (Landing -> AI -> Doctor), bridging the gap between AI analysis and human consultation, and professionalizing the UI/UX.

## User Review Required
> [!IMPORTANT]
> **Anonymous Access Strategy**: Allowing public access to AI services requires careful rate limiting and abuse prevention. We will need to define limits (e.g., 1 free scan per IP per day) to prevent cost overrun.

## Proposed Changes

### Sprint 1: Core Interaction & UX Polish
*Focus: Fixing the "Must Haves" and creating a proper web app structure.*

#### 1. Authentication & Navigation Overhaul
*   **Gap**: No logout, confusion on Landing vs Login.
*   **Plan**:
    *   Create a dedicated **Landing Page** (fictional clinic "DermaAI") with "Get Started" / "Login" buttons.
    *   Move Login/Signup to a dedicated route (`/login`) or modal.
    *   **Remove Role Selection** from the public view. Assign roles dynamically or post-signup.
    *   Add **Logout Button** to the main navigation bar.
    *   Add "Back to Dashboard" navigation links.

#### 2. Enhanced Results & AI Chat
*   **Gap**: Results are raw JSON; no conversational capability.
*   **Plan**:
    *   **UI Component for Results**: Replace JSON dump with a styled summary card (Condition, Confidence, Recommendation).
    *   **AI Chat Integration**: Embed a chat interface below results.
        *   Context: Pass the analysis result to the LLM system prompt.
        *   User can ask "What does this mean?" or "Is this dangerous?".

#### 3. Doctor Profile & Data Integrity
*   **Gap**: Blank doctor profiles; manual accounts look "fake".
*   **Plan**:
    *   Update `DoctorProfile` model to mandate key fields.
    *   Enhance **Doctor List UI** to handle missing data gracefully (placeholders).
    *   **Seed Data Improvement**: Ensure all dev/test doctors have realistic names, avatars, and bios.

### Sprint 2: Clinical Workflow & Security
*Focus: Connecting the Patient, AI, and Doctor in one flow.*

#### 1. Integration Tests (Playwright)
*   Implement E2E tests for the critical path: Landing -> Login -> Upload -> Analysis.

#### 2. Doctor-Patient "One Pane" Workflow
*   **Gap**: Disconnected workflows.
*   **Plan**:
    *   **Doctor Selection**: Patient selects a doctor *before* or *during* case creation.
    *   **Escalation**: "Request Doctor Review" button on AI result.
    *   **Unified Chat**:
        *   When Doctor enters chat, AI mode pauses.
        *   Doctor sees patient's chat history with AI.
        *   Doctor acts as the authoritative responder.

#### 3. Security Hardening
*   **Auth**: Implement JWT (JSON Web Tokens) for session management.
*   **Data Safety**: Review data handling (not storing images permanently if not required, or encrypting them).

#### 4. Anonymous/Public Access
*   Allow "Try Now" flow: Upload -> Result -> "Sign up to save this case".

### Nice to Have / Future
*   **Local CV Model**: Investigate on-device or local server running of lightweight models for privacy/cost.
*   **Company "About Me"**: Detailed fictional history for DermaAI clinic.

## Summary of Gap Analysis
*   **Current State**: Functional prototype. Raw JSON outputs. Basic auth. Navigation traps (can't go back). 
*   **Target State**: Polished web application. Conversational AI. Seamless transition from AI advice to Human care.

## Next Step
Approval of this plan will trigger the creation of detailed tasks for Sprint 1.
