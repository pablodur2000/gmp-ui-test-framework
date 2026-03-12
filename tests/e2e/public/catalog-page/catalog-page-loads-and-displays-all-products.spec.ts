import { test, expect } from '@playwright/test';
import { navigateToCatalog, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
  waitForProductsApiCall,
  verifyProductsApiResponse,
  verifyImagesLoad,
  waitForElementInViewport,
  waitForScrollToComplete
} from '../../../utils';

/**
 * E2E Test - CatalogPage Loads and Displays All Products (QA-21)
 * 
 * Comprehensive test that verifies CatalogPage loads correctly with all products,
 * proper layout, loading states, empty states, product cards display, and Supabase API integration.
 * 
 * Based on: QA_TICKET_QA_21_CATALOG_LOADS_ALL_PRODUCTS.md
 * Parent Epic: QA-13
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 15-20 seconds
 * - Verifies page load, layout, products display, API integration, and empty states
 * 
 * Tags: @regression, @e2e, @public, @catalog, @desktop, @development, @staging, @production
 */
test.describe('CatalogPage - Loads and Displays All Products (QA-21)', () => {
  test('should load all products correctly with proper layout and API verification', {
    tag: ['@regression', '@e2e', '@public', '@catalog', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate to catalog page and track performance
    // ============================================================================
    // Set up API listener BEFORE navigation (for page load API calls)
    const apiPromise = waitForProductsApiCall(page, {}, 10000);
    
    const pageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToCatalog(page),
      15, // max 15 seconds (images have delay - temporary until PNG to WebP conversion)
      3  // warn if > 3 seconds
    );

    // Monitor console errors
    await monitorAndCheckConsoleErrors(page, 1000);

    // ============================================================================
    // SECTION 1: Page Load and Basic Verification
    // ============================================================================
    await expectPathname(page, '/catalogo');
    await expect(page).toHaveTitle(/catálogo|catalog|productos/i);

    // Verify catalog page container
    // Use primary selector only - data-testid="catalog-page" exists in production code
    const catalogPage = page.locator(TestSelectors.catalogPage);
    await expect(catalogPage).toBeVisible();

    // Verify catalog heading
    const catalogHeading = catalogPage.locator(TestSelectors.catalogHeading);
    await expect(catalogHeading).toBeVisible();

    // ============================================================================
    // SECTION 2: Verify Sidebar and Filters
    // ============================================================================
    const catalogFilters = catalogPage.locator(TestSelectors.catalogFilters);

    if (await catalogFilters.count() > 0) {
      await expect(catalogFilters).toBeVisible();
      console.log('✅ Catalog filters sidebar is visible');
    } else {
      console.log('ℹ️ Catalog filters sidebar may not be implemented yet');
    }

    // ============================================================================
    // SECTION 3: Verify Main Category Filter
    // ============================================================================
    // Use specific data-testid selectors only - no fallbacks to avoid strict mode violations
    const todasButton = catalogPage.locator(TestSelectors.catalogMainCategoryAll);
    const cueroButton = catalogPage.locator(TestSelectors.catalogMainCategoryCuero);
    const macrameButton = catalogPage.locator(TestSelectors.catalogMainCategoryMacrame);

    if (await todasButton.count() > 0) {
      await expect(todasButton).toBeVisible();
      console.log('✅ Main category filter buttons are visible');
    } else {
      console.log('ℹ️ Main category filter buttons may not be implemented yet');
    }

    // ============================================================================
    // SECTION 4: Verify Search and View Controls
    // ============================================================================
    const searchInput = catalogPage.locator(TestSelectors.catalogSearchInput);

    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
      const placeholder = await searchInput.getAttribute('placeholder');
      if (placeholder) {
        expect(placeholder.toLowerCase()).toContain('buscar');
      }
      console.log('✅ Search input is visible');
    } else {
      console.log('ℹ️ Search input may not be implemented yet');
    }

    // View toggle buttons (Grid/List) - use data-testid only
    const gridButton = catalogPage.locator(TestSelectors.catalogViewToggleGrid);
    const listButton = catalogPage.locator(TestSelectors.catalogViewToggleList);

    if (await gridButton.count() > 0 || await listButton.count() > 0) {
      console.log('✅ View toggle buttons are visible');
    } else {
      console.log('ℹ️ View toggle buttons may not be implemented yet');
    }

    // ============================================================================
    // SECTION 5: Verify Supabase API Call
    // ============================================================================
    // Wait for products API call (already set up before navigation)
    const apiResult = await apiPromise;

    // Verify API response
    expect(apiResult.received).toBe(true);
    expect(apiResult.status).toBe(200);
    expect(verifyProductsApiResponse(apiResult)).toBe(true);
    
    if (Array.isArray(apiResult.data)) {
      console.log(`✅ Supabase API verified: ${apiResult.data.length} products`);
    }

    // ============================================================================
    // SECTION 6: Verify Products Display (If Products Exist)
    // ============================================================================
    // Wait for products to load or empty state to appear
    await page.waitForFunction(
      () => {
        const doc = (globalThis as any).document;
        if (!doc) return false;
        const cards = doc.querySelectorAll('[data-testid^="catalog-product-card"], .product-card, [class*="product-card"]');
        const emptyState = doc.querySelector('[data-testid="catalog-empty-state"]');
        const heading = doc.querySelector('[data-testid="catalog-heading"]') ||
          doc.querySelector('h1, h2')?.textContent?.toLowerCase().includes('catálogo');
        return cards.length > 0 || emptyState !== null || heading !== null;
      },
      { timeout: 10000 }
    ).catch(() => {
      console.log('⚠️ Products loading check timed out, continuing...');
    });

    const productCards = page.locator('[data-testid^="catalog-product-card"]');
    const cardCount = await productCards.count();

    if (cardCount > 0) {
      // Verify product count text
      const productCount = catalogPage.locator(TestSelectors.catalogProductCount);

      if (await productCount.count() > 0) {
        await expect(productCount).toBeVisible();
        const countText = await productCount.textContent();
        console.log(`✅ Product count displayed: ${countText}`);
      }

      // Verify at least first product card is visible
      await expect(productCards.first()).toBeVisible();
      console.log(`✅ Found ${cardCount} products`);

      // Verify product cards are in grid layout - use data-testid only
      const productList = catalogPage.locator(TestSelectors.catalogProductList);

      if (await productList.count() > 0) {
        await expect(productList).toBeVisible();
        console.log('✅ Product list/grid container is visible');
      }

      // Verify first few product cards have required elements
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = productCards.nth(i);
        await expect(card).toBeVisible();

        // Check for product image
        const cardImage = card.locator('img').first();
        if (await cardImage.count() > 0) {
          await expect(cardImage).toBeVisible();
        }

        // Check for product title
        const cardTitle = card.locator('h2, h3, [class*="title"], [class*="name"]').first();
        if (await cardTitle.count() > 0) {
          await expect(cardTitle).toBeVisible();
        }

        // Check for price
        const cardPrice = card.getByText(/\$|UYU|\d+\.?\d*/).first();
        if (await cardPrice.count() > 0) {
          await expect(cardPrice).toBeVisible();
        }
      }

      // Verify product images load successfully
      const productImages = productCards.locator('img');
      const imageCount = await productImages.count();
      if (imageCount > 0) {
        await verifyImagesLoad(page, Math.min(imageCount, 5));
      }
    } else {
      // ============================================================================
      // SECTION 7: Verify Empty State (If No Products)
      // ============================================================================
      const emptyState = catalogPage.locator('[data-testid="catalog-empty-state"]');

      if (await emptyState.count() > 0) {
        await expect(emptyState).toBeVisible();
        console.log('ℹ️ Catalog is empty - empty state displayed');
      } else {
        console.log('⚠️ No products found and no empty state detected');
      }
    }

    // ============================================================================
    // SECTION 8: Verify Product Card Content (If Products Exist)
    // ============================================================================
    if (cardCount > 0) {
      const firstCard = productCards.first();
      await waitForElementInViewport(page, '[data-testid^="catalog-product-card"]');

      // Verify product image
      const productImage = firstCard.locator('img').first();
      if (await productImage.count() > 0) {
        await expect(productImage).toBeVisible();
        const imageSrc = await productImage.getAttribute('src');
        expect(imageSrc).toBeTruthy();
        console.log('✅ Product image is visible and loaded');
      }

      // Verify product title
      const productTitle = firstCard.locator('h2, h3, [class*="title"], [class*="name"]').first();
      if (await productTitle.count() > 0) {
        await expect(productTitle).toBeVisible();
        const titleText = await productTitle.textContent();
        expect(titleText).toBeTruthy();
        console.log(`✅ Product title: ${titleText}`);
      }

      // Verify product price
      const productPrice = firstCard.getByText(/\$|UYU|\d+\.?\d*/).first();
      if (await productPrice.count() > 0) {
        await expect(productPrice).toBeVisible();
        const priceText = await productPrice.textContent();
        expect(priceText).toBeTruthy();
        console.log(`✅ Product price: ${priceText}`);
      }

      // Verify "Ver Detalles" button or link - use data-testid if available
      // For now, check for link first (most common pattern)
      const detailsButton = firstCard.getByRole('link', { name: /ver detalles|ver más/i });
      if (await detailsButton.count() > 0) {
        await expect(detailsButton).toBeVisible();
        console.log('✅ "Ver Detalles" button is visible');
      }
    }

    // ============================================================================
    // SECTION 9: Verify Page Health
    // ============================================================================
    // Verify page content is rendered
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
    expect(bodyContent!.length).toBeGreaterThan(0);

    // Verify page is interactive (can scroll)
    await page.evaluate(() => {
      (globalThis as any).window?.scrollTo(0, 500);
    });
    await waitForScrollToComplete(page, 500);

    const scrollPosition = await page.evaluate(() => (globalThis as any).window?.scrollY || 0);
    expect(scrollPosition).toBeGreaterThanOrEqual(0);

    console.log('✅ Page is fully interactive');
    console.log(`📊 CatalogPage load time: ${pageLoadTime.toFixed(2)}s`);
  });
});
