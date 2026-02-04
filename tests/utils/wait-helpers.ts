import { Page, expect } from '@playwright/test';

/**
 * Wait Helpers Utility
 * 
 * Provides intelligent waiting functions that replace hardcoded timeouts
 * with condition-based waits.
 * 
 * Usage:
 * ```typescript
 * await waitForAnimationComplete(page);
 * await waitForScrollToComplete(page, 1000);
 * ```
 */

/**
 * Wait for scroll animation to complete
 * 
 * Waits until the scroll position stabilizes at the target position.
 * 
 * @param page - Playwright Page object
 * @param targetScrollY - Target scroll position (default: 0)
 * @param tolerance - Acceptable difference in pixels (default: 10)
 * @param timeout - Maximum time to wait (default: 2000ms)
 * 
 * @example
 * ```typescript
 * await page.evaluate(() => window.scrollTo(0, 1000));
 * await waitForScrollToComplete(page, 1000);
 * ```
 */
export async function waitForScrollToComplete(
  page: Page,
  targetScrollY: number = 0,
  tolerance: number = 10,
  timeout: number = 2000
): Promise<void> {
  await page.waitForFunction(
    ({ target, tol }) => {
      const win = (globalThis as any).window;
      if (!win) return false;
      const currentScroll = win.scrollY || 0;
      return Math.abs(currentScroll - target) <= tol;
    },
    { target: targetScrollY, tol: tolerance },
    { timeout }
  );
}

/**
 * Wait for CSS animation/transition to complete
 * 
 * Waits until an element's computed styles indicate animation is complete.
 * 
 * @param page - Playwright Page object
 * @param selector - CSS selector or locator for the element
 * @param property - CSS property to check (e.g., 'opacity', 'transform')
 * @param expectedValue - Expected final value (optional)
 * @param timeout - Maximum time to wait (default: 2000ms)
 * 
 * @example
 * ```typescript
 * await waitForAnimationComplete(
 *   page,
 *   '[data-testid="hero-section"]',
 *   'opacity',
 *   '1'
 * );
 * ```
 */
export async function waitForAnimationComplete(
  page: Page,
  selector: string,
  property: string = 'opacity',
  expectedValue?: string,
  timeout: number = 2000
): Promise<void> {
  await page.waitForFunction(
    ({ sel, prop, expected }) => {
      const doc = (globalThis as any).document;
      const win = (globalThis as any).window;
      if (!doc || !win) return false;
      
      const element = doc.querySelector(sel);
      if (!element) return false;
      
      const styles = win.getComputedStyle(element);
      const value = styles.getPropertyValue(prop);
      
      if (expected) {
        return value === expected;
      }
      
      // Check if value is stable (not transitioning)
      return value !== 'none' && value !== '';
    },
    { sel: selector, prop: property, expected: expectedValue },
    { timeout }
  );
}

/**
 * Wait for first visit animation to complete
 * 
 * Specifically waits for the first-visit animation that may hide body overflow
 * or show/hide elements.
 * 
 * @param page - Playwright Page object
 * @param timeout - Maximum time to wait (default: 3000ms)
 * 
 * @example
 * ```typescript
 * await navigateToHome(page);
 * await waitForFirstVisitAnimation(page);
 * ```
 */
export async function waitForFirstVisitAnimation(
  page: Page,
  timeout: number = 3000
): Promise<void> {
  // Wait for body overflow to be restored (animation complete)
  await page.waitForFunction(
    () => {
      const doc = (globalThis as any).document;
      const win = (globalThis as any).window;
      if (!doc || !win) return false;
      
      const body = doc.body;
      if (!body) return false;
      
      const styles = win.getComputedStyle(body);
      const overflow = styles.overflow;
      
      // Animation is complete when overflow is not 'hidden'
      return overflow !== 'hidden';
    },
    { timeout }
  ).catch(() => {
    // If body overflow check doesn't work, just wait for header to be visible
    // This is a fallback
  });

  // Also wait for header to be visible and stable
  await page.waitForFunction(
    () => {
      const doc = (globalThis as any).document;
      const win = (globalThis as any).window;
      if (!doc || !win) return false;
      
      const header = doc.querySelector('header');
      if (!header) return false;
      
      const styles = win.getComputedStyle(header);
      return styles.opacity !== '0' && !header.classList.contains('header-hidden');
    },
    { timeout: 2000 }
  ).catch(() => {
    // Header-hidden class may not exist, that's okay
  });

  // Wait for hero section to be visible (elements appear after animation)
  try {
    const heroSection = page.locator('[data-testid="home-hero-section"]');
    await expect(heroSection).toBeVisible({ timeout: 2000 });
  } catch (e) {
    // Hero section might not have data-testid, that's okay
    // Just wait a bit more for content to appear
    await page.waitForLoadState('domcontentloaded');
  }
}

/**
 * Wait for element to be in viewport after scroll
 * 
 * Scrolls element into view and waits for it to be visible.
 * 
 * @param page - Playwright Page object
 * @param selector - CSS selector or locator for the element
 * @param timeout - Maximum time to wait (default: 2000ms)
 * 
 * @example
 * ```typescript
 * await waitForElementInViewport(page, '[data-testid="location-section"]');
 * ```
 */
export async function waitForElementInViewport(
  page: Page,
  selector: string,
  timeout: number = 2000
): Promise<void> {
  const element = page.locator(selector);
  await element.scrollIntoViewIfNeeded();
  
  await page.waitForFunction(
    ({ sel }) => {
      const doc = (globalThis as any).document;
      const win = (globalThis as any).window;
      if (!doc || !win) return false;
      
      const el = doc.querySelector(sel);
      if (!el) return false;
      
      const rect = el.getBoundingClientRect();
      const viewportHeight = win.innerHeight || 0;
      
      // Element is in viewport if it's visible and within viewport bounds
      return (
        rect.top >= 0 &&
        rect.top < viewportHeight &&
        rect.height > 0
      );
    },
    { sel: selector },
    { timeout }
  );
}

/**
 * Wait for hover effect to complete
 * 
 * Waits for CSS transition to complete after hover. This function checks if
 * the element exists and waits for any CSS transitions to finish by checking
 * the transition property state.
 * 
 * @param page - Playwright Page object
 * @param selector - CSS selector for the element
 * @param property - CSS property name (for documentation/logging)
 * @param timeout - Maximum time to wait (default: 300ms)
 * 
 * @example
 * ```typescript
 * await page.hover('[data-testid="nav-link"]');
 * await waitForHoverEffect(page, '[data-testid="nav-link"]', 'color', 300);
 * ```
 */
export async function waitForHoverEffect(
  page: Page,
  selector: string,
  property: string = 'color',
  timeout: number = 300
): Promise<void> {
  try {
    // Wait for transition to complete by checking element state and transition duration
    await page.waitForFunction(
      ({ sel, prop, maxTime }) => {
        const doc = (globalThis as any).document;
        const win = (globalThis as any).window;
        if (!doc || !win) return false;
        
        const el = doc.querySelector(sel);
        if (!el) return false;
        
        // Check if element is visible
        const styles = win.getComputedStyle(el);
        if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') {
          return false;
        }
        
        // Get transition duration for the specific property or all properties
        const transitionProperty = styles.transitionProperty || 'all';
        const transitionDuration = styles.transitionDuration || '0s';
        
        // Parse duration (handles "0.3s", "300ms", etc.)
        let maxDuration = 0;
        const durations = transitionDuration.split(',').map((d: string) => d.trim());
        durations.forEach((dur: string) => {
          const match = dur.match(/(\d+\.?\d*)\s*(s|ms)/);
          if (match) {
            let value = parseFloat(match[1]);
            if (match[2] === 's') value *= 1000; // Convert to ms
            maxDuration = Math.max(maxDuration, value);
          }
        });
        
        // If no transition or transition is very short, consider it complete immediately
        if (maxDuration === 0 || maxDuration < 50) {
          return true;
        }
        
        // For elements with transitions, we need to wait for the transition to complete
        // We use a timestamp-based approach: check if enough time has passed
        // Store start time on element if not already stored
        const startTimeKey = '__hoverStartTime__';
        if (!(el as any)[startTimeKey]) {
          (el as any)[startTimeKey] = Date.now();
          return false; // First check, transition just started
        }
        
        const elapsed = Date.now() - (el as any)[startTimeKey];
        const requiredWait = maxDuration + 50; // Duration + 50ms buffer
        
        // Transition is complete if enough time has passed
        if (elapsed >= requiredWait) {
          delete (el as any)[startTimeKey]; // Clean up
          return true;
        }
        
        return false; // Still waiting for transition
      },
      { sel: selector, prop: property, maxTime: timeout },
      { timeout }
    );
  } catch (error) {
    // Timeout - hover effect might not exist or transition is longer than expected
    // Don't throw - just log and continue (test will verify actual values)
    console.log(`⚠️ Hover effect wait timed out for ${selector} (property: ${property})`);
    // Continue anyway - the test will check before/after values manually
  }
}
