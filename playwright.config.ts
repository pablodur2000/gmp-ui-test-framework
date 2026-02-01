import { defineConfig, devices } from '@playwright/test';

/**
 * Environment Configuration
 * 
 * Supports multiple environments:
 * - production: https://pablodur2000.github.io/gmp-web-app/ (default)
 * - local: http://localhost:3000/gmp-web-app/
 * 
 * Set via environment variable: BASE_URL or APP_URL
 * Or use npm scripts: npm run test:local or npm run test:production
 */
const getBaseURL = (): string => {
  // Priority: BASE_URL > APP_URL > default (production)
  const baseURL = process.env.BASE_URL || process.env.APP_URL || 'https://pablodur2000.github.io/gmp-web-app';
  
  // Ensure trailing slash
  return baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
};

const baseURL = getBaseURL();
console.log(`🌐 Testing against: ${baseURL}`);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    /* Note: App uses basename="/gmp-web-app" so all routes are relative to this base */
    baseURL: baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    /* Increase default action timeout for carousel tests that need to wait for slides */
    actionTimeout: 30000, // 30 seconds for individual actions (expect, click, etc.)
  },
  
  /* Global timeout for all tests */
  timeout: 300000, // 5 minutes default (individual tests can override)

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* No local web server needed - testing against deployed site */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  //   cwd: '../gmp-web-app',
  // },
});

