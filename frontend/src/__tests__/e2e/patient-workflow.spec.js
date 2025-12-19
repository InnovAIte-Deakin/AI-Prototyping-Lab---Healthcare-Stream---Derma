import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Patient Workflow Happy Path
 * Covers: Landing → Login → Upload → Analysis display → Doctor Review Request
 */

// 1. Centralized Mock Data
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

// 2. Setup Helper
async function setupMocks(page) {
    await page.route('**/patient/my-doctor', route => route.fulfill({
        status: 200, body: JSON.stringify(mockDoctor)
    }));

    await page.route('**/images', route => route.fulfill({
        status: 200, body: JSON.stringify({ image_id: 1, image_url: '/test.png', doctor_id: 1 })
    }));

    await page.route('**/api/analysis/**', route => route.fulfill({
        status: 200, body: JSON.stringify(mockAnalysisResponse)
    }));

    await page.route('**/cases/*/request-review', route => route.fulfill({
        status: 200, body: JSON.stringify({ review_status: 'pending' })
    }));
}

// 3. Main Test Suite
test.describe('Patient Workflow - Happy Path', () => {

    test.beforeEach(async ({ page }) => {
        await setupMocks(page);
    });

    test('Complete Workflow: Login to Request Review', async ({ page }) => {
        // Step 1: Login
        await page.goto('http://localhost:5173/');
        await page.fill('input[type="email"]', 'patient@example.com');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/patient-dashboard/);

        // Step 2: Navigate to Upload
        await page.click('button:has-text("New Scan")');
        await expect(page).toHaveURL(/patient-upload/);

        // Step 3: Mock Image Upload
        const blob = Buffer.from('fake-image-data');
        await page.setInputFiles('input[type="file"]', {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: blob
        });

        // Step 4: Run Analysis
        await page.click('button:has-text("Analyze")');
        await expect(page.locator('text=Preliminary Assessment')).toBeVisible({ timeout: 15000 });

        // Step 5: Request Doctor Review (Task F9/B10 Glue)
        const reviewBtn = page.locator('button:has-text("Request Doctor Review")');
        await expect(reviewBtn).toBeVisible();
        await reviewBtn.click();

        // Step 6: Verify Persistence
        await expect(page.locator('text=Review Pending')).toBeVisible();
    });
});