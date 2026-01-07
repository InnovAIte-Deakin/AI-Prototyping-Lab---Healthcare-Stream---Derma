---
description: Systematic Playwright Test Debugging
---

# Playwright Debugging Workflow

Follow this process whenever a Playwright test fails to ensure evidence-based resolution.

1.  **Analyze the Failure Output**
    *   Run with `npx playwright test --reporter=json > test_output.json` to capture the full error message, stack trace, and failing step.
    *   Read `test_output.json` to identify exactly *where* it failed (line number) and *why* (timeout, assertion, error).

2.  **Inspect Artifacts**
    *   Check `frontend/test-results/` for screenshots/videos.
    *   If available, use `browser_subagent` to view the state of the app if running locally.

3.  **Visual Verification (Browser Subagent)**
    *   Use `browser_subagent` to navigate to the specific page and URL.
    *   Verify the DOM state matches the test's expectations (Selectors, Texts, Visibility).
    *   **Crucial**: Verify the URL is correct and the element exists in the *current* state.

4.  **Hypothesize & Amend**
    *   Formulate a hypothesis based on the divergence between Test Expectation and Subagent Reality.
    *   Update the test code (selectors, timing, logic).

5.  **Verify Fix**
    *   Re-run the test to confirm it passes.
    *   If it fails again, repeat from Step 1.
