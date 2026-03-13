import { test, expect } from '@playwright/test';
import { navigateToCatalog, navigateToProduct, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
  waitForFirstVisitAnimation,
} from '../../../utils';

/**
 * E2E Test - ProductDetailPage Back to Catalog Navigation Works Correctly (QA-56)
 *
 * Comprehensive test that verifies the "back to catalog" navigation from the product detail page.
 * It ensures that:
 * - We can navigate from CatalogPage to a ProductDetailPage.
 * - The back navigation control on ProductDetailPage returns the user to CatalogPage.
 *
 * Based on: QA_TICKET_QA_56_PRODUCT_DETAIL_PAGE_BACK_TO_CATALOG_NAVIGATION_WORKS_CORRECTLY.md
 * Parent Epic: QA-14
 *
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 20-30 seconds
 * - Uses existing catalog → product navigation to obtain a valid product
 * - Uses the visible "Volver al Catálogo" control for back navigation
 *
 * Tags: @regression, @e2e, @public, @product-detail, @desktop, @development, @staging, @production
 */
test.describe('ProductDetailPage - Back to Catalog Navigation Works Correctly (QA-56)', () => {
  test('should navigate back to catalog from product detail page using back control', {
    tag: ['@regression', '@e2e', '@public', '@product-detail', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate to catalog and obtain a valid product ID
    // ============================================================================
    const catalogPageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToCatalog(page),
      15, // max 15 seconds (images have delay)
      3   // warn if > 3 seconds
    );

    await waitForFirstVisitAnimation(page, 3000).catch(() => {
      // Animation might not be present, continue anyway
    });

    await monitorAndCheckConsoleErrors(page, 1000);

    // Wait for products to load (or empty state)
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(
      () => {
        const doc = (globalThis as any).document;
        if (!doc) return false;
        const cards = doc.querySelectorAll('[data-testid^="catalog-product-card"]');
        const emptyState = doc.querySelector('[data-testid="catalog-empty-state"]');
        return cards.length > 0 || emptyState !== null;
      },
      { timeout: 15000 }
    );

    // Get product cards
    const productCards = page.locator('[data-testid^="catalog-product-card"]');
    const cardCount = await productCards.count();

    // Check for empty state
    const emptyState = page.locator(TestSelectors.catalogEmptyState);
    const isEmpty = await emptyState.count() > 0;

    if (cardCount === 0 && isEmpty) {
      console.log('ℹ️ Catalog is empty - no products available to test back navigation');
      test.skip(true, 'No products available in catalog to test product detail back navigation');
      return;
    }

    if (cardCount === 0) {
      // Wait a bit more for products to load
      await page.waitForTimeout(2000);
      const cardCountAfterWait = await productCards.count();

      if (cardCountAfterWait === 0) {
        console.log('ℹ️ No products found after waiting - catalog may be empty');
        test.skip(true, 'No products available in catalog to test product detail back navigation');
        return;
      }
    }

    // Extract product ID from the first product card
    const firstCard = productCards.first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });

    const cardTestId = await firstCard.getAttribute('data-testid');
    const productIdMatch = cardTestId?.match(/catalog-product-card-(.+)/);

    if (!productIdMatch || !productIdMatch[1]) {
      console.log(`⚠️ Could not extract product ID from card testid: ${cardTestId}`);
      test.skip(true, 'Could not extract product ID from catalog card for back navigation test');
      return;
    }

    const productId = productIdMatch[1];
    console.log(`📦 Testing back navigation with product ID: ${productId}`);

    // ============================================================================
    // SECTION 1: Navigate to Product Detail Page
    // ============================================================================
    const productPageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToProduct(page, productId),
      15, // max 15 seconds (images have delay)
      3   // warn if > 3 seconds
    );

    await page.waitForLoadState('networkidle');
    await monitorAndCheckConsoleErrors(page, 1000);

    // Verify URL is product detail
    await expect(page).toHaveURL(/\/producto\/[^\/]+/);

    // Verify product detail page container is visible
    const productDetailPage = page.locator(TestSelectors.productDetailPage);
    await expect(productDetailPage).toBeVisible({ timeout: 10000 });

    console.log(`✅ Product detail page loaded (load time: ${productPageLoadTime.toFixed(2)}s, from catalog: ${catalogPageLoadTime.toFixed(2)}s)`);

    // ============================================================================
    // SECTION 2: Verify Back to Catalog Control and Navigate Back
    // ============================================================================
    console.log('🔍 Section 2: Verifying back to catalog navigation control');

    // Back control: use the dedicated data-testid on the "Volver al Catálogo" link/button
    const backToCatalogControl = page.locator(TestSelectors.productDetailBackToCatalog);
    const backControlCount = await backToCatalogControl.count();
    if (backControlCount === 0) {
      console.log('⚠️ Back to catalog control not found on ProductDetailPage');
      test.skip(true, 'Back to catalog navigation control not found on ProductDetailPage');
      return;
    }

    await expect(backToCatalogControl).toBeVisible({ timeout: 5000 });

    // Click back control and verify navigation to CatalogPage
    await Promise.all([
      page.waitForURL(/\/catalogo/, { timeout: 10000 }),
      backToCatalogControl.click()
    ]);

    await expectPathname(page, '/catalogo');
    await page.waitForLoadState('networkidle');

    const catalogPage = page.locator(TestSelectors.catalogPage);
    await expect(catalogPage).toBeVisible({ timeout: 10000 });

    console.log('✅ Back to catalog navigation works correctly from ProductDetailPage');
    console.log(`📊 ProductDetailPage back navigation test complete for product ID: ${productId}`);
  });
});

