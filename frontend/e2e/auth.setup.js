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
    await page.getByLabel('Email address').clear();
    await page.getByLabel('Email address').fill(account.email);

    await page.getByLabel('Password').clear();
    await page.getByLabel('Password').fill(account.password);

    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for dashboard to confirm login success
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible({ timeout: 10000 });
    
    // Save storage state (cookies, localStorage) to file
    await page.context().storageState({ path: account.file });
    
    console.log(`✓ Saved auth state for ${name} to ${account.file}`);
  });
}
