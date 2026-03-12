import { test, expect } from '@playwright/test';
import { navigateToProduct, navigateToCatalog, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import { 
  trackPageLoad, 
  monitorAndCheckConsoleErrors,
  waitForFirstVisitAnimation
} from '../../../utils';

/**
 * E2E Test - Product Detail Page Breadcrumb Navigation Works Correctly (QA-55)
 * 
 * Comprehensive test that verifies breadcrumb navigation on product detail page.
 * Tests that breadcrumb displays correctly and navigation links work.
 * 
 * Based on: QA_TICKET_QA_55_PRODUCT_DETAIL_PAGE_BREADCRUMB_NAVIGATION_WORKS_CORRECTLY.md
 * Parent Epic: QA-14
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 25-40 seconds
 * - Verifies breadcrumb content and navigation links
 * 
 * Tags: @e2e, @public, @product-detail, @desktop, @development, @staging, @production
 */
test.describe('ProductDetailPage - Breadcrumb Navigation', () => {
  test('should display breadcrumb correctly and navigate to home and catalog', {
    tag: ['@e2e', '@public', '@product-detail', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate to catalog to get a valid product ID
    // ============================================================================
    const pageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToCatalog(page),
      10, // max 10 seconds (images have delay)
      3   // warn if > 3 seconds
    );

    await waitForFirstVisitAnimation(page, 3000).catch(() => {
      // Animation might not be present, continue anyway
    });

    await monitorAndCheckConsoleErrors(page, 1000);

    // Wait for products to load - wait longer and check for both cards and empty state
    await page.waitForLoadState('networkidle');
    
    // Wait for either products or empty state to appear
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

    // Get first product card to extract ID
    const productCards = page.locator('[data-testid^="catalog-product-card"]');
    const cardCount = await productCards.count();

    // Check for empty state
    const emptyState = page.locator(TestSelectors.catalogEmptyState);
    const isEmpty = await emptyState.count() > 0;

    if (cardCount === 0 && isEmpty) {
      console.log('ℹ️ Catalog is empty - no products available to test breadcrumb');
      test.skip(true, 'No products available in catalog to test breadcrumb');
      return;
    }

    if (cardCount === 0) {
      // Wait a bit more for products to load
      await page.waitForTimeout(2000);
      const cardCountAfterWait = await productCards.count();
      
      if (cardCountAfterWait === 0) {
        console.log('ℹ️ No products found after waiting - catalog may be empty');
        test.skip(true, 'No products available in catalog to test breadcrumb');
        return;
      }
    }

    // Get product ID from first card's data-testid
    const firstCard = productCards.first();
    await expect(firstCard).toBeVisible({ timeout: 5000 });
    
    const cardTestId = await firstCard.getAttribute('data-testid');
    // Product IDs can be numeric or UUID format
    const productIdMatch = cardTestId?.match(/catalog-product-card-(.+)/);
    
    if (!productIdMatch || !productIdMatch[1]) {
      console.log(`⚠️ Could not extract product ID from card testid: ${cardTestId}`);
      test.skip(true, 'Could not extract product ID from catalog card');
      return;
    }

    const productId = productIdMatch[1];
    console.log(`📦 Testing breadcrumb with product ID: ${productId}`);

    // ============================================================================
    // SECTION 1: Navigate to Product Detail Page and Verify Breadcrumb Content
    // ============================================================================
    const productPageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToProduct(page, productId),
      10, // max 10 seconds (images have delay)
      3  // warn if > 3 seconds
    );

    await page.waitForLoadState('networkidle');
    await monitorAndCheckConsoleErrors(page, 1000);

    // Verify we're on product detail page (product ID can be numeric or UUID)
    await expect(page).toHaveURL(/\/producto\/[^\/]+/);

    // Get product title for verification
    const productTitle = await page.locator(TestSelectors.productDetailTitle).or(
      page.locator('h1').first()
    ).textContent().catch(() => null);

    if (!productTitle) {
      console.warn('⚠️ Could not get product title, continuing with breadcrumb test');
    }

    // Verify breadcrumb is visible (use specific data-testid to avoid header nav)
    const breadcrumb = page.locator(TestSelectors.productDetailBreadcrumb);
    await expect(breadcrumb).toBeVisible();

    // Verify breadcrumb content: Inicio, Catálogo, and product title
    const inicioLink = breadcrumb.locator(TestSelectors.productDetailBreadcrumbInicio).or(
      breadcrumb.getByRole('link', { name: 'Inicio' })
    );
    await expect(inicioLink).toBeVisible();
    await expect(inicioLink).toHaveText('Inicio');

    const catalogoLink = breadcrumb.locator(TestSelectors.productDetailBreadcrumbCatalogo).or(
      breadcrumb.getByRole('link', { name: 'Catálogo' })
    );
    await expect(catalogoLink).toBeVisible();
    await expect(catalogoLink).toHaveText('Catálogo');

    const currentBreadcrumb = breadcrumb.locator(TestSelectors.productDetailBreadcrumbCurrent).or(
      breadcrumb.locator('span').filter({ hasText: productTitle || '' }).first()
    );
    await expect(currentBreadcrumb).toBeVisible();
    
    if (productTitle) {
      const currentText = await currentBreadcrumb.textContent();
      expect(currentText).toContain(productTitle);
      console.log(`✅ Breadcrumb current page shows: "${currentText}"`);
    }

    // Verify separators are present (visual check)
    const separators = breadcrumb.locator('span').filter({ hasText: '/' });
    const separatorCount = await separators.count();
    expect(separatorCount).toBeGreaterThanOrEqual(2); // At least 2 separators
    console.log(`✅ Breadcrumb structure verified: Inicio / Catálogo / ${productTitle || 'Product'}`);

    // ============================================================================
    // SECTION 2: Inicio Link Navigates to Home
    // ============================================================================
    await Promise.all([
      page.waitForURL(/\/(gmp-web-app\/)?$/, { timeout: 5000 }),
      inicioLink.click()
    ]);

    await expectPathname(page, '/');
    await page.waitForLoadState('networkidle');
    console.log('✅ Inicio link navigated to home page');

    // ============================================================================
    // SECTION 3: Catálogo Link Navigates to Catalog
    // ============================================================================
    // Navigate back to product detail page
    await navigateToProduct(page, productId);
    await page.waitForLoadState('networkidle');

    // Verify breadcrumb is visible again (use specific data-testid to avoid header nav)
    const breadcrumbAgain = page.locator(TestSelectors.productDetailBreadcrumb);
    await expect(breadcrumbAgain).toBeVisible();

    const catalogoLinkAgain = breadcrumbAgain.locator(TestSelectors.productDetailBreadcrumbCatalogo).or(
      breadcrumbAgain.getByRole('link', { name: 'Catálogo' })
    );

    await Promise.all([
      page.waitForURL(/\/catalogo/, { timeout: 5000 }),
      catalogoLinkAgain.click()
    ]);

    await expectPathname(page, '/catalogo');
    await page.waitForLoadState('networkidle');
    console.log('✅ Catálogo link navigated to catalog page');

    console.log(`📊 Product detail page load time: ${productPageLoadTime.toFixed(2)}s`);
  });
});
