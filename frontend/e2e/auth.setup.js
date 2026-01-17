/**
 * Authentication Setup - Authenticates via API and saves session state.
 * This is more reliable than UI-based login for setup tests.
 *
 * Uses direct API calls to /auth/login instead of the login form UI.
 * This eliminates UI flakiness and is the Playwright-recommended approach.
 *
 * Accounts are created by seed_e2e_fixtures.py
 */
import { test as setup, expect } from '@playwright/test';

const BACKEND_URL = 'http://localhost:8000';

const ACCOUNTS = {
  doctor: {
    email: 'alice@derma.com',
    password: 'password123',
    file: '.auth/doctor.json'
  },
  patient_aichat: {
    email: 'e2e_patient_aichat@test.com',
    password: 'password123',
    file: '.auth/patient_aichat.json'
  },
  patient_pending: {
    email: 'e2e_patient_pending@test.com',
    password: 'password123',
    file: '.auth/patient_pending.json'
  },
  patient_accepted: {
    email: 'e2e_patient_accepted@test.com',
    password: 'password123',
    file: '.auth/patient_accepted.json'
  },
};

for (const [name, account] of Object.entries(ACCOUNTS)) {
  setup(`authenticate as ${name}`, async ({ page, request }) => {
    // Step 1: Authenticate via API directly (bypasses UI)
    const loginResponse = await request.post(`${BACKEND_URL}/auth/login`, {
      data: {
        email: account.email,
        password: account.password
      }
    });

    // Verify login succeeded
    expect(loginResponse.ok(), `Login failed for ${name}: ${await loginResponse.text()}`).toBeTruthy();

    const userData = await loginResponse.json();

    // Step 2: Normalize user data to match frontend's AuthContext format
    const authUser = {
      id: userData.user_id,
      email: userData.email,
      role: userData.role,
      access_token: userData.access_token
    };

    // Step 3: Navigate to the app and inject auth state into localStorage
    await page.goto('/');

    await page.evaluate((user) => {
      localStorage.setItem('authUser', JSON.stringify(user));
    }, authUser);

    // Step 4: Reload to ensure the app picks up the auth state
    await page.reload();

    // Step 5: Verify authentication by checking we can access the appropriate dashboard
    const dashboardUrl = userData.role === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard';
    await page.goto(dashboardUrl);

    // Wait for dashboard to confirm auth state is working
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible({ timeout: 15000 });

    // Step 6: Save storage state (cookies, localStorage) to file
    await page.context().storageState({ path: account.file });

    console.log(`✓ Saved auth state for ${name} to ${account.file}`);
  });
}
