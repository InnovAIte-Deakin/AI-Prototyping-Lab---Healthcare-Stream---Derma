/**
 * WebSocket Diagnostic Test
 * 
 * This test helps debug WebSocket connectivity issues in CI.
 * It tests multiple connection approaches to identify what works.
 */
import { test, expect } from '@playwright/test';

// Use pre-authenticated doctor session
test.use({ storageState: '.auth/doctor.json' });

test.describe('WebSocket Diagnostics', () => {
    
    test('Diagnose backend connectivity', async ({ page, request }) => {
        console.log('=== WebSocket Diagnostics ===');
        console.log(`Timestamp: ${new Date().toISOString()}`);
        
        // Test 1: Check if backend HTTP is reachable
        console.log('\n[Test 1] Checking backend HTTP health...');
        try {
            const healthResponse = await request.get('http://localhost:8000/health');
            console.log(`Health check status: ${healthResponse.status()}`);
            console.log(`Health check body: ${await healthResponse.text()}`);
        } catch (e) {
            console.log(`Health check FAILED: ${e.message}`);
        }
        
        // Test 2: Check root endpoint
        console.log('\n[Test 2] Checking backend root endpoint...');
        try {
            const rootResponse = await request.get('http://localhost:8000/');
            console.log(`Root status: ${rootResponse.status()}`);
            console.log(`Root body: ${await rootResponse.text()}`);
        } catch (e) {
            console.log(`Root FAILED: ${e.message}`);
        }
        
        // Test 3: Navigate to doctor dashboard and check network
        console.log('\n[Test 3] Loading doctor dashboard...');
        await page.goto('/doctor-dashboard');
        await expect(page.getByRole('heading', { name: 'Doctor Dashboard' })).toBeVisible();
        console.log('Dashboard loaded successfully');
        
        // Test 4: Find and click a case to trigger WebSocket
        console.log('\n[Test 4] Looking for any case card...');
        const caseCard = page.getByRole('article').first();
        
        if (await caseCard.isVisible({ timeout: 5000 }).catch(() => false)) {
            console.log('Found case card, clicking...');
            await caseCard.click();
            
            // Wait for case page
            await expect(page.getByRole('heading', { name: /Case #/ })).toBeVisible({ timeout: 15000 });
            console.log('Case page loaded');
            
            // Check for Accept button
            const acceptBtn = page.getByRole('button', { name: /Accept/i }).first();
            if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                console.log('Clicking Accept button...');
                await acceptBtn.click();
                await page.waitForTimeout(2000);
            }
            
            // Now check WebSocket connection status
            console.log('\n[Test 5] Checking WebSocket connection status...');
            
            // Check for CONNECTING badge
            const connectingBadge = page.getByText('CONNECTING...');
            const isConnecting = await connectingBadge.isVisible({ timeout: 1000 }).catch(() => false);
            console.log(`CONNECTING badge visible: ${isConnecting}`);
            
            // Check for connected indicators
            const aiResponding = page.getByText('AI RESPONDING');
            const humanActive = page.getByText('HUMAN PHYSICIAN ACTIVE');
            
            console.log(`AI RESPONDING visible: ${await aiResponding.isVisible({ timeout: 1000 }).catch(() => false)}`);
            console.log(`HUMAN PHYSICIAN ACTIVE visible: ${await humanActive.isVisible({ timeout: 1000 }).catch(() => false)}`);
            
            // Check chat input state
            const chatInput = page.getByRole('textbox');
            const inputVisible = await chatInput.isVisible({ timeout: 1000 }).catch(() => false);
            const inputEnabled = await chatInput.isEnabled({ timeout: 1000 }).catch(() => false);
            console.log(`Chat input visible: ${inputVisible}`);
            console.log(`Chat input enabled: ${inputEnabled}`);
            
            // If still connecting, wait and check again
            if (isConnecting) {
                console.log('\n[Test 6] Waiting up to 30s for WebSocket to connect...');
                const startTime = Date.now();
                
                // Try waiting for input to be enabled
                try {
                    await expect(chatInput).toBeEnabled({ timeout: 30000 });
                    const elapsed = Date.now() - startTime;
                    console.log(`✅ WebSocket connected after ${elapsed}ms`);
                } catch (e) {
                    const elapsed = Date.now() - startTime;
                    console.log(`❌ WebSocket FAILED to connect after ${elapsed}ms`);
                    console.log(`Error: ${e.message}`);
                    
                    // Take screenshot for debugging
                    await page.screenshot({ path: 'test-results/websocket-debug.png' });
                    console.log('Screenshot saved to test-results/websocket-debug.png');
                }
            }
            
        } else {
            console.log('❌ No case cards found on dashboard');
        }
        
        console.log('\n=== Diagnostics Complete ===');
    });
});
