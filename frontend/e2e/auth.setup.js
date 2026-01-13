/**
 * Authentication Setup - Logs in once per account and saves session state.
 * This allows tests to reuse authenticated sessions instead of logging in every time.
 * 
 * Accounts are created by seed_e2e_fixtures.py
 */
import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

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

// Helper: tries multiple selectors until one is visible, then fills it.
// Uses case-insensitive attribute matching for placeholders and aria-labels. 
async function findAndFill(page, selectors, value, timeout = 20000) {
  for (const sel of selectors) {
    const loc = page.locator(sel).first();
    try {
      await loc.waitFor({ state: 'visible', timeout });
      await loc.fill(value, { timeout });
      return;
    } catch (e) {
      // Continue to next selector if this one fails 
    }
  }
  throw new Error(`Unable to find & fill input for selectors: ${selectors.join(', ')}`);
}

for (const [name, account] of Object.entries(ACCOUNTS)) {
  setup(`authenticate as ${name}`, async ({ page }) => {
    try {
      await page.goto('/login', { waitUntil: 'domcontentloaded' });

      // Use robust helper for email 
      await findAndFill(page, [
        'input[name="email"]',
        'input[type="email"]',
        'input[placeholder*="email" i]',
        '[aria-label*="email" i]',
        'label:has-text("Email") >> input'
      ], account.email, 20000);

      // Use robust helper for password 
      await findAndFill(page, [
        'input[name="password"]',
        'input[type="password"]',
        'input[placeholder*="password" i]',
        '[aria-label*="password" i]',
        'label:has-text("Password") >> input'
      ], account.password, 20000);

      // Submit login and wait for network to settle 
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 }).catch(() => { }),
        page.getByRole('button', { name: /log in/i }).click().catch(() => { })
      ]);

      // Final check for Dashboard visibility 
      await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible({ timeout: 30000 });

      // Save storage state 
      await fs.promises.mkdir(path.dirname(account.file), { recursive: true });
      await page.context().storageState({ path: account.file });

      console.log(`✓ Saved auth state for ${name} to ${account.file}`);

    } catch (err) {
      // Write debug HTML on failure 
      const dumpPath = `.auth/debug-${name}-${Date.now()}.html`;
      try {
        const html = await page.content();
        await fs.promises.mkdir(path.dirname(dumpPath), { recursive: true });
        await fs.promises.writeFile(dumpPath, html);
        console.error(`Dumped failure HTML to ${dumpPath}`);
      } catch (e) {
        console.error('Failed to dump debug HTML', e);
      }
      throw err;
    }
  });
}
