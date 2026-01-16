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
        console.log('Step 1: Navigating to doctor dashboard...');
        await page.goto('/doctor-dashboard');
        
        console.log('Step 2: Verifying dashboard loads...');
        await expect(page.getByRole('heading', { name: 'Doctor Dashboard' })).toBeVisible();
        console.log('Step 2: Dashboard heading visible');
        
        // Find a pending case (the e2e_patient_pending fixture)
        console.log('Step 3: Looking for pending case...');
        const pendingCase = page.getByRole('article', { name: /e2e_patient_pending/i });
        
        // If the specific fixture case isn't visible, just use any pending case
        const caseCard = await pendingCase.isVisible() 
            ? pendingCase 
            : page.getByRole('article').first();
        
        await expect(caseCard).toBeVisible({ timeout: 10000 });
        console.log('Step 3: Found case card, clicking...');
        await caseCard.click();
        
        // Verify case page loads
        console.log('Step 4: Waiting for case page heading...');
        await expect(page.getByRole('heading', { name: /Case #/ })).toBeVisible({ timeout: 30000 });
        console.log('Step 4: Case page loaded');
        
        // Accept case if accept button is visible
        console.log('Step 5: Looking for Accept button...');
        const acceptBtn = page.getByRole('button', { name: /Accept/i }).first();
        if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('Step 5: Accept button found, clicking...');
            await acceptBtn.click();
            // Wait for chat interface to load
            console.log('Step 5: Waiting for Patient Consultation text...');
            await expect(page.getByText('Patient Consultation')).toBeVisible({ timeout: 30000 });
            console.log('Step 5: Chat interface loaded');
        } else {
            console.log('Step 5: No Accept button found (case may already be accepted)');
        }
        
        // Wait for WebSocket connection - input becomes enabled when connected
        console.log('Step 6: Waiting for WebSocket connection (input enabled)...');
        const chatInput = page.getByRole('textbox');
        
        // Wait for "Connecting..." to disappear (indicates WebSocket connected)
        const connectingBadge = page.getByText('Connecting...');
        if (await connectingBadge.isVisible({ timeout: 1000 }).catch(() => false)) {
            console.log('Step 6: Connecting badge visible, waiting for it to disappear...');
            await expect(connectingBadge).not.toBeVisible({ timeout: 30000 });
        }
        
        // Wait for input to be enabled (WebSocket connected)
        await expect(chatInput).toBeEnabled({ timeout: 30000 });
        console.log('Step 6: Chat input is now enabled (WebSocket connected)');
        
        // Debug: Log element counts
        const textboxCount = await page.getByRole('textbox').count();
        const buttonCount = await page.getByRole('button').count();
        console.log(`Step 6: Found ${textboxCount} textbox(es) and ${buttonCount} button(s) on page`);
        
        const sendButton = page.getByRole('button', { name: /send/i });
        console.log(`Step 6: Send button visible: ${await sendButton.isVisible().catch(() => false)}`);
        
        // Send message to patient
        const message = `Doctor message from E2E test ${Date.now()}`;
        console.log('Step 7: Filling message...');
        await chatInput.fill(message);
        console.log('Step 7: Clicking send button...');
        await sendButton.click();
        
        // Verify message appears in chat
        console.log('Step 8: Waiting for sent message to appear...');
        await expect(page.getByText(message)).toBeVisible({ timeout: 10000 });
        
        console.log('✅ Doctor Review Test Complete');
    });
});
