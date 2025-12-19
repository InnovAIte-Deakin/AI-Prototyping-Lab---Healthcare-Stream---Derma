import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Patient Workflow Happy Path
 * Covers: Landing → Login → Upload → Analysis display → Doctor Review Request
 */

// 1. Main Test Suite - Root Level
test.describe('Patient Workflow - Happy Path', () => {

    // Define Mock Data inside the describe block to ensure it's available to all tests
    const mockDoctor = {
        doctor: {
            id: 1,
            email: 'dr.smith@example.com',
            full_name: 'Dr. Sarah Smith',
            clinic_name: 'Downtown Dermatology',
            bio: 'Board-certified dermatologist with 15 years of experience.',
        },
        status: 'active',
    };

    const mockAnalysisResponse = {
        status: 'success',
        analysis: `**Preliminary Assessment:** Benign seborrheic keratosis. **Severity Level:** Low concern. **Important Disclaimer:** This is NOT a diagnosis.`,
        model_used: 'gemini-1.5-flash',
        report_id: 1,
        review_status: 'none',
    };

    // 2. Setup Hooks
    test.beforeEach(async ({ page }) => {
        // Mock: Get patient's doctor
        await page.route('**/patient/my-doctor', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockDoctor),
            });
        });

        // Mock: Image upload
        await page.route('**/images', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ image_id: 1, image_url: '/test.png', doctor_id: 1 }),
            });
        });

        // Mock: AI Analysis
        await page.route('**/api/analysis/**', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockAnalysisResponse),
            });
        });

        // Mock: Request doctor review
        await page.route('**/cases/*/request-review', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ review_status: 'pending' }),
            });
        });
    });

    // 3. The End-to-End Test Case
    test('Complete Workflow: Login to Request Review', async ({ page }) => {
        // Step 1: Login
        await page.goto('http://localhost:5173/');
        await page.fill('input[type="email"]', 'patient@example.com');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/patient-dashboard/);

        // Step 2: Navigate to Upload
        await page.click('button:has-text("New Scan")');
        await expect(page).toHaveURL(/patient-upload/);

        // Step 3: Mock Image Upload (using a simplified buffer for CI stability)
        await page.setInputFiles('input[type="file"]', {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from('fake-image-data'),
        });

        // Step 4: Run Analysis
        await page.click('button:has-text("Analyze")');
        // Increased timeout for slow cloud environments
        await expect(page.locator('text=Preliminary Assessment')).toBeVisible({ timeout: 15000 });

        // Step 5: Request Doctor Review (F9/B10 Workflow)
        const reviewBtn = page.locator('button:has-text("Request Doctor Review")');
        await expect(reviewBtn).toBeVisible();
        await reviewBtn.click();

        // Step 6: Verify Persistence / UI Change
        await expect(page.locator('text=Review Pending')).toBeVisible();
    });
});