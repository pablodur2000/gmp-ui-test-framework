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
 * E2E Test - CatalogPage Subcategory Filter Works Correctly (QA-24)
 * 
 * Comprehensive test that verifies subcategory filter functionality on CatalogPage,
 * including button states, product filtering, URL parameters, count updates, and visual feedback.
 * 
 * Based on: QA_TICKET_QA_24_CATALOG_SUBCATEGORY_FILTER.md
 * Parent Epic: QA-13
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 20-25 seconds
 * - Verifies "Todas las categorías" button and dynamic subcategory buttons
 * - Tests button active/inactive states
 * - Tests URL parameter updates (?categoria=)
 * - Tests product filtering and count updates
 * - Tests combined with main category filter
 * 
 * Tags: @regression, @e2e, @public, @catalog, @desktop, @development, @staging, @production
 */
test.describe('CatalogPage - Subcategory Filter Works Correctly (QA-24)', () => {
  test('should filter products correctly by subcategory with proper button states and URL parameters', {
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

    // Wait for products to load (initial load - keep this one)
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

    // Get "Todas las categorías" button
    const todasCategoriasButton = catalogPage.locator(TestSelectors.catalogSubcategoryFilterAll);
    await expect(todasCategoriasButton).toBeVisible();

    // ============================================================================
    // SECTION 1: Verify Initial State - "Todas las categorías" should be active
    // ============================================================================
    console.log('📋 Section 1: Verifying initial state (Todas las categorías active)');

    // Check "Todas las categorías" button is active
    const todasCategoriasButtonClasses = await todasCategoriasButton.getAttribute('class');
    expect(todasCategoriasButtonClasses).toContain('bg-leather-100');
    expect(todasCategoriasButtonClasses).toContain('text-leather-800');

    // Verify initial count text doesn't include subcategory context
    expect(initialCountText).not.toContain('en Billeteras');
    expect(initialCountText).not.toContain('en Cinturones');
    expect(initialCountText).not.toContain('en Bolsos');

    // Verify no URL parameter initially
    const initialUrl = new URL(page.url());
    expect(initialUrl.searchParams.has('categoria')).toBe(false);

    console.log('✅ Initial state verified: Todas las categorías is active');

    // ============================================================================
    // SECTION 2: Test Dynamic Subcategory Buttons (Billeteras)
    // ============================================================================
    console.log('📋 Section 2: Testing Billeteras subcategory filter');

    // Try to find Billeteras button (most common subcategory)
    const billeterasButton = catalogPage.locator('[data-testid="catalog-subcategory-filter-billeteras"]');
    
    if (await billeterasButton.count() > 0) {
      const countBeforeBilleteras = extractProductCount(await productCount.textContent() || '');

      // Set up API call listener BEFORE clicking
      const billeterasApiPromise = waitForProductsApiCall(page, { category: 'Billeteras' }, 10000);

      // Click Billeteras button
      await billeterasButton.click();
      
      // Wait for filtering to complete (replaced waitForLoadState)
      await waitForCountUpdate(page, countBeforeBilleteras, 5000);

      // Verify API call was made
      const billeterasApiResult = await billeterasApiPromise;
      expect(billeterasApiResult.received).toBe(true);
      expect(billeterasApiResult.status).toBe(200);
      expect(verifyProductsApiResponse(billeterasApiResult)).toBe(true);
      console.log('✅ Billeteras filter API call verified');

      // Verify Billeteras button is now active
      const billeterasButtonClasses = await billeterasButton.getAttribute('class');
      expect(billeterasButtonClasses).toContain('bg-leather-100');
      expect(billeterasButtonClasses).toContain('text-leather-800');

      // Verify "Todas las categorías" button is inactive
      const todasCategoriasButtonClassesAfter = await todasCategoriasButton.getAttribute('class');
      expect(todasCategoriasButtonClassesAfter).not.toContain('bg-leather-100');

      // Verify URL parameter was set
      const billeterasUrl = new URL(page.url());
      expect(billeterasUrl.searchParams.has('categoria')).toBe(true);
      expect(billeterasUrl.searchParams.get('categoria')).toBe('Billeteras');

      // Verify product count updated
      const billeterasCountText = await productCount.textContent();
      const billeterasCount = extractProductCount(billeterasCountText || '');
      expect(billeterasCountText).toContain('en Billeteras');
      expect(billeterasCount).toBeGreaterThanOrEqual(0);
      expect(billeterasCount).toBeLessThanOrEqual(initialCount);

      // Verify actual product cards match count
      const billeterasCards = await productCards.count();
      expect(billeterasCards).toBe(billeterasCount);

      console.log(`✅ Billeteras filter verified: ${billeterasCount} products (URL: ?categoria=Billeteras)`);
    } else {
      console.log('ℹ️ Billeteras subcategory button not found, skipping test');
    }

    // ============================================================================
    // SECTION 3: Test "Todas las categorías" Reset Filter
    // ============================================================================
    console.log('📋 Section 3: Testing Todas las categorías reset filter');

    if (await todasCategoriasButton.count() > 0) {
      const countBeforeReset = extractProductCount(await productCount.textContent() || '');

      // Set up API call listener for reset (should load all products)
      const resetApiPromise = waitForProductsApiCall(page, {}, 10000);

      // Click "Todas las categorías" button to reset
      await todasCategoriasButton.click();
      
      // Wait for filtering to complete (replaced waitForLoadState)
      await waitForCountUpdate(page, countBeforeReset, 5000);

      // Verify API call was made
      const resetApiResult = await resetApiPromise;
      expect(resetApiResult.received).toBe(true);
      expect(resetApiResult.status).toBe(200);
      console.log('✅ Reset filter API call verified');

      // Verify "Todas las categorías" button is now active
      const todasCategoriasButtonClassesAfter2 = await todasCategoriasButton.getAttribute('class');
      expect(todasCategoriasButtonClassesAfter2).toContain('bg-leather-100');
      expect(todasCategoriasButtonClassesAfter2).toContain('text-leather-800');

      // Verify URL parameter was removed
      const resetUrl = new URL(page.url());
      expect(resetUrl.searchParams.has('categoria')).toBe(false);

      // Verify product count reset to initial (or close, depending on other filters)
      const resetCountText = await productCount.textContent();
      const resetCount = extractProductCount(resetCountText || '');
      expect(resetCountText).not.toContain('en Billeteras');
      expect(resetCountText).not.toContain('en Cinturones');

      // Verify actual product cards match count
      const resetCards = await productCards.count();
      expect(resetCards).toBe(resetCount);

      console.log(`✅ Todas las categorías reset verified: ${resetCount} products (URL parameter cleared)`);
    }

    // ============================================================================
    // SECTION 4: Test Multiple Subcategories (if available)
    // ============================================================================
    console.log('📋 Section 4: Testing multiple subcategory filters');

    // Try to find other common subcategories
    const subcategoriesToTest = [
      'cinturones',
      'bolsos',
      'monederos',
      'accesorios',
      'accesorios-hogar',
      'joyeria',
      'paredes',
      'plantas-colgantes'
    ];

    let testedSubcategories = 0;
    const maxSubcategoriesToTest = 3; // Limit to avoid long test execution

    for (const subcategory of subcategoriesToTest) {
      if (testedSubcategories >= maxSubcategoriesToTest) break;

      const subcategoryButton = catalogPage.locator(`[data-testid="catalog-subcategory-filter-${subcategory}"]`);
      
      if (await subcategoryButton.count() > 0) {
        const countBeforeSubcategory = extractProductCount(await productCount.textContent() || '');

        // Set up API call listener
        const subcategoryApiPromise = waitForProductsApiCall(page, { category: subcategory }, 10000);

        // Click subcategory button
        await subcategoryButton.click();
        await waitForCountUpdate(page, countBeforeSubcategory, 5000);

        // Verify API call
        const subcategoryApiResult = await subcategoryApiPromise;
        expect(subcategoryApiResult.received).toBe(true);
        expect(subcategoryApiResult.status).toBe(200);

        // Verify URL parameter was set
        const subcategoryUrl = new URL(page.url());
        expect(subcategoryUrl.searchParams.has('categoria')).toBe(true);

        // Verify button is active
        const subcategoryButtonClasses = await subcategoryButton.getAttribute('class');
        expect(subcategoryButtonClasses).toContain('bg-leather-100');

        // Verify count updated
        const subcategoryCountText = await productCount.textContent();
        const subcategoryCount = extractProductCount(subcategoryCountText || '');
        expect(subcategoryCount).toBeGreaterThanOrEqual(0);

        console.log(`✅ ${subcategory} filter verified: ${subcategoryCount} products`);

        testedSubcategories++;

        // Reset before testing next subcategory
        if (await todasCategoriasButton.count() > 0) {
          const countBeforeReset = extractProductCount(await productCount.textContent() || '');
          await todasCategoriasButton.click();
          await waitForCountUpdate(page, countBeforeReset, 5000);
        }
      }
    }

    if (testedSubcategories === 0) {
      console.log('ℹ️ No additional subcategories found to test');
    } else {
      console.log(`✅ Tested ${testedSubcategories} additional subcategory filters`);
    }

    // ============================================================================
    // SECTION 5: Test Combined with Main Category Filter (Cuero → Billeteras)
    // ============================================================================
    console.log('📋 Section 5: Testing combined main category + subcategory filter');

    // First, set main category to Cuero
    const cueroButton = catalogPage.locator(TestSelectors.catalogMainCategoryCuero);
    const billeterasButton2 = catalogPage.locator('[data-testid="catalog-subcategory-filter-billeteras"]');

    if (await cueroButton.count() > 0 && await billeterasButton2.count() > 0) {
      // Reset all filters first
      if (await todasCategoriasButton.count() > 0) {
        const countBeforeReset = extractProductCount(await productCount.textContent() || '');
        await todasCategoriasButton.click();
        await waitForCountUpdate(page, countBeforeReset, 5000);
      }

      const todasButton = catalogPage.locator(TestSelectors.catalogMainCategoryAll);
      if (await todasButton.count() > 0) {
        const countBeforeTodas = extractProductCount(await productCount.textContent() || '');
        await todasButton.click();
        await waitForCountUpdate(page, countBeforeTodas, 5000);
      }

      // Set up API call listener for combined filters
      const combinedApiPromise = waitForProductsApiCall(page, { 
        mainCategory: 'cuero',
        category: 'Billeteras' 
      }, 10000);

      // Apply Cuero filter
      const countBeforeCuero = extractProductCount(await productCount.textContent() || '');
      await cueroButton.click();
      await waitForCountUpdate(page, countBeforeCuero, 5000);

      const cueroCount = extractProductCount(await productCount.textContent() || '');

      // Apply Billeteras subcategory filter
      await billeterasButton2.click();
      await waitForCountUpdate(page, cueroCount, 5000);

      // Verify combined filters API call
      const combinedApiResult = await combinedApiPromise;
      expect(combinedApiResult.received).toBe(true);
      expect(combinedApiResult.status).toBe(200);
      console.log('✅ Combined filters API call verified');

      // Verify both filters are active
      const cueroButtonClasses = await cueroButton.getAttribute('class');
      const billeterasButtonClasses2 = await billeterasButton2.getAttribute('class');
      expect(cueroButtonClasses).toContain('bg-leather-600');
      expect(billeterasButtonClasses2).toContain('bg-leather-100');

      // Verify URL parameter is set
      const combinedUrl = new URL(page.url());
      expect(combinedUrl.searchParams.get('categoria')).toBe('Billeteras');

      // Verify count is filtered (should be <= Cuero count, <= initial count)
      const combinedCountText = await productCount.textContent();
      const combinedCount = extractProductCount(combinedCountText || '');
      expect(combinedCount).toBeLessThanOrEqual(cueroCount);
      expect(combinedCount).toBeLessThanOrEqual(initialCount);
      expect(combinedCount).toBeGreaterThanOrEqual(0);

      // Verify count text includes both contexts
      expect(combinedCountText).toContain('en Billeteras');
      // May or may not include "de Cuero" depending on implementation

      console.log(`✅ Combined filter verified: ${combinedCount} products (Cuero + Billeteras)`);
    } else {
      console.log('ℹ️ Required buttons not found, skipping combined filter test');
    }

    // ============================================================================
    // SECTION 6: Test URL Parameter Persistence (Navigate and Return)
    // ============================================================================
    console.log('📋 Section 6: Testing URL parameter persistence');

    // Set a subcategory filter
    const testSubcategoryButton = catalogPage.locator('[data-testid="catalog-subcategory-filter-billeteras"]');
    
    if (await testSubcategoryButton.count() > 0) {
      // Reset first
      if (await todasCategoriasButton.count() > 0) {
        const countBeforeReset = extractProductCount(await productCount.textContent() || '');
        await todasCategoriasButton.click();
        await waitForCountUpdate(page, countBeforeReset, 5000);
      }

      // Set up API call listener
      const persistenceApiPromise = waitForProductsApiCall(page, { category: 'Billeteras' }, 10000);

      // Apply filter
      const countBeforeFilter = extractProductCount(await productCount.textContent() || '');
      await testSubcategoryButton.click();
      await waitForCountUpdate(page, countBeforeFilter, 5000);

      // Verify API call
      const persistenceApiResult = await persistenceApiPromise;
      expect(persistenceApiResult.received).toBe(true);
      expect(persistenceApiResult.status).toBe(200);

      // Capture URL with parameter
      const urlWithParam = page.url();
      expect(urlWithParam).toContain('categoria=Billeteras');

      // Navigate away (to home) - waitForLoadState is appropriate for navigation
      await page.goto(new URL(page.url()).origin + '/');
      await page.waitForLoadState('networkidle');

      // Navigate back to catalog with URL parameter - waitForLoadState is appropriate for navigation
      await page.goto(urlWithParam);
      await page.waitForLoadState('networkidle');

      // Verify filter is still applied (button should be active)
      await expectPathname(page, '/catalogo');
      const urlAfterNav = new URL(page.url());
      expect(urlAfterNav.searchParams.get('categoria')).toBe('Billeteras');

      // Verify button is active
      const testSubcategoryButtonAfterNav = catalogPage.locator('[data-testid="catalog-subcategory-filter-billeteras"]');
      if (await testSubcategoryButtonAfterNav.count() > 0) {
        const testSubcategoryButtonClasses = await testSubcategoryButtonAfterNav.getAttribute('class');
        expect(testSubcategoryButtonClasses).toContain('bg-leather-100');
      }

      console.log('✅ URL parameter persistence verified');
    } else {
      console.log('ℹ️ Test subcategory button not found, skipping URL persistence test');
    }

    console.log(`📊 CatalogPage subcategory filter test completed in ${pageLoadTime.toFixed(2)}s`);
  });
});
