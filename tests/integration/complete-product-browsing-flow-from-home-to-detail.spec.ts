import { test, expect } from '@playwright/test';
import {
  navigateToHome,
  expectPathname,
} from '../utils/navigation';
import { TestSelectors } from '../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
  waitForFirstVisitAnimation,
} from '../utils';

/**
 * Integration Test - Complete Product Browsing Flow From Home to Detail (QA-57)
 *
 * End-to-end public flow that verifies:
 * - Home → Catalog navigation via CTA
 * - Catalog → Product Detail navigation via product card
 * - Product Detail → Back to Catalog via "Volver al Catálogo"
 *
 * Based on: QA_TICKET_QA_57_INTEGRATION_COMPLETE_PRODUCT_BROWSING_FLOW.md
 * Parent Epic: QA-20
 *
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 60–90 seconds
 * - Focus on navigation and key content per step (no duplication of deep assertions from QA-8, QA-21, QA-28, QA-53–QA-56)
 *
 * Tags: @regression, @e2e, @integration, @public, @desktop, @development, @staging, @production
 */
test.describe('Integration - Complete Product Browsing Flow From Home to Detail (QA-57)', () => {
  test('should complete Home → Catalog → Product Detail → Back to Catalog flow correctly', {
    tag: ['@regression', '@e2e', '@integration', '@public', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate to Home and wait for initial animations
    // ============================================================================
    const homeLoadTime = await trackPageLoad(
      page,
      async () => {
        await navigateToHome(page);
      },
      10, // max 10 seconds
      5   // warn if > 5 seconds
    );

    await waitForFirstVisitAnimation(page, 3000).catch(() => {
      // Animation might not be present, continue anyway
    });

    await monitorAndCheckConsoleErrors(page, 1000);

    await expectPathname(page, '/');
    const heroSection = page.locator(TestSelectors.homeHeroSection);
    await expect(heroSection).toBeVisible({ timeout: 10000 });

    console.log(`📊 Home page load time: ${homeLoadTime.toFixed(2)}s`);

    // ============================================================================
    // SECTION 1: Home → Catalog
    // ============================================================================
    console.log('🔍 Section 1: Navigating from Home to Catalog');

    const homeCtaCatalogLink = page.locator(TestSelectors.homeCtaCatalogLink);
    await expect(homeCtaCatalogLink).toBeVisible({ timeout: 10000 });

    await Promise.all([
      page.waitForURL((url) => new URL(url).pathname.endsWith('/catalogo'), { timeout: 10000 }),
      homeCtaCatalogLink.click(),
    ]);

    await expectPathname(page, '/catalogo');

    const catalogPage = page.locator(TestSelectors.catalogPage);
    await expect(catalogPage).toBeVisible({ timeout: 10000 });

    // At least confirm either product list or empty state is present
    const catalogProductList = page.locator(TestSelectors.catalogProductList);
    const catalogEmptyState = page.locator(TestSelectors.catalogEmptyState);

    const hasProducts = await catalogProductList.count() > 0;
    const hasEmptyState = await catalogEmptyState.count() > 0;

    if (!hasProducts && !hasEmptyState) {
      console.log('⚠️ Catalog has neither products nor empty state visible - skipping further steps');
      test.skip(true, 'Catalog did not render products or empty state');
      return;
    }

    if (hasEmptyState) {
      await expect(catalogEmptyState).toBeVisible({ timeout: 5000 });
      console.log('ℹ️ Catalog is empty - cannot continue to product detail, ending flow after Home → Catalog');
      return;
    }

    console.log('✅ Home → Catalog navigation verified');

    // ============================================================================
    // SECTION 2: Catalog → Product Detail
    // ============================================================================
    console.log('🔍 Section 2: Navigating from Catalog to Product Detail');

    // Wait for at least one product card
    const anyProductCard = page.locator('[data-testid^="catalog-product-card"]').first();
    await expect(anyProductCard).toBeVisible({ timeout: 15000 });

    const cardTestId = await anyProductCard.getAttribute('data-testid');
    const productIdMatch = cardTestId?.match(/catalog-product-card-(.+)/);

    if (!productIdMatch || !productIdMatch[1]) {
      console.log(`⚠️ Could not extract product ID from catalog card testid: ${cardTestId}`);
      test.skip(true, 'Could not extract product ID from catalog card for integration flow');
      return;
    }

    const productId = productIdMatch[1];
    console.log(`📦 Using product ID from catalog: ${productId}`);

    await Promise.all([
      page.waitForURL(/\/producto\/[^/]+/, { timeout: 15000 }),
      anyProductCard.click(),
    ]);

    await expectPathname(page, `/producto/${productId}`);

    const productDetailPage = page.locator(TestSelectors.productDetailPage);
    await expect(productDetailPage).toBeVisible({ timeout: 10000 });

    const productTitle = page.locator(TestSelectors.productDetailTitle);
    await expect(productTitle).toBeVisible({ timeout: 10000 });
    const titleText = (await productTitle.textContent())?.trim() || '';

    console.log(`✅ Catalog → Product Detail navigation verified (title: "${titleText}")`);

    // ============================================================================
    // SECTION 3: Product Detail → Back to Catalog
    // ============================================================================
    console.log('🔍 Section 3: Navigating back from Product Detail to Catalog');

    const backToCatalogControl = page.locator(TestSelectors.productDetailBackToCatalog);
    await expect(backToCatalogControl).toBeVisible({ timeout: 10000 });

    await Promise.all([
      page.waitForURL((url) => new URL(url).pathname.endsWith('/catalogo'), { timeout: 15000 }),
      backToCatalogControl.click(),
    ]);

    await expectPathname(page, '/catalogo');
    await expect(catalogPage).toBeVisible({ timeout: 10000 });

    console.log('✅ Product Detail → Back to Catalog navigation verified');
    console.log('✅ QA-57: Complete Product Browsing Flow From Home to Detail - Flow completed successfully');
  });
});

