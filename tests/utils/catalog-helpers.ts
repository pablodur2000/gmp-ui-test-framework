import { Page } from '@playwright/test';

/**
 * Extract product count number from count text
 * 
 * @param countText - Text like "Mostrando 15 productos" or "Mostrando 15 productos de Cuero"
 * @returns Number of products, or 0 if not found
 * 
 * @example
 * extractProductCount("Mostrando 15 productos") // Returns: 15
 * extractProductCount("Mostrando 3 productos de Cuero") // Returns: 3
 */
export function extractProductCount(countText: string): number {
  const match = countText.match(/(\d+)\s+productos?/i);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Wait for product count to update after filter change
 * 
 * This function waits for the product count to stabilize after a filter change.
 * It first ensures the count element is visible, then waits for the count to either:
 * 1. Change from the previous value (filter applied), OR
 * 2. Remain stable for a short period (filter already applied or no change needed)
 * 
 * @param page - Playwright Page object
 * @param previousCount - Previous count value to wait for change from
 * @param timeout - Maximum wait time in milliseconds (default: 5000)
 * 
 * @example
 * const previousCount = extractProductCount(await productCount.textContent() || '');
 * await cueroButton.click();
 * await waitForCountUpdate(page, previousCount, 5000);
 */
export async function waitForCountUpdate(
  page: Page,
  previousCount: number,
  timeout: number = 5000
): Promise<void> {
  // First, wait for the count element to be visible
  const countLocator = page.locator('[data-testid="catalog-product-count"]');
  try {
    await countLocator.waitFor({ state: 'visible', timeout: Math.min(timeout, 3000) });
  } catch {
    // Element might not be visible yet, continue to waitForFunction
  }

  // Try to wait for count to change (primary case)
  try {
    await page.waitForFunction(
      ({ prevCount }) => {
        const doc = (globalThis as any).document;
        if (!doc) return false;
        
        const countEl = doc.querySelector('[data-testid="catalog-product-count"]');
        if (!countEl) return false;
        
        // Check if element is visible
        const styles = (globalThis as any).window?.getComputedStyle(countEl);
        if (styles && (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0')) {
          return false;
        }
        
        const text = countEl.textContent || '';
        const match = text.match(/(\d+)\s+productos?/i);
        const currentCount = match ? parseInt(match[1], 10) : -1;
        
        // Return true when count has changed from previous value
        return currentCount !== prevCount && currentCount >= 0;
      },
      { prevCount: previousCount },
      { timeout: timeout * 0.8 } // Use 80% of timeout for change detection
    );
    // Count changed successfully
    return;
  } catch {
    // Count didn't change - verify element exists and has valid count
    // This handles cases where filter doesn't change the count (e.g., already filtered)
    const countEl = page.locator('[data-testid="catalog-product-count"]');
    const exists = await countEl.count() > 0;
    if (exists) {
      const text = await countEl.textContent();
      const match = text?.match(/(\d+)\s+productos?/i);
      const currentCount = match ? parseInt(match[1], 10) : -1;
      
      if (currentCount >= 0) {
        // Element exists with valid count, even if it didn't change - that's acceptable
        return;
      }
    }
    throw new Error(`Product count element not found or count did not update within ${timeout}ms`);
  }
}

/**
 * Wait for search to complete (debounce + API call)
 * 
 * Search has a 500ms debounce delay, then triggers API call.
 * This function waits for the product count to update after search.
 * 
 * @param page - Playwright Page object
 * @param previousCount - Previous count value to wait for change from
 * @param timeout - Maximum wait time in milliseconds (default: 7000)
 * 
 * @example
 * const previousCount = extractProductCount(await productCount.textContent() || '');
 * await searchInput.fill('billetera');
 * await waitForSearchComplete(page, previousCount, 7000);
 */
export async function waitForSearchComplete(
  page: Page,
  previousCount: number,
  timeout: number = 7000
): Promise<void> {
  // Wait for debounce (500ms) + API call + count update
  await waitForCountUpdate(page, previousCount, timeout);
}
