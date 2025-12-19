import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Patient Workflow Happy Path
 * 
 * Covers: Landing → Login → Upload → Analysis display → Doctor Review Request
 * 
 * Uses Playwright route mocks to simulate backend responses without a live database.
 */

// Mock data for backend responses
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

const mockImageUploadResponse = {
    image_id: 1,
    image_url: '/media/test-image.png',
    doctor_id: 1,
};

const mockAnalysisResponse = {
    status: 'success',
    analysis: `**Preliminary Assessment:** The lesion appears to be a benign seborrheic keratosis.

**Key Characteristics:**
- Color: Brown with even pigmentation
- Texture: Slightly raised, waxy appearance
- Borders: Well-defined edges
- Size: Approximately 5mm diameter

**Severity Level:** Low concern

**Recommendations:** Routine checkup within 6 months. No immediate action required.

**Important Disclaimer:** This is NOT a diagnosis. Professional medical evaluation is required.`,
    model_used: 'gemini-1.5-flash',
    disclaimer: 'This analysis is for preliminary information only.',
    report_id: 1,
    review_status: 'none',
    doctor_active: false,
};

const mockRequestReviewResponse = {
    report_id: 1,
    review_status: 'pending',
    message: 'Review request sent to your doctor',
};

const mockCasesResponse = {
    cases: [
        {
            id: 1,
            image_id: 1,
            image_url: '/media/test-image.png',
            patient_id: 1,
            doctor_id: 1,
            review_status: 'none',
            doctor_active: false,
            created_at: new Date().toISOString(),
            report_json: JSON.stringify(mockAnalysisResponse),
        },
    ],
};

/**
 * Setup route mocks for all backend API calls
 */
async function setupMocks(page) {
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
        if (route.request().method() === 'POST') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockImageUploadResponse),
            });
        } else {
            await route.continue();
        }
    });

    // Mock: AI Analysis
    await page.route('**/api/analysis/**', async (route) => {
        if (route.request().method() === 'POST') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockAnalysisResponse),
            });
        } else {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockAnalysisResponse),
            });
        }
    });

    // Mock: Get cases list
    await page.route('**/cases', async (route) => {
        if (route.request().method() === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockCasesResponse),
            });
        } else {
            await route.continue();
        }
    });

    // Mock: Request doctor review
    await page.route('**/cases/*/request-review', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockRequestReviewResponse),
        });
    });

    // Mock: Doctors list (fallback if no doctor linked)
    await page.route('**/doctors', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([mockDoctor.doctor]),
        });
    });
}

test.describe('Patient Workflow - Happy Path', () => {
    test.beforeEach(async ({ page }) => {
        // Setup all API mocks
        await setupMocks(page);
    });

    test('Landing page loads and shows login form', async ({ page }) => {
        await page.goto('http://localhost:5173/');

        // Verify landing page (login page)
        await expect(page.locator('h1')).toContainText('Login Page');
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('Patient can login and navigate to dashboard', async ({ page }) => {
        await page.goto('http://localhost:5173/');

        // Fill login form
        await page.fill('input[type="email"]', 'patient@example.com');

        // Select patient role (should be default)
        await page.check('input[value="patient"]');

        // Submit form
        await page.click('button[type="submit"]');

        // Should navigate to patient dashboard
        await expect(page).toHaveURL(/patient-dashboard/);
        await expect(page.locator('h1')).toContainText('Patient Dashboard');
    });

    test('Patient dashboard shows doctor info', async ({ page }) => {
        // Login first
        await page.goto('http://localhost:5173/');
        await page.fill('input[type="email"]', 'patient@example.com');
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await expect(page).toHaveURL(/patient-dashboard/);

        // Verify doctor information is displayed
        await expect(page.locator('text=Your Doctor')).toBeVisible();
        await expect(page.locator('text=Dr. Sarah Smith')).toBeVisible();
        await expect(page.locator('text=Downtown Dermatology')).toBeVisible();
    });

    test('Patient can navigate to upload page', async ({ page }) => {
        // Login first
        await page.goto('http://localhost:5173/');
        await page.fill('input[type="email"]', 'patient@example.com');
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await expect(page).toHaveURL(/patient-dashboard/);

        // Click New Scan button
        await page.click('button:has-text("New Scan")');

        // Should navigate to upload page
        await expect(page).toHaveURL(/patient-upload/);
        await expect(page.locator('h1')).toContainText('Patient Upload');
    });

    test('Complete workflow: Upload → Analysis → Request Review', async ({ page }) => {
        // Step 1: Login
        await page.goto('http://localhost:5173/');
        await page.fill('input[type="email"]', 'patient@example.com');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/patient-dashboard/);

        // Step 2: Navigate to upload
        await page.click('button:has-text("New Scan")');
        await expect(page).toHaveURL(/patient-upload/);

        // Step 3: Verify doctor info is shown
        await expect(page.locator('text=Your Doctor')).toBeVisible();
        await expect(page.locator('text=Dr. Sarah Smith')).toBeVisible();

        // Step 4: Upload image (create a test file)
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('input[type="file"]');
        const fileChooser = await fileChooserPromise;

        // Create a minimal valid PNG buffer
        const pngBuffer = Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
            0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 image
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
            0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59,
            0xe7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e,
            0x44, 0xae, 0x42, 0x60, 0x82, // IEND chunk
        ]);

        await fileChooser.setFiles({
            name: 'test-skin-lesion.png',
            mimeType: 'image/png',
            buffer: pngBuffer,
        });

        // Step 5: Click Analyze button
        await page.click('button:has-text("Analyze")');

        // Step 6: Wait for and verify analysis result
        await expect(page.locator('h2:has-text("Analysis Result")')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Preliminary Assessment')).toBeVisible();
        await expect(page.locator('text=seborrheic keratosis')).toBeVisible();
        await expect(page.locator('text=Low concern')).toBeVisible();

        // Step 7: Click Request Doctor Review button
        await expect(page.locator('button:has-text("Request Doctor Review")')).toBeVisible();
        await page.click('button:has-text("Request Doctor Review")');

        // Step 8: Verify status changes to pending
        await expect(page.locator('text=Review Pending')).toBeVisible({ timeout: 5000 });
    });

    test('Analysis displays disclaimer', async ({ page }) => {
        // Login and navigate to upload
        await page.goto('http://localhost:5173/');
        await page.fill('input[type="email"]', 'patient@example.com');
        await page.click('button[type="submit"]');
        await page.click('button:has-text("New Scan")');

        // Upload and analyze
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('input[type="file"]');
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles({
            name: 'test.png',
            mimeType: 'image/png',
            buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        });

        await page.click('button:has-text("Analyze")');

        // Verify disclaimer is shown
        await expect(page.locator('text=This is NOT a diagnosis')).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Error Handling', () => {
    test('Shows error when no doctor is linked', async ({ page }) => {
        // Override mock to return 404 for my-doctor
        await page.route('**/patient/my-doctor', async (route) => {
            await route.fulfill({
                status: 404,
                contentType: 'application/json',
                body: JSON.stringify({ detail: 'No doctor linked to this patient' }),
            });
        });

        // Mock doctors list
        await page.route('**/doctors', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([]),
            });
        });

        // Login and go to dashboard
        await page.goto('http://localhost:5173/');
        await page.fill('input[type="email"]', 'patient@example.com');
        await page.click('button[type="submit"]');

        // Should show message about no doctors
        await expect(page.locator('text=No available doctors')).toBeVisible({ timeout: 5000 });
    });
});
