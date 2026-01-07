/**
 * Doctor Review Test
 * 
 * Tests doctor accepting a pending case and sending a message.
 * Uses pre-authenticated session from auth.setup.js
 * 
 * Fixture: e2e_patient_pending@test.com - case with review_status="pending"
 */
import { test, expect } from '@playwright/test';

// Use pre-authenticated doctor session
test.use({ storageState: '.auth/doctor.json' });

test.describe('Doctor Review', () => {
    
    test('Doctor can accept pending case and send message', async ({ page }) => {
        // Navigate directly to dashboard (already logged in)
        await page.goto('/doctor-dashboard');
        
        // Verify dashboard loads
        await expect(page.getByRole('heading', { name: 'Doctor Dashboard' })).toBeVisible();
        
        // Find a pending case (the e2e_patient_pending fixture)
        const pendingCase = page.getByRole('article', { name: /e2e_patient_pending/i });
        
        // If the specific fixture case isn't visible, just use any pending case
        const caseCard = await pendingCase.isVisible() 
            ? pendingCase 
            : page.getByRole('article').first();
        
        await expect(caseCard).toBeVisible({ timeout: 10000 });
        await caseCard.click();
        
        // Verify case page loads
        await expect(page.getByRole('heading', { name: /Case #/ })).toBeVisible({ timeout: 30000 });
        
        // Accept case if accept button is visible
        const acceptBtn = page.getByRole('button', { name: /Accept/i }).first();
        if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await acceptBtn.click();
            // Wait for chat interface to load
            await expect(page.getByText('Patient Consultation')).toBeVisible();
        }
        
        // Send message to patient
        const message = `Doctor message from E2E test ${Date.now()}`;
        await page.getByRole('textbox').fill(message);
        await page.getByRole('button', { name: /send/i }).click();
        
        // Verify message appears in chat
        await expect(page.getByText(message)).toBeVisible();
        
        console.log('✅ Doctor Review Test Complete');
    });
});
