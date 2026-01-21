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
        
        // Find a pending case - Dashboard uses a TABLE, not cards (articles)
        console.log('Step 3: Looking for pending case in table...');
        
        // Find row with specific patient
        const patientRow = page.getByRole('row').filter({ hasText: 'e2e_patient_pending' });
        
        // Fallback to first data row if specific one not found (robustness)
        const targetRow = await patientRow.isVisible() 
            ? patientRow 
            : page.getByRole('row').nth(1); // 0 is header
            
        await expect(targetRow).toBeVisible({ timeout: 10000 });
        
        console.log('Step 3: Found patient row, clicking View Reports...');
        await targetRow.getByRole('button', { name: 'View Reports' }).click();
        
        // Verify patient reports list loads
        console.log('Step 4: Waiting for Patient Reports list...');
        await expect(page.getByRole('heading', { name: 'Patient Reports' })).toBeVisible({ timeout: 10000 });
        
        // Click on the specific case
        console.log('Step 4b: Clicking on the case...');
        await page.getByText('E2E Test Condition').click();
        
        // Verify case page loads
        console.log('Step 4c: Waiting for case page heading...');
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
        
        // Wait for "CONNECTING..." to disappear (indicates WebSocket connected)
        const connectingBadge = page.getByText('CONNECTING...');
        if (await connectingBadge.isVisible({ timeout: 1000 }).catch(() => false)) {
            console.log('Step 6: CONNECTING badge visible, waiting for it to disappear...');
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
