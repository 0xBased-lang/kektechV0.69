import { defineConfig, devices } from '@playwright/test';

/**
 * KEKTECH 3.0 - Playwright Configuration
 * E2E testing for NFT Platform + Prediction Markets
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential to avoid wallet conflicts

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : 1, // Single worker to avoid conflicts

  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3006', // ✅ FIXED: Updated to match dev server port

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',

    /* Maximum time each action can take */
    actionTimeout: 15000,

    /* Maximum time each navigation can take */
    navigationTimeout: 30000,

    /* Extra time for blockchain transactions */
    timeout: 60000, // 60s for transaction confirmations
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3006', // ✅ FIXED: Updated to match dev server port
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
