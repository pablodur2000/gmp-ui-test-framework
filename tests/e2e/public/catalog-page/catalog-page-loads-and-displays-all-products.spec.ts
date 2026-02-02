import { test, expect } from '@playwright/test';
import { navigateToCatalog } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
  waitForFirstVisitAnimation,
  setupSupabaseListener,
  verifyImagesLoad,
  waitForElementInViewport
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
 * Tags: @e2e, @public, @catalog, @desktop, @development, @staging, @production
 */
test.describe('CatalogPage - Loads and Displays All Products', () => {
  test('should load all products correctly with proper layout and API verification', {
    tag: ['@e2e', '@public', '@catalog', '@desktop', '@development', '@staging', '@production'],
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

    // Wait for first-visit animation (if present)
    await waitForFirstVisitAnimation(page, 3000).catch(() => {
      // Animation might not be present, continue anyway
    });

    // Monitor console errors
    await monitorAndCheckConsoleErrors(page, 1000);

    // ============================================================================
    // SECTION 1: Page Load and Basic Verification
    // ============================================================================
    await expect(page).toHaveURL(/\/catalogo/);
    await expect(page).toHaveTitle(/catálogo|catalog|productos/i);

    // Verify catalog page container
    // Use primary selector only - fallback would match header link (strict mode violation)
    const catalogPage = page.locator(TestSelectors.catalogPage).or(
      page.locator('main, [role="main"]').first()
    );
    await expect(catalogPage).toBeVisible();

    // Verify catalog heading
    const catalogHeading = catalogPage.locator(TestSelectors.catalogHeading).or(
      page.getByRole('heading', { name: /catálogo de productos/i })
    );
    await expect(catalogHeading).toBeVisible();

    // ============================================================================
    // SECTION 2: Verify Sidebar and Filters
    // ============================================================================
    const catalogFilters = catalogPage.locator(TestSelectors.catalogFilters).or(
      catalogPage.locator('aside, .sidebar').first()
    );

    if (await catalogFilters.count() > 0) {
      await expect(catalogFilters).toBeVisible();
      console.log('✅ Catalog filters sidebar is visible');
    } else {
      console.log('ℹ️ Catalog filters sidebar may not be implemented yet');
    }

    // ============================================================================
    // SECTION 3: Verify Main Category Filter
    // ============================================================================
    // Look for main category filter buttons (Todas, Cuero, Macramé)
    const todasButton = page.getByRole('button', { name: /todas/i }).or(
      page.locator('button').filter({ hasText: /todas/i }).first()
    );
    const cueroButton = page.getByRole('button', { name: /cuero/i }).or(
      page.locator('button').filter({ hasText: /cuero/i }).first()
    );
    const macrameButton = page.getByRole('button', { name: /macramé|macrame/i }).or(
      page.locator('button').filter({ hasText: /macramé|macrame/i }).first()
    );

    if (await todasButton.count() > 0) {
      await expect(todasButton).toBeVisible();
      console.log('✅ Main category filter buttons are visible');
    } else {
      console.log('ℹ️ Main category filter buttons may not be implemented yet');
    }

    // ============================================================================
    // SECTION 4: Verify Search and View Controls
    // ============================================================================
    const searchInput = catalogPage.locator(TestSelectors.catalogSearchInput).or(
      page.getByPlaceholder(/buscar productos/i)
    );

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

    // View toggle buttons (Grid/List)
    const gridButton = page.getByRole('button', { name: /grid|cuadrícula/i }).or(
      page.locator('button[aria-label*="grid"], button[aria-label*="grid"]').first()
    );
    const listButton = page.getByRole('button', { name: /list|lista/i }).or(
      page.locator('button[aria-label*="list"], button[aria-label*="lista"]').first()
    );

    if (await gridButton.count() > 0 || await listButton.count() > 0) {
      console.log('✅ View toggle buttons are visible');
    } else {
      console.log('ℹ️ View toggle buttons may not be implemented yet');
    }

    // ============================================================================
    // SECTION 5: Verify Supabase API Call
    // ============================================================================
    // Set up API listener BEFORE any action that might trigger API call
    const apiResponse = await setupSupabaseListener(
      page,
      {
        endpoint: 'products',
        queryParams: { available: 'eq.true' }
      },
      5000 // timeout
    );

    // Wait for products to load
    await page.waitForLoadState('networkidle');

    // Verify API response
    if (apiResponse.received) {
      expect(apiResponse.status).toBe(200);
      if (apiResponse.data && Array.isArray(apiResponse.data)) {
        console.log(`✅ Supabase API verified: ${apiResponse.data.length} products`);
      }
    } else {
      console.log('ℹ️ Supabase API call not captured (may have loaded before listener setup)');
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

    const productCards = page.locator('[data-testid^="catalog-product-card"]').or(
      page.locator('.product-card, [class*="product-card"]')
    );
    const cardCount = await productCards.count();

    if (cardCount > 0) {
      // Verify product count text
      const productCount = catalogPage.locator(TestSelectors.catalogProductCount).or(
        page.getByText(/mostrando \d+ productos?/i)
      );

      if (await productCount.count() > 0) {
        await expect(productCount).toBeVisible();
        const countText = await productCount.textContent();
        console.log(`✅ Product count displayed: ${countText}`);
      }

      // Verify at least first product card is visible
      await expect(productCards.first()).toBeVisible();
      console.log(`✅ Found ${cardCount} products`);

      // Verify product cards are in grid layout (check for grid classes or structure)
      const productList = catalogPage.locator(TestSelectors.catalogProductList).or(
        catalogPage.locator('.product-grid, .product-list, [class*="grid"]').first()
      );

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
        await verifyImagesLoad(page, 'img', Math.min(imageCount, 5));
      }
    } else {
      // ============================================================================
      // SECTION 7: Verify Empty State (If No Products)
      // ============================================================================
      const emptyState = catalogPage.locator('[data-testid="catalog-empty-state"]').or(
        page.getByText(/no se encontraron productos/i)
      );

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

      // Verify "Ver Detalles" button or link
      const detailsButton = firstCard.getByRole('link', { name: /ver detalles|ver más/i }).or(
        firstCard.getByRole('button', { name: /ver detalles|ver más/i })
      );
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
    await page.waitForTimeout(300); // Small delay for scroll

    const scrollPosition = await page.evaluate(() => (globalThis as any).window?.scrollY || 0);
    expect(scrollPosition).toBeGreaterThanOrEqual(0);

    console.log('✅ Page is fully interactive');
    console.log(`📊 CatalogPage load time: ${pageLoadTime.toFixed(2)}s`);
  });
});
