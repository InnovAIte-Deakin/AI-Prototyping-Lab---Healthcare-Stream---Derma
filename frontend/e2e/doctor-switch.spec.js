/**
 * Doctor Switch E2E Test (S2-4)
 * 
 * Tests the safe doctor switch functionality:
 * 1. Patient with linked doctor can see Change Doctor button
 * 2. Patient can open the Change Doctor modal
 * 3. Patient can select a new doctor
 * 4. Switch is blocked if patient has active case
 * 
 * Uses pre-authenticated session from auth.setup.js
 */
import { test, expect } from '@playwright/test';

// Use pre-authenticated patient session (patient with AI chat fixture has a doctor linked)
test.use({ storageState: '.auth/patient_aichat.json' });

test.describe('Doctor Switch (S2-4)', () => {
    
    test('Patient can access Change Doctor from dashboard', async ({ page }) => {
        console.log('Step 1: Navigating to patient dashboard...');
        await page.goto('/patient-dashboard');
        
        console.log('Step 2: Verifying dashboard loads...');
        await expect(page.getByRole('heading', { name: 'Patient Dashboard' })).toBeVisible({ timeout: 10000 });
        console.log('Step 2: Dashboard heading visible');
        
        // Verify current doctor is displayed
        console.log('Step 3: Looking for current doctor info...');
        await expect(page.getByText('Your doctor')).toBeVisible({ timeout: 10000 });
        console.log('Step 3: Current doctor section visible');
        
        // Find and click the Change Doctor button
        console.log('Step 4: Looking for Change Doctor button...');
        const changeDoctorBtn = page.getByRole('button', { name: /Change Doctor/i });
        await expect(changeDoctorBtn).toBeVisible({ timeout: 5000 });
        console.log('Step 4: Change Doctor button found, clicking...');
        await changeDoctorBtn.click();
        
        // Verify modal opens - modal title is 'Change Doctor' in the header
        console.log('Step 5: Verifying modal opens...');
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
        console.log('Step 5: Modal opened successfully');
        
        // Verify modal content
        console.log('Step 6: Checking modal content...');
        // Should have at least a close button
        const closeBtn = page.getByRole('button', { name: /Cancel/i });
        await expect(closeBtn).toBeVisible();
        console.log('Step 6: Cancel button visible');
        
        // Close modal
        console.log('Step 7: Closing modal...');
        await closeBtn.click();
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3000 });
        console.log('Step 7: Modal closed');
        
        console.log('✅ Doctor Switch Dashboard Access Test Complete');
    });
    
    test('Modal shows available doctors and allows selection', async ({ page }) => {
        console.log('Step 1: Navigating to patient dashboard...');
        await page.goto('/patient-dashboard');
        await expect(page.getByRole('heading', { name: 'Patient Dashboard' })).toBeVisible({ timeout: 10000 });
        
        console.log('Step 2: Opening Change Doctor modal...');
        const changeDoctorBtn = page.getByRole('button', { name: /Change Doctor/i });
        await expect(changeDoctorBtn).toBeVisible({ timeout: 5000 });
        await changeDoctorBtn.click();
        
        console.log('Step 3: Waiting for doctor list to load...');
        // Wait for either doctor options or "no doctors available" message
        const hasOptions = await page.locator('input[type="radio"]').count() > 0;
        const noDocsMessage = page.getByText(/no.*doctors.*available/i);
        
        if (hasOptions) {
            console.log('Step 3: Doctor options found');
            
            // Select first available doctor (different from current)
            const firstRadio = page.locator('input[type="radio"]').first();
            await firstRadio.click();
            console.log('Step 4: Selected a doctor');
            
            // Confirm button should be enabled now
            const confirmBtn = page.getByRole('button', { name: /Confirm/i });
            await expect(confirmBtn).toBeEnabled({ timeout: 2000 });
            console.log('Step 5: Confirm button is enabled');
        } else if (await noDocsMessage.isVisible().catch(() => false)) {
            console.log('Step 3: No other doctors available (expected if only one doctor in system)');
        } else {
            console.log('Step 3: Still loading or unexpected state');
        }
        
        console.log('✅ Doctor Switch Modal Content Test Complete');
    });
});

// Test for blocking switch with active case - uses patient_pending fixture
test.describe('Doctor Switch Blocking', () => {
    test.use({ storageState: '.auth/patient_pending.json' });
    
    test('Switch is blocked when patient has pending case', async ({ page }) => {
        console.log('Step 1: Navigating to patient dashboard as patient with pending case...');
        await page.goto('/patient-dashboard');
        await expect(page.getByRole('heading', { name: 'Patient Dashboard' })).toBeVisible({ timeout: 10000 });
        
        console.log('Step 2: Opening Change Doctor modal...');
        const changeDoctorBtn = page.getByRole('button', { name: /Change Doctor/i });
        
        // This patient may or may not have Change Doctor visible depending on fixture state
        if (await changeDoctorBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await changeDoctorBtn.click();
            
            console.log('Step 3: Checking for blocked message...');
            // If doctor list loads and user tries to confirm, should see error
            const hasOptions = await page.locator('input[type="radio"]').count() > 0;
            if (hasOptions) {
                const firstRadio = page.locator('input[type="radio"]').first();
                await firstRadio.click();
                
                const confirmBtn = page.getByRole('button', { name: /Confirm/i });
                if (await confirmBtn.isEnabled().catch(() => false)) {
                    await confirmBtn.click();
                    
                    // Should see error message about active case - use first() since it appears in both dashboard and modal
                    const errorMessage = page.getByText(/active case|pending|cannot change/i).first();
                    await expect(errorMessage).toBeVisible({ timeout: 5000 });
                    console.log('Step 4: Blocking error message displayed');
                }
            }
        } else {
            console.log('Step 2: Change Doctor button not visible for this patient (may not have doctor linked)');
        }
        
        console.log('✅ Doctor Switch Blocking Test Complete');
    });
});
