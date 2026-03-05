import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment Configuration
 * 
 * Supports multiple environments:
 * - production: https://gmp-web-app.vercel.app/ (default, no /gmp-web-app)
 * - develop: https://pablodur2000.github.io/gmp-web-app/ (WITH /gmp-web-app for GitHub Pages)
 * - local: http://localhost:3000/ (no /gmp-web-app)
 * 
 * Note: Navigation functions use relative paths (e.g., /catalogo)
 * Playwright's baseURL automatically handles the /gmp-web-app prefix for develop
 * Set via environment variable: BASE_URL or APP_URL
 * Or use npm scripts: npm run test:local, npm run test:develop, or npm run test:production
 */
const getBaseURL = (): string => {
  // Priority: BASE_URL > APP_URL > default (production)
  let baseURL = process.env.BASE_URL || process.env.APP_URL;
  
  // If BASE_URL is set but missing /gmp-web-app for develop, fix it
  if (baseURL && baseURL.includes('pablodur2000.github.io') && !baseURL.includes('/gmp-web-app')) {
    console.warn(`⚠️ WARNING: BASE_URL is missing /gmp-web-app! Fixing: ${baseURL} -> ${baseURL}/gmp-web-app`);
    baseURL = `${baseURL}/gmp-web-app`;
  }
  
  // Default to production if not set
  if (!baseURL) {
    baseURL = 'https://gmp-web-app.vercel.app';
  }
  
  // Remove trailing slash - Playwright's baseURL should not have trailing slash
  // When using page.goto('/path'), Playwright will correctly resolve it
  return baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
};

const baseURL = getBaseURL();
console.log(`🌐 Testing against: ${baseURL}`);
console.log(`🔍 BASE_URL env var: ${process.env.BASE_URL || 'NOT SET'}`);
console.log(`🔍 APP_URL env var: ${process.env.APP_URL || 'NOT SET'}`);
console.log(`🔍 All env vars with BASE:`, Object.keys(process.env).filter(k => k.includes('BASE')).map(k => `${k}=${process.env[k]}`).join(', '));

// CRITICAL CHECK: If testing against develop, baseURL MUST include /gmp-web-app
if (baseURL.includes('pablodur2000.github.io') && !baseURL.includes('/gmp-web-app')) {
  console.error(`\n❌❌❌ CRITICAL ERROR: baseURL is missing /gmp-web-app! ❌❌❌`);
  console.error(`   Current: ${baseURL}`);
  console.error(`   Expected: https://pablodur2000.github.io/gmp-web-app`);
  console.error(`   This will cause 404 errors on GitHub Pages!\n`);
  // Don't throw - let the test fail naturally so user can see the error
}

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
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL for Playwright context (used by waitForURL and other Playwright features) */
    /* Note: Navigation functions in navigation.ts use absolute URLs, not this baseURL */
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

