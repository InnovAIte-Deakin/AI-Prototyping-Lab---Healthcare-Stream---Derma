/**
 * Patient Doctor Chat Test
 * 
 * Tests patient viewing and replying to messages from their doctor.
 * Uses pre-authenticated session from auth.setup.js
 * 
 * Fixture: e2e_patient_accepted@test.com - case with review_status="accepted"
 */
import { test, expect } from '@playwright/test';

// Use pre-authenticated patient session (case already accepted by doctor)
test.use({ storageState: '.auth/patient_accepted.json' });

test.describe('Patient Doctor Chat', () => {
    
    test('Patient can view case and reply to doctor', async ({ page }) => {
        // Navigate to patient history (already logged in)
        await page.goto('/patient-history');
        
        // Verify history page loads  
        await expect(page.getByRole('heading', { name: /History/i })).toBeVisible();
        
        // Open the first case (case cards are clickable articles)
        const caseCard = page.getByRole('article').first();
        await expect(caseCard).toBeVisible({ timeout: 10000 });
        await caseCard.click();
        
        // Verify case page loads
        await expect(page).toHaveURL(/.*patient\/case\//);
        
        // In an accepted case, the Request Review button should NOT be visible
        // (or if visible, it would show "Accepted" status)
        // We verify we're on the case page and can interact with chat
        await expect(page.getByRole('textbox')).toBeVisible();
        
        // Send reply to doctor
        const reply = `Patient reply from E2E test ${Date.now()}`;
        await page.getByRole('textbox').fill(reply);
        await page.getByRole('button', { name: /send/i }).click();
        
        // Verify message appears in chat
        await expect(page.getByText(reply)).toBeVisible();
        
        console.log('✅ Patient Doctor Chat Test Complete');
    });
});
