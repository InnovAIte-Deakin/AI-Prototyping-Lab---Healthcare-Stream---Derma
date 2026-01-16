/**
 * Authentication Setup - Logs in once per account and saves session state.
 * This allows tests to reuse authenticated sessions instead of logging in every time.
 * 
 * Accounts are created by seed_e2e_fixtures.py
 */
import { test as setup, expect } from '@playwright/test';

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
  setup(`authenticate as ${name}`, async ({ page }) => {
    await page.goto('/login');

    // Wait for form to be visible
    await page.waitForSelector('form', { timeout: 30000 });

    // Use input selectors directly for more reliability
    const emailInput = page.locator('input#email');
    const passwordInput = page.locator('input#password');
    const submitButton = page.locator('button[type="submit"]');

    // Wait for inputs to be visible
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });

    // Fill form
    await emailInput.fill(account.email);
    await passwordInput.fill(account.password);

    // Click submit
    await submitButton.click();

    // Wait for dashboard to confirm login success
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible({ timeout: 30000 });

    // Save storage state (cookies, localStorage) to file
    await page.context().storageState({ path: account.file });

    console.log(`✓ Saved auth state for ${name} to ${account.file}`);
  });
}
