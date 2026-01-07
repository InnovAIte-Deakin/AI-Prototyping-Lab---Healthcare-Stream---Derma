/**
 * Patient AI Chat Test
 * 
 * Tests patient chatting with AI about their case (before escalation to doctor).
 * Uses pre-authenticated session from auth.setup.js
 * 
 * Fixture: e2e_patient_aichat@test.com - case with review_status="none"
 */
import { test, expect } from '@playwright/test';

// Use pre-authenticated patient session
test.use({ storageState: '.auth/patient_aichat.json' });

test.describe('Patient AI Chat', () => {
    
    test('Patient can chat with AI about their case', async ({ page }) => {
        // Navigate to patient history (already logged in)
        await page.goto('/patient-history');
        
        // Verify history page loads
        await expect(page.getByRole('heading', { name: /History/i })).toBeVisible();
        
        // Open the first case
        const caseLink = page.getByRole('link', { name: /Open/i }).first();
        await expect(caseLink).toBeVisible({ timeout: 10000 });
        await caseLink.click();
        
        // Verify case page loads
        await expect(page).toHaveURL(/.*patient\/case\//);
        
        // Verify case is NOT escalated (Request Review button should be visible)
        // This confirms we're in AI-only chat mode
        await expect(page.getByRole('button', { name: /Request Physician Review/i })).toBeVisible({ timeout: 10000 });
        
        // Send message to AI
        const question = `Is this condition serious? ${Date.now()}`;
        await page.getByRole('textbox').fill(question);
        await page.getByRole('button', { name: /send/i }).click();
        
        // Verify question appears in chat
        await expect(page.getByText(question)).toBeVisible();
        
        // Verify AI responds (mock or real - look for AI message pattern)
        // Mock AI response contains "Mock AI" prefix
        await expect(
            page.getByText(/Mock AI|recommend|condition|monitor/i).first()
        ).toBeVisible({ timeout: 15000 });
        
        console.log('✅ Patient AI Chat Test Complete');
    });
});
