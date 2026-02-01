import { Page } from '@playwright/test';

/**
 * Base URL for the GMP Web App
 * 
 * Supports multiple environments:
 * - production: https://pablodur2000.github.io/gmp-web-app (default)
 * - local: http://localhost:3000/gmp-web-app
 * 
 * Set via environment variable: BASE_URL or APP_URL
 * This matches the baseURL in playwright.config.ts
 */
const getBaseURL = (): string => {
  // Priority: BASE_URL > APP_URL > default (production)
  const baseURL = process.env.BASE_URL || process.env.APP_URL || 'https://pablodur2000.github.io/gmp-web-app';
  
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
 */
export async function navigateToHome(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/`);
}

/**
 * Navigate to the catalog page
 * @param page - Playwright Page object
 */
export async function navigateToCatalog(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/catalogo`);
}

/**
 * Navigate to a specific product detail page
 * @param page - Playwright Page object
 * @param productId - The product ID to navigate to
 */
export async function navigateToProduct(page: Page, productId: string | number): Promise<void> {
  await page.goto(`${BASE_URL}/producto/${productId}`);
}

/**
 * Navigate to the admin login page
 * @param page - Playwright Page object
 */
export async function navigateToAdminLogin(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/admin/login`);
}

/**
 * Navigate to the admin dashboard
 * @param page - Playwright Page object
 */
export async function navigateToAdminDashboard(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/admin/dashboard`);
}

/**
 * Build a full URL for a given path
 * @param path - The path to append to the base URL (should start with /)
 * @returns The full URL
 * 
 * @example
 * buildUrl('/catalogo') // Returns: 'https://pablodur2000.github.io/gmp-web-app/catalogo'
 */
export function buildUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
}

