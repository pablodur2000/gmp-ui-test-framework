import { Page } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Base URL for the GMP Web App
 * 
 * Supports multiple environments:
 * - production: https://gmp-web-app.vercel.app (default, no /gmp-web-app)
 * - develop: https://pablodur2000.github.io/gmp-web-app (WITH /gmp-web-app for GitHub Pages)
 * - local: http://localhost:3000 (no /gmp-web-app)
 * 
 * Note: Navigation functions use absolute URLs constructed from BASE_URL to ensure
 * correct base path handling (especially for /gmp-web-app in develop environment).
 * Set via environment variable: BASE_URL or APP_URL (loaded from .env file)
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
  
  // Remove trailing slash for consistency
  return baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
};

export const BASE_URL = getBaseURL();

/**
 * Navigation Helper Utilities
 * 
 * These functions provide a centralized way to navigate to different pages
 * in the application. This ensures consistency and makes it easy to update URLs
 * if the deployment changes.
 */

/**
 * Navigate to the home page
 * @param page - Playwright Page object
 * Uses absolute URL to ensure correct base path (handles /gmp-web-app for develop)
 */
export async function navigateToHome(page: Page): Promise<void> {
  // Use absolute URL to ensure baseURL is respected
  const url = `${BASE_URL}/`;
  await page.goto(url);
}

/**
 * Navigate to the catalog page
 * @param page - Playwright Page object
 * Uses absolute URL to ensure correct base path (handles /gmp-web-app for develop)
 */
export async function navigateToCatalog(page: Page): Promise<void> {
  // Use absolute URL to ensure baseURL is respected
  const url = `${BASE_URL}/catalogo`;
  await page.goto(url);
}

/**
 * Navigate to a specific product detail page
 * @param page - Playwright Page object
 * @param productId - The product ID to navigate to
 * Uses absolute URL to ensure correct base path (handles /gmp-web-app for develop)
 */
export async function navigateToProduct(page: Page, productId: string | number): Promise<void> {
  // Use absolute URL to ensure baseURL is respected
  const url = `${BASE_URL}/producto/${productId}`;
  await page.goto(url);
}

/**
 * Navigate to the admin login page
 * @param page - Playwright Page object
 * Uses absolute URL to ensure correct base path (handles /gmp-web-app for develop)
 */
export async function navigateToAdminLogin(page: Page): Promise<void> {
  // Use absolute URL to ensure baseURL is respected
  const url = `${BASE_URL}/admin/login`;
  await page.goto(url);
}

/**
 * Navigate to the admin dashboard
 * @param page - Playwright Page object
 * Uses absolute URL to ensure correct base path (handles /gmp-web-app for develop)
 */
export async function navigateToAdminDashboard(page: Page): Promise<void> {
  // Use absolute URL to ensure baseURL is respected
  const url = `${BASE_URL}/admin/dashboard`;
  await page.goto(url);
}

/**
 * Build a full URL for a given path
 * @param path - The path to append to the base URL (should start with /)
 * @returns The full URL
 * 
 * @example
 * buildUrl('/catalogo') // Returns: 'https://gmp-web-app.vercel.app/catalogo' (or BASE_URL/catalogo)
 */
export function buildUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

/**
 * Check if the current page URL pathname matches the expected path
 * Works with both root deployments (/) and subdirectory deployments (/gmp-web-app/)
 * @param page - Playwright Page object
 * @param expectedPath - The expected path (e.g., '/catalogo', '/admin/login')
 * @returns Promise that resolves when pathname matches
 * 
 * @example
 * await expectPathname(page, '/catalogo'); // Matches both /catalogo and /gmp-web-app/catalogo
 */
export async function expectPathname(page: Page, expectedPath: string): Promise<void> {
  const url = new URL(page.url());
  const pathname = url.pathname;
  
  // Normalize paths: remove trailing slashes for comparison
  const normalizedPathname = pathname.endsWith('/') && pathname !== '/' 
    ? pathname.slice(0, -1) 
    : pathname;
  const normalizedExpected = expectedPath.endsWith('/') && expectedPath !== '/'
    ? expectedPath.slice(0, -1)
    : expectedPath;
  
  // Check if pathname ends with expected path (handles subdirectory deployments)
  // e.g., /gmp-web-app/catalogo ends with /catalogo
  if (!normalizedPathname.endsWith(normalizedExpected)) {
    throw new Error(
      `Expected pathname to end with "${normalizedExpected}", but got "${normalizedPathname}"`
    );
  }
}
