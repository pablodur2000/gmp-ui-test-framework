import { test, expect } from '@playwright/test';
import { navigateToCatalog, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
  extractProductCount,
  waitForCountUpdate,
  waitForProductsApiCall,
  verifyProductsApiResponse,
} from '../../../utils';

/**
 * E2E Test - CatalogPage Main Category Filter Works Correctly (QA-23)
 * 
 * Comprehensive test that verifies main category filter functionality on CatalogPage,
 * including button states, product filtering, count updates, and visual feedback.
 * 
 * Based on: QA_TICKET_QA_23_CATALOG_MAIN_CATEGORY_FILTER.md
 * Parent Epic: QA-13
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 15-20 seconds
 * - Verifies all 3 main category buttons (Todas, Cuero, Macramé)
 * - Tests button active/inactive states
 * - Tests product filtering and count updates
 * - Tests visual feedback and styling
 * 
 * Tags: @regression, @e2e, @public, @catalog, @desktop, @development, @staging, @production
 */
test.describe('CatalogPage - Main Category Filter Works Correctly (QA-23)', () => {
  test('should filter products correctly by main category with proper button states', {
    tag: ['@regression', '@e2e', '@public', '@catalog', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate to catalog page and track performance
    // ============================================================================
    const pageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToCatalog(page),
      5, // max 5 seconds
      3  // warn if > 3 seconds
    );

    // Monitor console errors
    await monitorAndCheckConsoleErrors(page, 1000);

    // Wait for products to load
    await page.waitForLoadState('networkidle');

    await expectPathname(page, '/catalogo');
    const catalogPage = page.locator(TestSelectors.catalogPage);
    await expect(catalogPage).toBeVisible();

    // Get initial product count
    const productCount = catalogPage.locator(TestSelectors.catalogProductCount);
    await expect(productCount).toBeVisible();
    const initialCountText = await productCount.textContent();
    const initialCount = extractProductCount(initialCountText || '');

    // Get product cards locator (used across all sections)
    const productCards = page.locator('[data-testid^="catalog-product-card"]');

    // Get main category filter buttons
    const todasButton = catalogPage.locator(TestSelectors.catalogMainCategoryAll);
    const cueroButton = catalogPage.locator(TestSelectors.catalogMainCategoryCuero);
    const macrameButton = catalogPage.locator(TestSelectors.catalogMainCategoryMacrame);

    // Verify all buttons are visible
    await expect(todasButton).toBeVisible();
    await expect(cueroButton).toBeVisible();
    await expect(macrameButton).toBeVisible();

    // ============================================================================
    // SECTION 1: Verify Initial State - "Todas" should be active
    // ============================================================================
    console.log('📋 Section 1: Verifying initial state (Todas active)');

    // Check "Todas" button is active (should have active styling)
    const todasButtonClasses = await todasButton.getAttribute('class');
    expect(todasButtonClasses).toContain('bg-leather-600');
    expect(todasButtonClasses).toContain('text-white');

    // Check other buttons are inactive
    const cueroButtonClasses = await cueroButton.getAttribute('class');
    const macrameButtonClasses = await macrameButton.getAttribute('class');
    expect(cueroButtonClasses).toContain('bg-gray-200');
    expect(macrameButtonClasses).toContain('bg-gray-200');

    // Verify initial count text doesn't include category context
    expect(initialCountText).not.toContain('de Cuero');
    expect(initialCountText).not.toContain('de Macramé');

    console.log('✅ Initial state verified: Todas is active');

    // ============================================================================
    // SECTION 2: Test "Cuero" Filter
    // ============================================================================
    console.log('📋 Section 2: Testing Cuero filter');

    if (await cueroButton.count() > 0) {
      // Set up API call listener BEFORE clicking
      const cueroApiPromise = waitForProductsApiCall(page, { mainCategory: 'cuero' }, 10000);

      // Click Cuero button
      await cueroButton.click();
      
      // Wait for filtering to complete (replaced waitForLoadState)
      await waitForCountUpdate(page, initialCount, 5000);

      // Verify API call was made
      const cueroApiResult = await cueroApiPromise;
      expect(cueroApiResult.received).toBe(true);
      expect(cueroApiResult.status).toBe(200);
      expect(verifyProductsApiResponse(cueroApiResult)).toBe(true);
      console.log('✅ Cuero filter API call verified');

      // Verify Cuero button is now active
      const cueroButtonClassesAfter = await cueroButton.getAttribute('class');
      expect(cueroButtonClassesAfter).toContain('bg-leather-600');
      expect(cueroButtonClassesAfter).toContain('text-white');

      // Verify Todas and Macramé buttons are inactive
      const todasButtonClassesAfter = await todasButton.getAttribute('class');
      const macrameButtonClassesAfter = await macrameButton.getAttribute('class');
      expect(todasButtonClassesAfter).toContain('bg-gray-200');
      expect(macrameButtonClassesAfter).toContain('bg-gray-200');

      // Verify product count updated
      const cueroCountText = await productCount.textContent();
      const cueroCount = extractProductCount(cueroCountText || '');
      expect(cueroCountText).toContain('de Cuero');
      expect(cueroCount).toBeGreaterThanOrEqual(0);
      expect(cueroCount).toBeLessThanOrEqual(initialCount); // Cuero products <= all products

      // Verify actual product cards match count
      const cueroCards = await productCards.count();
      expect(cueroCards).toBe(cueroCount);

      console.log(`✅ Cuero filter verified: ${cueroCount} products (button active)`);
    } else {
      console.log('ℹ️ Cuero filter button not found, skipping test');
    }

    // ============================================================================
    // SECTION 3: Test "Macramé" Filter
    // ============================================================================
    console.log('📋 Section 3: Testing Macramé filter');

    if (await macrameButton.count() > 0) {
      // Get count before switching
      const countBeforeMacrame = extractProductCount(await productCount.textContent() || '');

      // Set up API call listener BEFORE clicking
      const macrameApiPromise = waitForProductsApiCall(page, { mainCategory: 'macrame' }, 10000);

      // Click Macramé button
      await macrameButton.click();
      
      // Wait for filtering to complete (replaced waitForLoadState)
      await waitForCountUpdate(page, countBeforeMacrame, 5000);

      // Verify API call was made
      const macrameApiResult = await macrameApiPromise;
      expect(macrameApiResult.received).toBe(true);
      expect(macrameApiResult.status).toBe(200);
      expect(verifyProductsApiResponse(macrameApiResult)).toBe(true);
      console.log('✅ Macramé filter API call verified');

      // Verify Macramé button is now active
      const macrameButtonClassesAfter = await macrameButton.getAttribute('class');
      expect(macrameButtonClassesAfter).toContain('bg-leather-600');
      expect(macrameButtonClassesAfter).toContain('text-white');

      // Verify Todas and Cuero buttons are inactive
      const todasButtonClassesAfter2 = await todasButton.getAttribute('class');
      const cueroButtonClassesAfter2 = await cueroButton.getAttribute('class');
      expect(todasButtonClassesAfter2).toContain('bg-gray-200');
      expect(cueroButtonClassesAfter2).toContain('bg-gray-200');

      // Verify product count updated
      const macrameCountText = await productCount.textContent();
      const macrameCount = extractProductCount(macrameCountText || '');
      expect(macrameCountText).toContain('de Macramé');
      expect(macrameCount).toBeGreaterThanOrEqual(0);
      expect(macrameCount).toBeLessThanOrEqual(initialCount); // Macramé products <= all products

      // Verify actual product cards match count
      const macrameCards = await productCards.count();
      expect(macrameCards).toBe(macrameCount);

      console.log(`✅ Macramé filter verified: ${macrameCount} products (button active)`);
    } else {
      console.log('ℹ️ Macramé filter button not found, skipping test');
    }

    // ============================================================================
    // SECTION 4: Test "Todas" Reset Filter
    // ============================================================================
    console.log('📋 Section 4: Testing Todas reset filter');

    if (await todasButton.count() > 0) {
      // Get count before resetting
      const countBeforeReset = extractProductCount(await productCount.textContent() || '');

      // Set up API call listener for reset (should load all products)
      const resetApiPromise = waitForProductsApiCall(page, {}, 10000);

      // Click Todas button to reset
      await todasButton.click();
      
      // Wait for filtering to complete (replaced waitForLoadState)
      await waitForCountUpdate(page, countBeforeReset, 5000);

      // Verify API call was made
      const resetApiResult = await resetApiPromise;
      expect(resetApiResult.received).toBe(true);
      expect(resetApiResult.status).toBe(200);
      console.log('✅ Reset filter API call verified');

      // Verify Todas button is now active
      const todasButtonClassesAfter3 = await todasButton.getAttribute('class');
      expect(todasButtonClassesAfter3).toContain('bg-leather-600');
      expect(todasButtonClassesAfter3).toContain('text-white');

      // Verify Cuero and Macramé buttons are inactive
      const cueroButtonClassesAfter3 = await cueroButton.getAttribute('class');
      const macrameButtonClassesAfter3 = await macrameButton.getAttribute('class');
      expect(cueroButtonClassesAfter3).toContain('bg-gray-200');
      expect(macrameButtonClassesAfter3).toContain('bg-gray-200');

      // Verify product count reset to initial
      const resetCountText = await productCount.textContent();
      const resetCount = extractProductCount(resetCountText || '');
      expect(resetCount).toBe(initialCount);
      expect(resetCountText).not.toContain('de Cuero');
      expect(resetCountText).not.toContain('de Macramé');

      // Verify actual product cards match count
      const resetCards = await productCards.count();
      expect(resetCards).toBe(resetCount);

      console.log(`✅ Todas reset verified: ${resetCount} products (all filters cleared)`);
    }

    // ============================================================================
    // SECTION 5: Test Filter Switching (Cuero → Macramé → Todas)
    // ============================================================================
    console.log('📋 Section 5: Testing filter switching sequence');

    // Switch to Cuero
    if (await cueroButton.count() > 0) {
      const countBeforeCueroSwitch = extractProductCount(await productCount.textContent() || '');
      const cueroSwitchApiPromise = waitForProductsApiCall(page, { mainCategory: 'cuero' }, 10000);

      await cueroButton.click();
      await waitForCountUpdate(page, countBeforeCueroSwitch, 5000);
      
      const cueroApiResult = await cueroSwitchApiPromise;
      expect(cueroApiResult.received).toBe(true);
      expect(cueroApiResult.status).toBe(200);
      
      const cueroCountAfterSwitch = extractProductCount(await productCount.textContent() || '');
      expect(cueroCountAfterSwitch).toBeGreaterThanOrEqual(0);
      
      // Verify button state
      const cueroClasses = await cueroButton.getAttribute('class');
      expect(cueroClasses).toContain('bg-leather-600');
    }

    // Switch to Macramé
    if (await macrameButton.count() > 0) {
      const countBeforeMacrameSwitch = extractProductCount(await productCount.textContent() || '');
      const macrameSwitchApiPromise = waitForProductsApiCall(page, { mainCategory: 'macrame' }, 10000);

      await macrameButton.click();
      await waitForCountUpdate(page, countBeforeMacrameSwitch, 5000);
      
      const macrameApiResult = await macrameSwitchApiPromise;
      expect(macrameApiResult.received).toBe(true);
      expect(macrameApiResult.status).toBe(200);
      
      const macrameCountAfterSwitch = extractProductCount(await productCount.textContent() || '');
      expect(macrameCountAfterSwitch).toBeGreaterThanOrEqual(0);
      
      // Verify button state
      const macrameClasses = await macrameButton.getAttribute('class');
      expect(macrameClasses).toContain('bg-leather-600');
      
      // Verify Cuero is now inactive
      const cueroClassesAfter = await cueroButton.getAttribute('class');
      expect(cueroClassesAfter).toContain('bg-gray-200');
    }

    // Switch back to Todas
    if (await todasButton.count() > 0) {
      const countBeforeTodasSwitch = extractProductCount(await productCount.textContent() || '');
      const todasSwitchApiPromise = waitForProductsApiCall(page, {}, 10000);

      await todasButton.click();
      await waitForCountUpdate(page, countBeforeTodasSwitch, 5000);
      
      const todasApiResult = await todasSwitchApiPromise;
      expect(todasApiResult.received).toBe(true);
      expect(todasApiResult.status).toBe(200);
      
      const todasCountAfterSwitch = extractProductCount(await productCount.textContent() || '');
      expect(todasCountAfterSwitch).toBe(initialCount);
      
      // Verify button state
      const todasClasses = await todasButton.getAttribute('class');
      expect(todasClasses).toContain('bg-leather-600');
    }

    console.log('✅ Filter switching sequence verified');

    // ============================================================================
    // SECTION 6: Verify No URL Parameters (Main Category is State-Only)
    // ============================================================================
    console.log('📋 Section 6: Verifying main category does not set URL parameters');

    // Main category filter is state-only, not URL-based
    // Test with Cuero filter active
    if (await cueroButton.count() > 0) {
      const countBeforeUrlTest = extractProductCount(await productCount.textContent() || '');
      await cueroButton.click();
      await waitForCountUpdate(page, countBeforeUrlTest, 5000);

      // Verify URL does NOT have tipo parameter
      const url = new URL(page.url());
      expect(url.searchParams.has('tipo')).toBe(false);
      
      // Verify pathname is still /catalogo
      await expectPathname(page, '/catalogo');

      console.log('✅ Main category filter is state-only (no URL parameters)');
    }

    console.log(`📊 CatalogPage main category filter test completed in ${pageLoadTime.toFixed(2)}s`);
  });
});
