---
description: How to create robust E2E tests using Code-First Validation
---

# Creating Robust E2E Tests

Follow this 4-step "Code-First" methodology to ensure tests are robust, resilient, and accurate to the application logic.

## 1. Requirement Analysis
Understand the user journey you are testing. Define the "Happy Path" and critical "Failure Paths".

## 2. Static Code Analysis (CRITICAL)
**Do not guess selectors.** Before writing a single line of test code, read the source code of the components involved.

1.  **Identify Components**: Locate the `.jsx` files (e.g., `PatientDashboard.jsx`, `LoginPage.jsx`).
2.  **Verify Elements**:
    *   Are buttons `<button>` or `<a>` tags? (Common point of failure).
    *   What are the exact text labels? (e.g., "Sign Up" vs "Sign up").
    *   Are there `data-testid` attributes? If not, prefer `role` selectors (`getByRole('button', { name: '...' })`).
3.  **Understand Logic**:
    *   Does a feature require specific state (e.g., "Doctor Selected") to appear?
    *   Are there asynchronous loaders? (Requires `await expect(...).toBeVisible()`).

## 3. Implementation
Write the test in `frontend/e2e/`.

*   **Use Resilient Selectors**: Prefer `getByRole` over CSS/XPath.
*   **Add Logging**: Use `console.log('Step X: ...')` to trace progress in CI.
*   **Handle Flakiness**: Use `retries` in config (enabled by default). Increase timeouts for AI/Backend operations if needed (`timeout: 60000`).

## 4. Verification & Debugging
Run the test: `npx playwright test e2e/your-test.spec.js`.

*   **If it fails**:
    *   Do NOT just re-run.
    *   Check the `list` output to see the last passed Step.
    *   Check `Trace` or `Screenshots` in `test-results/`.
    *   **Re-read the Component Code** to confirm your assumptions about the DOM were correct.

## Auto-Healing & Reporting
*   **Retries**: Tests automatically retry once locally and twice on CI to handle transient flakes.
*   **Reporting**: GitHub Actions uploads the HTML report. Check the "Summary" tab in GitHub.
