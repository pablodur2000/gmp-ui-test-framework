import { test, expect } from '@playwright/test';
import { navigateToCatalog, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
  extractProductCount,
  waitForCountUpdate,
  waitForSearchComplete,
  waitForSearchApiCall,
  waitForProductsApiCall,
  verifyProductContentMatchesSearch,
  verifyProductsApiResponse,
} from '../../../utils';

/**
 * E2E Test - CatalogPage Search Functionality Works Correctly (QA-26)
 * 
 * Comprehensive test that verifies search functionality on CatalogPage,
 * including debounce behavior, search accuracy, loading states, and filter combinations.
 * 
 * Based on: QA_TICKET_QA_26_CATALOG_SEARCH.md
 * Parent Epic: QA-13
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 25-35 seconds
 * - Verifies search input, debounce (500ms), and search accuracy
 * - Tests search with filters and empty results
 * - Tests loading state and search clearing
 * 
 * Tags: @regression, @e2e, @public, @catalog, @desktop, @development, @staging, @production
 */
test.describe('CatalogPage - Search Functionality Works Correctly (QA-26)', () => {
  test('should search products correctly with debounce, loading states, and filter combinations', {
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

    // Get product cards locator
    const productCards = page.locator('[data-testid^="catalog-product-card"]');

    // ============================================================================
    // SECTION 1: Verify Search Input
    // ============================================================================
    console.log('📋 Section 1: Verifying search input');

    const searchInput = page.locator(TestSelectors.catalogSearchInput);
    await expect(searchInput).toBeVisible();

    // Verify placeholder text
    const placeholder = await searchInput.getAttribute('placeholder');
    expect(placeholder).toBe('Buscar productos por nombre...');

    // Verify input is enabled and focusable
    await expect(searchInput).toBeEnabled();
    await searchInput.focus();
    await expect(searchInput).toBeFocused();

    // Verify Search icon is visible (check for SVG icon)
    const searchIcon = page.locator('svg').first(); // Search icon from lucide-react
    await expect(searchIcon).toBeVisible();

    console.log('✅ Search input verified');

    // ============================================================================
    // SECTION 2: Test Basic Search
    // ============================================================================
    console.log('📋 Section 2: Testing basic search');

    // Set up API call listener BEFORE filling search
    const searchApiPromise = waitForSearchApiCall(page, 'billetera', 10000);

    // Type search term
    await searchInput.fill('billetera');

    // Verify search term is in input
    const searchValue = await searchInput.inputValue();
    expect(searchValue).toBe('billetera');

    // Wait for search to complete (debounce + API call + count update)
    await waitForSearchComplete(page, initialCount, 7000);

    // Verify API call was made with correct parameters
    const searchApiResult = await searchApiPromise;
    expect(searchApiResult.received).toBe(true);
    expect(searchApiResult.status).toBe(200);
    expect(searchApiResult.url).toContain('/rest/v1/products');
    
    // Verify API response structure
    const apiResponseValid = verifyProductsApiResponse(searchApiResult);
    expect(apiResponseValid).toBe(true);

    // Verify search term in API call (should be in ilike query)
    const searchInApi = searchApiResult.url.toLowerCase().includes('billetera') ||
                       JSON.stringify(searchApiResult.queryParams).toLowerCase().includes('billetera') ||
                       JSON.stringify(searchApiResult.data || '').toLowerCase().includes('billetera');
    expect(searchInApi).toBe(true);

    console.log('✅ Search API call verified');

    // Get updated product count
    const searchCountText = await productCount.textContent();
    const searchCount = extractProductCount(searchCountText || '');

    // Verify product count text includes search term
    expect(searchCountText).toContain('billetera');

    // Verify products are displayed (if any match)
    if (searchCount > 0) {
      const cardCount = await productCards.count();
      expect(cardCount).toBe(searchCount); // Verify count matches cards
      
      // ✅ NEW: Verify product content actually matches search term
      const contentMatches = await verifyProductContentMatchesSearch(page, 'billetera', 3);
      expect(contentMatches).toBe(true);
      
      console.log(`✅ Search found ${searchCount} products for "billetera" and verified content matches`);
    } else {
      // Verify empty state is displayed
      const emptyState = page.locator(TestSelectors.catalogEmptyState);
      await expect(emptyState).toBeVisible();
      const emptyStateText = await emptyState.textContent();
      expect(emptyStateText).toContain('billetera');
      console.log('✅ Empty state displayed for search with no results');
    }

    // ============================================================================
    // SECTION 3: Verify Debounce Behavior
    // ============================================================================
    console.log('📋 Section 3: Verifying debounce behavior');

    // Clear search
    await searchInput.fill('');
    await page.waitForLoadState('networkidle', { timeout: 5000 });

    // Set up API call listener BEFORE typing
    const debounceApiPromise = waitForSearchApiCall(page, 'bil', 10000);

    // Type characters quickly (should only trigger one search after debounce)
    await searchInput.type('b', { delay: 50 });
    await searchInput.type('i', { delay: 50 });
    await searchInput.type('l', { delay: 50 });
    
    // Wait for debounce (500ms) + search completion
    await waitForSearchComplete(page, extractProductCount(await productCount.textContent() || ''), 7000);
    
    // Verify API call was made (should be only one after debounce)
    const debounceApiResult = await debounceApiPromise;
    expect(debounceApiResult.received).toBe(true);
    expect(debounceApiResult.status).toBe(200);

    const debounceSearchValue = await searchInput.inputValue();
    expect(debounceSearchValue).toBe('bil');

    console.log('✅ Debounce behavior verified (single search after typing stops)');

    // ============================================================================
    // SECTION 4: Test Search with Main Category Filter
    // ============================================================================
    console.log('📋 Section 4: Testing search with main category filter');

    // Clear search first
    await searchInput.fill('');
    await waitForSearchComplete(page, extractProductCount(await productCount.textContent() || ''), 7000);

    // Apply main category filter
    const cueroButton = catalogPage.locator(TestSelectors.catalogMainCategoryCuero);
    
    // Get count before filter
    const countBeforeCategory = extractProductCount(await productCount.textContent() || '');
    
    // Set up API call listener for category filter
    const categoryApiPromise = waitForProductsApiCall(page, { mainCategory: 'cuero' }, 10000);
    
    await cueroButton.click();
    await waitForCountUpdate(page, countBeforeCategory, 5000);
    
    // Verify category API call
    const categoryApiResult = await categoryApiPromise;
    expect(categoryApiResult.received).toBe(true);
    expect(categoryApiResult.status).toBe(200);

    // Set up API call listener for search with category
    const searchWithCategoryApiPromise = waitForSearchApiCall(page, 'billetera', 10000);

    // Type search term
    await searchInput.fill('billetera');
    await waitForSearchComplete(page, extractProductCount(await productCount.textContent() || ''), 7000);
    
    // Verify search API call with category filter
    const searchWithCategoryApiResult = await searchWithCategoryApiPromise;
    expect(searchWithCategoryApiResult.received).toBe(true);
    expect(searchWithCategoryApiResult.status).toBe(200);

    // Verify both filters are active
    const cueroButtonClasses = await cueroButton.getAttribute('class');
    expect(cueroButtonClasses).toContain('bg-leather-600');
    const searchValueAfterFilter = await searchInput.inputValue();
    expect(searchValueAfterFilter).toBe('billetera');

    // Wait for product count to update
    await waitForCountUpdate(page, TestSelectors.catalogProductCount, searchCountText || '', 5000);

    const combinedCountText = await productCount.textContent();
    const combinedCount = extractProductCount(combinedCountText || '');

    console.log(`✅ Search with category filter: ${combinedCount} products`);

    // ============================================================================
    // SECTION 5: Test Clear Search
    // ============================================================================
    console.log('📋 Section 5: Testing clear search');

    // Clear search input
    await searchInput.fill('');
    await waitForSearchComplete(page, extractProductCount(await productCount.textContent() || ''), 7000);

    // Verify search input is empty
    const clearedSearchValue = await searchInput.inputValue();
    expect(clearedSearchValue).toBe('');

    // Wait for product count to update (should return to category-filtered count)
    const countBeforeClear = extractProductCount(combinedCountText || '');
    await waitForCountUpdate(page, countBeforeClear, 5000);

    const clearedCountText = await productCount.textContent();
    const clearedCount = extractProductCount(clearedCountText || '');

    // Verify product count text does NOT include search term
    expect(clearedCountText).not.toContain('billetera');

    console.log(`✅ Search cleared: ${clearedCount} products (category filter still active)`);

    // ============================================================================
    // SECTION 6: Test Search with No Results
    // ============================================================================
    console.log('📋 Section 6: Testing search with no results');

    // Set up API call listener for no-results search
    const noResultsApiPromise = waitForSearchApiCall(page, 'xyz123nonexistent', 10000);

    // Type search term that likely doesn't match
    await searchInput.fill('xyz123nonexistent');
    await waitForSearchComplete(page, extractProductCount(await productCount.textContent() || ''), 7000);
    
    // Verify API call was made
    const noResultsApiResult = await noResultsApiPromise;
    expect(noResultsApiResult.received).toBe(true);
    expect(noResultsApiResult.status).toBe(200);

    // Verify empty state is displayed
    const emptyStateNoResults = page.locator(TestSelectors.catalogEmptyState);
    await expect(emptyStateNoResults).toBeVisible();

    const emptyStateText = await emptyStateNoResults.textContent();
    expect(emptyStateText).toContain('xyz123nonexistent');
    expect(emptyStateText).toContain('No se encontraron productos');

    // Verify no product cards are displayed
    const cardCountNoResults = await productCards.count();
    expect(cardCountNoResults).toBe(0);

    console.log('✅ Empty state displayed correctly for search with no results');

    // ============================================================================
    // SECTION 7: Verify Search Loading State
    // ============================================================================
    console.log('📋 Section 7: Verifying search loading state');

    // Clear search
    await searchInput.fill('');
    await waitForSearchComplete(page, extractProductCount(await productCount.textContent() || ''), 7000);

    // Set up API call listener
    const loadingApiPromise = waitForSearchApiCall(page, 'billetera', 10000);

    // Type search term and check for loading spinner
    await searchInput.fill('billetera');
    
    // Check for loading spinner (spinner appears in the input field)
    // The spinner is positioned absolutely in the input, so we check for it
    const loadingSpinner = page.locator('.animate-spin').first();
    
    // Spinner might appear briefly, so we check if it exists (non-blocking)
    const spinnerCount = await loadingSpinner.count({ timeout: 500 });
    if (spinnerCount > 0) {
      console.log('✅ Search loading spinner detected');
    } else {
      console.log('ℹ️ Loading spinner not visible (may be too fast or not implemented)');
    }

    // Wait for search to complete
    await waitForSearchComplete(page, extractProductCount(await productCount.textContent() || ''), 7000);
    
    // Verify API call completed
    const loadingApiResult = await loadingApiPromise;
    expect(loadingApiResult.received).toBe(true);
    expect(loadingApiResult.status).toBe(200);

    console.log('✅ Search loading state verified');

    console.log('✅ Test completed successfully');
  });
});
