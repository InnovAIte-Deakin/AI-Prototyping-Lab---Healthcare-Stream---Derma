import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for DERMA E2E tests.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    // Test directory
    testDir: './src/__tests__/e2e',

    // Test file pattern
    testMatch: '**/*.spec.js',

    // Run tests in parallel
    fullyParallel: true,

    // Fail the build on CI if you accidentally left test.only in the source code
    forbidOnly: !!process.env.CI,

    // Retry on CI only
    retries: process.env.CI ? 2 : 0,

    // Limit parallel workers on CI
    workers: process.env.CI ? 1 : undefined,

    // Reporter configuration
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list'],
    ],

    // Shared settings for all projects
    use: {
        // Base URL for navigation
        baseURL: 'http://localhost:5173',

        // Collect trace on first retry
        trace: 'on-first-retry',

        // Screenshot on failure
        screenshot: 'only-on-failure',

        // Video on failure
        video: 'on-first-retry',
    },

    // Configure projects for major browsers
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // Uncomment for additional browser testing:
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        // },
        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },
    ],

    // Run dev server before starting the tests
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
