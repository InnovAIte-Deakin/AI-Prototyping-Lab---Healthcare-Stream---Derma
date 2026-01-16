/**
 * Auth Flow Test
 * 
 * Verifies the Login -> Dashboard -> Logout lifecycle.
 * Ensures logout actually destroys the session.
 */
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

    test('User can log in and successfully log out', async ({ page }) => {
        const email = 'e2e_patient_aichat@test.com'; // Use a seeded account
        const password = 'password123';

        // 1. Go to Login
        await page.goto('/login');

        // Wait for form to be visible
        await page.waitForSelector('form', { timeout: 30000 });

        // 2. Log In using direct selectors
        await page.locator('input#email').fill(email);
        await page.locator('input#password').fill(password);
        await page.locator('button[type="submit"]').click();

        // 3. Verify Dashboard
        await expect(page.getByRole('heading', { name: 'Your Dashboard' })).toBeVisible();

        // 4. Click Sign out
        await page.getByRole('button', { name: /Sign out/i }).click();

        // 5. Verify Redirect to Landing Page (or Login)
        // Adjust regex to match your actual landing page URL pattern (often just /)
        await expect(page).toHaveURL(/^http:\/\/localhost:5173\/?$/);
        
        // Verify Dashboard access is revoked
        // Try to navigate back to protected route
        await page.goto('/patient-dashboard');
        
        // Should be redirected back to landing/login
        await expect(page).toHaveURL(/^http:\/\/localhost:5173\/?$/);
        
        console.log('✅ Logout verified successfully');
    });
});
