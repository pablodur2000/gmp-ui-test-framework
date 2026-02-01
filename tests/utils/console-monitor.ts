import { Page } from '@playwright/test';

/**
 * Console Error Monitoring Utility
 * 
 * Monitors console errors during test execution and provides utilities
 * to check for critical errors that should fail tests.
 * 
 * Usage:
 * ```typescript
 * const errors = await monitorConsoleErrors(page);
 * checkCriticalErrors(errors);
 * ```
 */

/**
 * Monitor console errors for a specified duration
 * 
 * @param page - Playwright Page object
 * @param timeout - Duration to monitor (default: 1000ms)
 * @returns Array of error messages
 * 
 * @example
 * ```typescript
 * const errors = await monitorConsoleErrors(page, 2000);
 * console.log(`Found ${errors.length} console errors`);
 * ```
 */
export async function monitorConsoleErrors(
  page: Page,
  timeout: number = 1000
): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Wait for specified duration to capture errors
  await page.waitForTimeout(timeout);
  
  return errors;
}

/**
 * Check for critical console errors and throw if found
 * 
 * Critical errors include:
 * - React errors
 * - Uncaught exceptions
 * - Generic Error: messages
 * 
 * @param errors - Array of error messages from monitorConsoleErrors
 * @param throwOnCritical - Whether to throw on critical errors (default: true)
 * @returns Array of critical error messages
 * 
 * @example
 * ```typescript
 * const errors = await monitorConsoleErrors(page);
 * const criticalErrors = checkCriticalErrors(errors);
 * if (criticalErrors.length > 0) {
 *   console.warn('Critical errors found:', criticalErrors);
 * }
 * ```
 */
export function checkCriticalErrors(
  errors: string[],
  throwOnCritical: boolean = true
): string[] {
  if (errors.length > 0) {
    console.warn('⚠️ Console errors detected:', errors);
  }
  
  const criticalErrors = errors.filter(err =>
    err.includes('React') || 
    err.includes('Uncaught') || 
    err.includes('Error:')
  );
  
  if (criticalErrors.length > 0) {
    const errorMessage = `Critical console errors: ${criticalErrors.join(', ')}`;
    
    if (throwOnCritical) {
      throw new Error(errorMessage);
    } else {
      console.warn(`⚠️ ${errorMessage}`);
    }
  }
  
  return criticalErrors;
}

/**
 * Monitor console errors and automatically check for critical errors
 * 
 * This is a convenience function that combines monitorConsoleErrors and checkCriticalErrors
 * 
 * @param page - Playwright Page object
 * @param timeout - Duration to monitor (default: 1000ms)
 * @param throwOnCritical - Whether to throw on critical errors (default: true)
 * @returns Object with all errors and critical errors
 * 
 * @example
 * ```typescript
 * const { allErrors, criticalErrors } = await monitorAndCheckConsoleErrors(page);
 * if (criticalErrors.length > 0) {
 *   // Handle critical errors
 * }
 * ```
 */
export async function monitorAndCheckConsoleErrors(
  page: Page,
  timeout: number = 1000,
  throwOnCritical: boolean = true
): Promise<{ allErrors: string[]; criticalErrors: string[] }> {
  const allErrors = await monitorConsoleErrors(page, timeout);
  const criticalErrors = checkCriticalErrors(allErrors, throwOnCritical);
  
  return { allErrors, criticalErrors };
}
