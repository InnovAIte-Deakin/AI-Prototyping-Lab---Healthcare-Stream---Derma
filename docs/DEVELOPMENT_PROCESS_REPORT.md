# AI Prototyping Lab: Healthcare Stream
## Development Process & Methodology Report

### 1. Executive Summary
The **Healthcare Stream** within the **AI Prototyping Lab** is a specialized development unit focused on rapid prototyping of AI-driven medical applications. This report outlines the standardized development process, tooling ecosystem, and engineering methodologies established by the team to maintain high velocity while adhering to the strict reliability and security standards required in the healthcare domain.

Our core philosophy is **"Agentic-First Engineering,"** where human developers act as architects and reviewers, orchestrating a suite of AI agents to handle implementation, testing, and validation.

---

### 2. Tooling & Development Environment
The Healthcare Stream consists of approximately 8 developers who utilize a suite of advanced AI tools to accelerate development. While all tools serve the same primary functions—generating code, drafting implementation plans, and debugging—developers are free to choose the tool that best fits their workflow preference.

**Key AI Tools Used:**

*   **Google Antigravity:** An agentic AI assistant capable of executing code, managing files, and running terminals directly within the IDE.
*   **OpenAI Codex:** A powerful code generation model often used for scaffolding new features and writing complex logic.
*   **Claude Code:** An AI assistant frequently utilized for architectural reasoning, planning, and debugging.

This flexibility allows our team to leverage the unique strengths of each model while maintaining a unified output standard.

---

### 3. Architectural Standards & Software Principles
Beyond AI integration, the team rigorously applies fundamental software engineering principles to ensure the codebase remains maintainable and scalable as prototypes evolve into products.

*   **Separation of Concerns (SoC):** We strictly enforce a clear boundary between the frontend (React/Vite) and backend (FastAPI). The frontend manages all presentation logic and state, while the backend serves as a stateless data API.
*   **Service Layer Pattern:** To prevent "fat controllers," the backend separates routing logic from business logic.
    *   *Routers (`/routes`):* Handle HTTP request parsing, validation, and response formatting only.
    *   *Services (`/services`):* Contain the core business logic (e.g., AI integration, Auth, Image processing). This makes unit testing significantly easier as services can be tested in isolation without HTTP overhead.

---

### 4. Standard Operating Procedures (SOPs)

#### 4.1 "Context-First" Task Management
Our team has replaced traditional ticketing systems with a **document-driven requirements workflow**. We do not use tools like Jira for user stories. Instead, our process follows a strict flow:

1.  **SRS-Based Requirements:** All functional and non-functional requirements are first documented exhaustively in the **Software Requirements Specification (`docs/SRS.md`)**.
2.  **Prompt Engineering:** From the SRS, we derive specific, context-aware AI prompts. These prompts are designed to be "paste-ready" for any of our AI tools.
3.  **Task Repository:** These prompted tasks are stored in `TASKS.md`, which acts as our central engineering ledger.
    *   *Note on Formatting:* In Sprint 2, some developers adopted an **XML-based prompting style** (`<mission>`, `<context>`, `<instructions>`) to provide structured context to the AI. While not a strict rule, this format has proven effective for complex tasks and is preferred by parts of the team to minimize hallucinations.
4.  **Tracking & Synchronization:** We maintain parity between **MS Project/Planner** (for human allocation and timelines) and **`TASKS.md`** (for code-level tracking). `TASKS.md` acts as the technical "Source of Truth" for the project's state.

#### 4.2 Documentation as Context: `AGENTS.md`
A critical innovation in our process is hosting all project documentation directly in the GitHub repository. This ensures that AI agents (which "see" the codebase) have immediate access to the same context as human developers.

To facilitate this, we created **`AGENTS.md`**.
*   **Purpose:** This file acts as a "System Prompt" or "Context Window Primer" for any new AI agent entering the repository.
*   **Content:** It contains the project mission, a map of key files (`SRS.md`, `TESTING.md`), technical rules (tech stack, patterns), and protocol instructions (branching strategy).
*   **Outcome:** When a developer starts a session with an AI tool, they point it to `AGENTS.md` first, instantaneously aligning the AI with the team's specific standards and context.

#### 4.3 Git Flow & CI Automations
To maintain stability in a rapid-prototyping environment, the stream adheres to standard **Git Flow** principles supported by automated CI pipelines:

1.  **Feature Branching:** Every task corresponds to a dedicated feature branch (e.g., `feat/B11-security-hardening`), ensuring work is isolated until ready.
2.  **Pull Request Automation:** When a PR is opened against `main`, **GitHub Actions** automatically trigger the testing suite. This CI workflow runs backend unit tests, frontend component tests, and the Playwright E2E suite using the `MOCK_AI` configuration.
3.  **Human Gatekeeper:** Automated tests are supplemented by a mandatory human code review. The human reviewer acts as a quality gatekeeper, ensuring that the test scope itself is adequate and catching nuanced implementation issues that automated suites might miss. This dual-layer validation prevents "unknown unknowns" from entering the mainline.
4.  **Safe Integration:** Merges are blocked unless both the CI checks pass and the human reviewer approves the PR, guaranteeing that the `main` branch remains deployable at all times.

---

#### 4.4 The Human-AI Pair Programming Workflow
This SOP defines the exact interaction loop between the human developer and the AI agent.

**CRITICAL DEPENDENCY:** The Human Developer **MUST** maintain full awareness of application requirements and the developer workflow. AI models frequently lose context or hallucinate; the human acts as the orchestrator and final quality gate.

**Step-by-Step Workflow:**
1.  **Sync:** Prompt the AI to `checkout main` and `pull origin`.
2.  **Context Loading:** Prompt the AI to review `AGENTS.md` and all linked documents (`SRS.md`, `TASKS.md`).
3.  **Planning:** Ask the AI to write an **Implementation Plan** for a specific task (e.g., Task B11). The AI must derive context solely from the task definition in `TASKS.md`.
4.  **Review:** Human developer reviews the plan to ensure it includes creating a feature branch and adheres to architectural standards. Identify gaps or concerns and ask the AI to address them *before* writing code.
5.  **Execution:** Once the plan is approved, advise the AI to proceed with implementation.
6.  **Verification:** Ask the AI to self-verify that all requirements are met.
7.  **Automated Testing:** Run the full test suite (`run_tests.ps1`). Repeatedly prompt the AI to analyze and resolve any failures.
8.  **Manual Validation:** The developer acts as a user, manually testing the feature in the browser to catch UI/UX issues automated tests might miss.
9.  **Refinement:** Prompt the AI for optimization or improvements and re-run all checks.
10. **Commit:** Once satisfied, commit changes to the feature branch, push to origin, and open a PR.
11. **PR Documentation:** Ask the AI to summarize the changes in Markdown format to be pasted into the Pull Request description.
12. **CI Audit:** Observe the GitHub Actions checks in the PR interface.
13. **Final Handoff:** Resolve any CI failures, then assign a human reviewer for final approval.

#### 4.5 The Testing Mandate
To prevent regression in a rapidly evolving codebase, the following testing rules are mandatory for **every** task:
*   **Dual Coverage:** Every value-add feature must have both **Unit Tests** (backend/frontend) and **E2E Tests** (Playwright).
*   **Modularity:** Tests must be **scoped and modular**. Avoid monolithic test files. Each test should target specific functions or user flows to ensure failure isolation and rapid debugging.

---

### 5. Technical Challenges & Process Adaptations
Developing for Healthcare AI presents unique challenges that traditional software processes do not address. The stream has developed specific engineering adaptations:

#### 5.1 Managing Secrets in CI/CD
**Challenge:** Continuous Integration (CI) pipelines (GitHub Actions) cannot access the private medical AI API keys stored in developers' local `.env` files. Exposing these keys would be a security risk.

**Adaptation:** The team implemented a **Mock Architecture for CI**. 
*   **CI/CD Mode:** Tests in the pipeline run with `MOCK_AI=true`. This bypasses the need for a live API key by swapping the AI service with a mock provider that returns simulated medical data.
*   **Result:** This allows the entire application flow to be tested automatically on every Pull Request without requiring or exposing sensitive credentials.

#### 5.2 Security & Ethics as First-Class Citizens
**Philosophy:** In the Healthcare Stream, security is not an afterthought; it is a top priority explicitly written into every layer of our documentation (`SRS.md`, `TASKS.md`, `AGENTS.md`).

**Process:**
*   **Continuous Improvement:** As development progresses, we actively generate new tasks for both human developers and AI agents to audit and improve security postures (e.g., Task B11).
*   **Ethical Considerations:** We explicitly define tasks to address ethical issues, such as patient data privacy and potential AI bias, ensuring that implementation details align with medical ethics.
*   **Implementation:** This results in robust features like **Signed URL Tokenization** and **Auto-Expiring Anonymous Sessions** being built early in the prototyping phase, rather than tacked on at the end.

#### 5.3 Environment Standardization
**Challenge:** AI applications require complex stacks, and inconsistencies in local developer environments (OS, Python versions) often lead to "it works on my machine" failures.
**Adaptation:** The team enforces strict environment parity through two mechanisms:
1.  **Containerization:** We utilize `docker-compose` to spin up identical database and service containers, ensuring the infrastructure is the same for every developer.
2.  **Unified Scripting:** The `run_tests.ps1` script orchestrates the entire lifecycle (provisioning -> seeding -> testing -> teardown), ensuring that every developer executes the exact same verification steps in the exact same order.

#### 5.4 Critical Role of CI/CD in Dependency Validation
**Challenge:** It is easy for developers to accidentally rely on tools installed globally on their machines (e.g., `npm` packages, Python pip libraries) that are missing from the project's explicit configuration.
**Adaptation:** We treat **GitHub Actions** not just as a test runner, but as a strict **Environmental Auditor**.
*   **The "Clean Room" Approach:** CI pipelines run in fresh, isolated VMs for every Pull Request. If a dependency is not explicitly listed in `requirements.txt` or `package.json`, the build *will* fail.
*   **Impact Case Study:** This mechanism proved critical during Sprint 2 when it flagged a missing `websockets` library. The code worked perfectly on local developer machines (where the library happened to be cached) but failed instantly in CI. Without this automated audit, the missing dependency would have crashed production.

---

### 6. Conclusion
By combining rigorous software engineering standards (Git Flow, CI/CD, SoC) with an "Agentic-First" workflow, the Healthcare Stream has established a robust framework for rapid prototyping. This process ensures that while we leverage AI for velocity, we never compromise on the reliability, security, or ethical standards required in healthcare software. The human developer remains the ultimate architect and gatekeeper, ensuring that our AI tools serve the project's mission safely and effectively.


---

### 7. AI Review & Optimization Suggestions
*This audit was conducted by **Google Antigravity (Gemini 3 Pro)** to evaluate the efficiency and robustness of the Healthcare Stream's development process.*

#### Strengths Identified
1.  **Human-in-the-Loop Architecture:** The workflow correctly identifies the "Human Gatekeeper" as the critical failure stop. By forcing humans to review AI implementation plans *before* execution, the team prevents "hallucination cascades" where early errors compound into deep architectural flaws.
2.  **Context Injection Strategy:** The use of `AGENTS.md` and XML-structured prompts in `TASKS.md` is a highly effective pattern for LLM-assisted coding. It minimizes token usage while maximizing context retention, leading to more accurate code generation.
3.  **Infrastructure as Code:** The `run_tests.ps1` script is a standout feature. It lowers the barrier to entry for new developers (and agents) by ensuring that the complex environment (DB, Auth, Mock AI) can be spun up in a single command.

#### Areas for Optimization
1.  **Test Flakiness:** While `MOCK_AI` solves non-determinism, the E2E suite (Playwright) is still susceptible to race conditions in the React frontend. **Suggestion:** Implement automatic retry logic for flaky tests directly in the CI pipeline configuration.
2.  **Documentation Drift:** As dynamic as the project is, `SRS.md` risks falling out of sync with the code. **Suggestion:** Create a "Documentation Linter" agent task that runs periodically to compare the codebase against the SRS and flag discrepancies.
3.  **Agent Specialization:** Currently, agents are treated as generalists. **Suggestion:** Future iterations could benefit from strict role-based prompts (e.g., a "Security Auditor" agent that *only* runs security checks and ignores feature implementation).

*End of Report.*
