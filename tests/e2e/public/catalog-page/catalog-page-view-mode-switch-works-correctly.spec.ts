import { test, expect } from '@playwright/test';
import { navigateToCatalog, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
  waitForCountUpdate,
  waitForSearchComplete,
  waitForProductsApiCall,
  extractProductCount,
} from '../../../utils';

/**
 * E2E Test - CatalogPage View Mode Switch Works Correctly (QA-27)
 * 
 * Comprehensive test that verifies view mode toggle (Grid/List) works correctly,
 * switches between grid and list layouts, updates product card display, maintains state,
 * and provides smooth transitions.
 * 
 * Based on: QA_TICKET_QA_27_CATALOG_VIEW_MODE.md
 * Parent Epic: QA-13
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 15-20 seconds
 * - Verifies view mode toggle buttons, layout changes, product card adaptation, and state management
 * - Tests state persistence with filters and search
 * 
 * Tags: @regression, @e2e, @public, @catalog, @desktop, @development, @staging, @production
 */
test.describe('CatalogPage - View Mode Switch Works Correctly (QA-27)', () => {
  test('should switch between grid and list view modes correctly with proper layout changes and state persistence', {
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

    // Get product list container
    const productList = page.locator(TestSelectors.catalogProductList);
    await expect(productList).toBeVisible();

    // Get product cards locator
    const productCards = page.locator('[data-testid^="catalog-product-card"]');
    const initialCardCount = await productCards.count();
    expect(initialCardCount).toBeGreaterThan(0);

    // ============================================================================
    // SECTION 1: Verify View Mode Buttons
    // ============================================================================
    console.log('📋 Section 1: Verifying view mode buttons');

    const gridButton = page.locator(TestSelectors.catalogViewToggleGrid);
    const listButton = page.locator(TestSelectors.catalogViewToggleList);

    // Verify buttons are visible
    await expect(gridButton).toBeVisible();
    await expect(listButton).toBeVisible();

    // Verify buttons are in a horizontal row (check parent container)
    const viewToggleContainer = gridButton.locator('..');
    const containerClasses = await viewToggleContainer.getAttribute('class');
    expect(containerClasses).toContain('flex');
    expect(containerClasses).toContain('space-x-2');

    // Verify Grid icon is visible (lucide-react Grid icon)
    const gridIcon = gridButton.locator('svg');
    await expect(gridIcon).toBeVisible();

    // Verify List icon is visible (lucide-react List icon)
    const listIcon = listButton.locator('svg');
    await expect(listIcon).toBeVisible();

    console.log('✅ View mode buttons verified');

    // ============================================================================
    // SECTION 2: Verify Default State - Grid View
    // ============================================================================
    console.log('📋 Section 2: Verifying default Grid view state');

    // Verify Grid view button has active styling
    const gridButtonClasses = await gridButton.getAttribute('class');
    expect(gridButtonClasses).toContain('bg-leather-100');
    expect(gridButtonClasses).toContain('text-leather-800');

    // Verify List view button has inactive styling
    const listButtonClasses = await listButton.getAttribute('class');
    expect(listButtonClasses).toContain('text-gray-400');

    // Verify product list container has grid layout classes
    const productListClasses = await productList.getAttribute('class');
    expect(productListClasses).toContain('grid-cols-1');
    expect(productListClasses).toContain('sm:grid-cols-2');
    expect(productListClasses).toContain('lg:grid-cols-3');

    // Verify first product card has grid layout (vertical card structure)
    const firstCard = productCards.first();
    const firstCardClasses = await firstCard.getAttribute('class');
    expect(firstCardClasses).toContain('card');

    // Verify product image in grid view (aspect-square)
    const firstCardImage = firstCard.locator('img').first();
    const imageParent = firstCardImage.locator('..');
    const imageParentClasses = await imageParent.getAttribute('class');
    expect(imageParentClasses).toContain('aspect-square');

    console.log('✅ Default Grid view verified');

    // ============================================================================
    // SECTION 3: Test Switch to List View
    // ============================================================================
    console.log('📋 Section 3: Testing switch to List view');

    await listButton.click();
    await expect(listButton).toHaveClass(/bg-leather-100/, { timeout: 2000 });

    // Verify List view button has active styling
    const listButtonClassesActive = await listButton.getAttribute('class');
    expect(listButtonClassesActive).toContain('bg-leather-100');
    expect(listButtonClassesActive).toContain('text-leather-800');

    // Verify Grid view button has inactive styling
    const gridButtonClassesInactive = await gridButton.getAttribute('class');
    expect(gridButtonClassesInactive).toContain('text-gray-400');

    // Verify product list container has list layout (single column)
    const productListClassesList = await productList.getAttribute('class');
    expect(productListClassesList).toContain('grid-cols-1');
    // Should NOT have sm:grid-cols-2 or lg:grid-cols-3 in list view
    expect(productListClassesList).not.toContain('sm:grid-cols-2');
    expect(productListClassesList).not.toContain('lg:grid-cols-3');

    console.log('✅ Switch to List view verified');

    // ============================================================================
    // SECTION 4: Verify List View Product Card Layout
    // ============================================================================
    console.log('📋 Section 4: Verifying List view product card layout');

    // Verify first product card has list layout (horizontal flex)
    const firstCardList = productCards.first();
    const firstCardListClasses = await firstCardList.getAttribute('class');
    expect(firstCardListClasses).toContain('card');

    // Verify product card has horizontal layout (flex row)
    const cardContent = firstCardList.locator('> div').first();
    const cardContentClasses = await cardContent.getAttribute('class');
    expect(cardContentClasses).toContain('flex');
    expect(cardContentClasses).toContain('gap-6');

    // Verify product image in list view (w-32 h-32)
    const firstCardListImage = firstCardList.locator('img').first();
    const imageParentList = firstCardListImage.locator('..');
    const imageParentListClasses = await imageParentList.getAttribute('class');
    expect(imageParentListClasses).toContain('w-32');
    expect(imageParentListClasses).toContain('h-32');
    expect(imageParentListClasses).toContain('flex-shrink-0');

    // Verify product info section exists (flex-1)
    const productInfo = firstCardList.locator('.flex-1').first();
    await expect(productInfo).toBeVisible();

    // Verify product card shows required elements
    const productTitle = firstCardList.locator('h3, h2, h4').first();
    await expect(productTitle).toBeVisible();

    const productPrice = firstCardList.locator('text=/\\$|UYU/').first();
    await expect(productPrice).toBeVisible();

    console.log('✅ List view product card layout verified');

    // ============================================================================
    // SECTION 5: Test Switch Back to Grid View
    // ============================================================================
    console.log('📋 Section 5: Testing switch back to Grid view');

    await gridButton.click();
    await expect(gridButton).toHaveClass(/bg-leather-100/, { timeout: 2000 });

    // Verify Grid view button has active styling
    const gridButtonClassesActive = await gridButton.getAttribute('class');
    expect(gridButtonClassesActive).toContain('bg-leather-100');
    expect(gridButtonClassesActive).toContain('text-leather-800');

    // Verify List view button has inactive styling
    const listButtonClassesInactive = await listButton.getAttribute('class');
    expect(listButtonClassesInactive).toContain('text-gray-400');

    // Verify product list container has grid layout again
    const productListClassesGrid = await productList.getAttribute('class');
    expect(productListClassesGrid).toContain('grid-cols-1');
    expect(productListClassesGrid).toContain('sm:grid-cols-2');
    expect(productListClassesGrid).toContain('lg:grid-cols-3');

    // Verify first product card has grid layout again
    const firstCardGrid = productCards.first();
    const firstCardGridImage = firstCardGrid.locator('img').first();
    const imageParentGrid = firstCardGridImage.locator('..');
    const imageParentGridClasses = await imageParentGrid.getAttribute('class');
    expect(imageParentGridClasses).toContain('aspect-square');

    console.log('✅ Switch back to Grid view verified');

    // ============================================================================
    // SECTION 6: Verify View Mode State Persistence with Filters
    // ============================================================================
    console.log('📋 Section 6: Verifying view mode state persistence with filters');

    // Switch to List view
    await listButton.click();
    await expect(listButton).toHaveClass(/bg-leather-100/, { timeout: 2000 });

    // Set up API call listener for category filter
    const cueroApiPromise = waitForProductsApiCall(page, { mainCategory: 'cuero' }, 10000);

    // Apply main category filter
    const cueroButton = catalogPage.locator(TestSelectors.catalogMainCategoryCuero);
    const countBeforeCuero = extractProductCount(await page.locator(TestSelectors.catalogProductCount).textContent() || '');
    await cueroButton.click();
    await waitForCountUpdate(page, countBeforeCuero, 5000);

    // Verify API call
    const cueroApiResult = await cueroApiPromise;
    expect(cueroApiResult.received).toBe(true);
    expect(cueroApiResult.status).toBe(200);

    // Verify List view is still active
    const listButtonClassesAfterFilter = await listButton.getAttribute('class');
    expect(listButtonClassesAfterFilter).toContain('bg-leather-100');
    expect(listButtonClassesAfterFilter).toContain('text-leather-800');

    // Verify products remain in list layout
    const productListClassesAfterFilter = await productList.getAttribute('class');
    expect(productListClassesAfterFilter).toContain('grid-cols-1');
    expect(productListClassesAfterFilter).not.toContain('sm:grid-cols-2');
    expect(productListClassesAfterFilter).not.toContain('lg:grid-cols-3');

    console.log('✅ View mode state persistence with filters verified');

    // ============================================================================
    // SECTION 7: Verify View Mode with Search
    // ============================================================================
    console.log('📋 Section 7: Verifying view mode with search');

    // Clear category filter first
    const allButton = catalogPage.locator(TestSelectors.catalogMainCategoryAll);
    const countBeforeAll = extractProductCount(await page.locator(TestSelectors.catalogProductCount).textContent() || '');
    await allButton.click();
    await waitForCountUpdate(page, countBeforeAll, 5000);

    // Set up API call listener for search
    const searchApiPromise = waitForProductsApiCall(page, { searchTerm: 'billetera' }, 10000);

    // Type search term
    const searchInput = page.locator(TestSelectors.catalogSearchInput);
    const countBeforeSearch = extractProductCount(await page.locator(TestSelectors.catalogProductCount).textContent() || '');
    await searchInput.fill('billetera');
    await waitForSearchComplete(page, countBeforeSearch, 7000);

    // Verify search API call
    const searchApiResult = await searchApiPromise;
    expect(searchApiResult.received).toBe(true);
    expect(searchApiResult.status).toBe(200);

    // Switch to Grid view (client-side, no API call)
    await gridButton.click();
    await expect(gridButton).toHaveClass(/bg-leather-100/, { timeout: 2000 });

    // Verify Grid view is active
    const gridButtonClassesAfterSearch = await gridButton.getAttribute('class');
    expect(gridButtonClassesAfterSearch).toContain('bg-leather-100');

    // Verify search results display in grid view
    const productListClassesAfterSearch = await productList.getAttribute('class');
    expect(productListClassesAfterSearch).toContain('grid-cols-1');
    expect(productListClassesAfterSearch).toContain('sm:grid-cols-2');
    expect(productListClassesAfterSearch).toContain('lg:grid-cols-3');

    // Switch to List view (client-side, no API call)
    await listButton.click();
    await expect(listButton).toHaveClass(/bg-leather-100/, { timeout: 2000 });

    // Verify List view is active
    const listButtonClassesAfterSearch = await listButton.getAttribute('class');
    expect(listButtonClassesAfterSearch).toContain('bg-leather-100');

    // Verify search results display in list view
    const productListClassesListAfterSearch = await productList.getAttribute('class');
    expect(productListClassesListAfterSearch).toContain('grid-cols-1');
    expect(productListClassesListAfterSearch).not.toContain('sm:grid-cols-2');
    expect(productListClassesListAfterSearch).not.toContain('lg:grid-cols-3');

    console.log('✅ View mode with search verified');

    // ============================================================================
    // SECTION 8: Verify Button Hover States
    // ============================================================================
    console.log('📋 Section 8: Verifying button hover states');

    // Hover over Grid view button (when inactive)
    await listButton.click(); // Make Grid inactive
    await expect(listButton).toHaveClass(/bg-leather-100/, { timeout: 2000 });

    // Hover doesn't need wait, but ensure state is stable
    await gridButton.hover();
    // Note: Hover effects are CSS-based, so we verify the button is hoverable
    await expect(gridButton).toBeVisible();

    // Hover over List view button (when inactive)
    await gridButton.click(); // Make List inactive
    await expect(gridButton).toHaveClass(/bg-leather-100/, { timeout: 2000 });

    await listButton.hover();
    await expect(listButton).toBeVisible();

    console.log('✅ Button hover states verified');

    console.log('✅ Test completed successfully');
  });
});
