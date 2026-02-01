import { Page } from '@playwright/test';

/**
 * Performance Tracking Utility
 * 
 * Tracks page load times and provides utilities to verify performance metrics.
 * 
 * Usage:
 * ```typescript
 * const loadTime = await trackPageLoad(page, async () => {
 *   await navigateToHome(page);
 * });
 * ```
 */

/**
 * Track page load time for a navigation operation
 * 
 * @param page - Playwright Page object
 * @param navigationFn - Async function that performs navigation
 * @param maxTimeSeconds - Maximum allowed load time in seconds (default: 5)
 * @param warnThresholdSeconds - Threshold for warning (default: 3)
 * @returns Load time in seconds
 * 
 * @throws Error if load time exceeds maxTimeSeconds
 * 
 * @example
 * ```typescript
 * const loadTime = await trackPageLoad(
 *   page,
 *   async () => await navigateToHome(page),
 *   5,  // max 5 seconds
 *   3   // warn if > 3 seconds
 * );
 * console.log(`Page loaded in ${loadTime.toFixed(2)}s`);
 * ```
 */
export async function trackPageLoad(
  page: Page,
  navigationFn: () => Promise<void>,
  maxTimeSeconds: number = 5,
  warnThresholdSeconds: number = 3
): Promise<number> {
  const startTime = Date.now();
  
  await navigationFn();
  await page.waitForLoadState('networkidle');
  
  const loadTime = (Date.now() - startTime) / 1000;
  
  if (loadTime > maxTimeSeconds) {
    throw new Error(
      `Page load time (${loadTime.toFixed(2)}s) exceeds maximum ${maxTimeSeconds}s`
    );
  }
  
  if (loadTime > warnThresholdSeconds) {
    console.warn(
      `⚠️ Page load time (${loadTime.toFixed(2)}s) exceeds recommended ${warnThresholdSeconds}s`
    );
  }
  
  console.log(`📊 Page load time: ${loadTime.toFixed(2)}s`);
  
  return loadTime;
}

/**
 * Track redirect time
 * 
 * @param page - Playwright Page object
 * @param navigationFn - Async function that performs navigation
 * @param maxTimeSeconds - Maximum allowed redirect time in seconds (default: 1)
 * @returns Redirect time in seconds
 * 
 * @example
 * ```typescript
 * const redirectTime = await trackRedirect(
 *   page,
 *   async () => await navigateToAdminDashboard(page)
 * );
 * expect(redirectTime).toBeLessThan(1);
 * ```
 */
export async function trackRedirect(
  page: Page,
  navigationFn: () => Promise<void>,
  maxTimeSeconds: number = 1
): Promise<number> {
  const startTime = Date.now();
  
  await navigationFn();
  
  const redirectTime = (Date.now() - startTime) / 1000;
  
  if (redirectTime > maxTimeSeconds) {
    console.warn(
      `⚠️ Redirect time (${redirectTime.toFixed(2)}s) exceeds recommended ${maxTimeSeconds}s`
    );
  }
  
  return redirectTime;
}
