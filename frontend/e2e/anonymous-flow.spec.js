/**
 * Anonymous Flow E2E Test
 * 
 * Tests the anonymous user journey:
 * 1. Navigate to try-anonymous page
 * 2. Upload and analyze image without login
 * 3. Chat with AI preview
 * 4. Sign up to save results
 * 5. Verify case persists in patient history
 * 
 * Uses resilient selectors (getByRole, getByLabel) instead of brittle CSS/IDs.
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Anonymous Flow', () => {

    test('Anonymous user can analyze image and sign up to save results', async ({ page }) => {
        // 1. Navigate to Anonymous Try Page
        await page.goto('/try-anonymous');
        await expect(page.getByRole('heading', { name: 'Try DermaAI without signing up' })).toBeVisible();

        // 2. Upload Image (using accessible selector)
        console.log('Step 2: Uploading Image...');
        await page.getByLabel('Upload an image').setInputFiles(
            path.join(__dirname, 'fixtures', 'test_skin_image.png')
        );
        
        // 3. Click Analyze
        console.log('Step 3: Clicking Analyze...');
        await page.getByRole('button', { name: 'Run quick analysis' }).click();

        // Check for errors using role='alert' selector
        const errorAlert = page.getByRole('alert');
        if (await errorAlert.isVisible({ timeout: 2000 }).catch(() => false)) {
            const errorText = await errorAlert.textContent();
            console.error('Analysis Error:', errorText);
            throw new Error(`Analysis failed: ${errorText}`);
        }

        // 4. Wait for Analysis Results (resilient assertion)
        console.log('Step 4: Waiting for Results...');
        await expect(page.getByText('Chat Preview')).toBeVisible({ timeout: 60000 });
        console.log('Step 4: Results Visible');
        
        // Verify analysis details
        await expect(page.getByText(/Confidence/).first()).toBeVisible();
        await expect(page.getByText(/Quick take/)).toBeVisible();

        // 5. Sign up to save
        console.log('Step 5: Clicking Sign Up Link...');
        const signupLink = page.getByRole('link', { name: /Sign up to save this case/i });
        await expect(signupLink).toBeVisible();
        
        // Debug: Verify session ID is in link
        const href = await signupLink.getAttribute('href');
        console.log('Signup Link HREF:', href);
        if (!href?.includes('public_session_id')) {
            console.error('WARNING: Signup Link missing public_session_id');
        }

        await signupLink.click();
        
        // 6. Complete Signup Flow
        console.log('Step 6: Filling Signup Form...');
        await expect(page).toHaveURL(/.*login.*mode=signup/);
        
        // Generate unique email
        const timestamp = new Date().getTime();
        const email = `anon_saved_${timestamp}@test.com`;
        
        await page.getByLabel('Email').clear();
        await page.getByLabel('Email').fill(email); 
        
        await page.getByLabel('Password').clear();
        await page.getByLabel('Password').fill('password123');
        
        console.log('Step 6: Submitting Form...');
        await page.getByRole('button', { name: 'Create Account' }).click();

        // 7. Verify Dashboard & Persistence
        console.log('Step 7: Verifying Dashboard Redirect...');
        await expect(page).toHaveURL(/.*patient-dashboard/, { timeout: 30000 });
        await expect(page.getByRole('heading', { name: 'Your Dashboard' })).toBeVisible();
        
        // Verify the saved case exists
        console.log('Step 7: Verifying History...');
        await page.getByRole('button', { name: 'View History' }).click();
        
        // Verify at least one case exists (using resilient selector - link says "View Details")
        await expect(page.getByRole('link', { name: /View/i }).first()).toBeVisible({ timeout: 10000 });
        console.log('Test Complete: Success - Anonymous case saved');
    });
});
