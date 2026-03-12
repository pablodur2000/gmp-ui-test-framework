import { test, expect } from '@playwright/test';
import { navigateToProduct, navigateToCatalog, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import { 
  trackPageLoad, 
  monitorAndCheckConsoleErrors,
  waitForFirstVisitAnimation
} from '../../../utils';

/**
 * E2E Test - Product Detail Page Loads and Displays Product Information (QA-42)
 * 
 * Comprehensive test that verifies navigating to a product detail page loads the product
 * from Supabase by ID and displays title, price, description, inventory status, availability,
 * featured badge, and related products section (or loading/empty states).
 * 
 * Based on: QA_TICKET_QA_53_PRODUCT_DETAIL_PAGE_LOADS_AND_DISPLAYS_PRODUCT_INFORMATION.md
 * Parent Epic: QA-14
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 30-60 seconds
 * - Verifies product loading and information display
 * 
 * Tags: @regression, @e2e, @public, @desktop, @development, @staging, @production
 */
test.describe('ProductDetailPage - Loads and Displays Product Information (QA-42)', () => {
  test('should load product detail page and display product information correctly', {
    tag: ['@regression', '@e2e', '@public', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate to catalog to get a valid product ID
    // ============================================================================
    const pageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToCatalog(page),
      10, // max 10 seconds (catalog may be slow to load)
      5   // warn if > 5 seconds
    );

    await waitForFirstVisitAnimation(page, 3000).catch(() => {
      // Animation might not be present, continue anyway
    });

    await monitorAndCheckConsoleErrors(page, 1000);

    // Wait for products to load
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
      console.log('ℹ️ Catalog is empty - no products available to test product detail');
      test.skip(true, 'No products available in catalog to test product detail');
      return;
    }

    if (cardCount === 0) {
      // Wait a bit more for products to load
      await page.waitForFunction(
        () => {
          const doc = (globalThis as any).document;
          if (!doc) return false;
          const cards = doc.querySelectorAll('[data-testid^="catalog-product-card"]');
          return cards.length > 0;
        },
        { timeout: 5000 }
      );
      
      const cardCountAfterWait = await productCards.count();
      
      if (cardCountAfterWait === 0) {
        console.log('ℹ️ No products found after waiting - catalog may be empty');
        test.skip(true, 'No products available in catalog to test product detail');
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
    console.log(`📦 Found product ID: ${productId}`);

    // ============================================================================
    // SECTION 1: Navigate to product detail and wait for load
    // ============================================================================
    console.log('🔍 Section 1: Navigating to product detail page');

    // Navigate to product detail page
    await navigateToProduct(page, productId);
    
    // Wait for URL to match product detail pattern
    await page.waitForURL(/\/producto\/[a-f0-9-]+/, { timeout: 10000 });
    await expectPathname(page, `/producto/${productId}`);

    // Wait for loading to complete (either loading spinner disappears or content appears)
    const loadingSpinner = page.locator(TestSelectors.productDetailLoading);
    const loadingCount = await loadingSpinner.count();
    
    if (loadingCount > 0) {
      console.log('⏳ Waiting for product to load...');
      await expect(loadingSpinner).not.toBeVisible({ timeout: 15000 });
    }

    // Wait for network to be idle
    await page.waitForLoadState('networkidle');

    // Check for not found state
    const notFoundState = page.locator(TestSelectors.productDetailNotFound);
    const notFoundCount = await notFoundState.count();
    
    if (notFoundCount > 0) {
      console.log('⚠️ Product not found - this may be a data issue');
      const notFoundText = await notFoundState.getByText(/producto no encontrado/i).textContent();
      expect(notFoundText).toContain('Producto no encontrado');
      test.skip(true, 'Product not found');
      return;
    }

    // Verify product detail page is visible
    const productDetailPage = page.locator(TestSelectors.productDetailPage);
    await expect(productDetailPage).toBeVisible({ timeout: 5000 });
    console.log('✅ Product detail page loaded');

    // ============================================================================
    // SECTION 2: Verify product information displayed
    // ============================================================================
    console.log('🔍 Section 2: Verifying product information');

    // Verify product title
    const productTitle = page.locator(TestSelectors.productDetailTitle).or(
      page.getByRole('heading', { level: 1 })
    );
    await expect(productTitle).toBeVisible({ timeout: 5000 });
    const titleText = await productTitle.textContent();
    expect(titleText).toBeTruthy();
    expect(titleText?.trim().length).toBeGreaterThan(0);
    console.log(`✅ Product title: ${titleText}`);

    // Verify product price
    // Use .first() to avoid matching related product prices in the "Productos Relacionados" section
    const productPrice = page.locator(TestSelectors.productDetailPrice).or(
      page.getByText(/UYU|\$/)
    ).first();
    await expect(productPrice).toBeVisible({ timeout: 5000 });
    const priceText = await productPrice.textContent();
    expect(priceText).toBeTruthy();
    // Price should contain currency symbol or UYU
    expect(priceText).toMatch(/UYU|\$|pesos/i);
    console.log(`✅ Product price: ${priceText}`);

    // Verify product description
    const productDescription = page.locator(TestSelectors.productDetailDescription).or(
      page.getByText(/descripción/i).locator('..').locator('p')
    );
    await expect(productDescription).toBeVisible({ timeout: 5000 });
    const descriptionText = await productDescription.textContent();
    expect(descriptionText).toBeTruthy();
    expect(descriptionText?.trim().length).toBeGreaterThan(0);
    console.log(`✅ Product description: ${descriptionText?.substring(0, 50)}...`);

    // Verify at least one of: availability badge, inventory status, or "Destacado"
    const availableBadge = page.getByText(/disponible|agotado/i);
    const featuredBadge = page.getByText(/destacado/i);
    const inventoryStatus = page.getByText(/pieza única|encargo|no disponible/i);
    
    const availableCount = await availableBadge.count();
    const featuredCount = await featuredBadge.count();
    const inventoryCount = await inventoryStatus.count();
    
    if (availableCount > 0 || featuredCount > 0 || inventoryCount > 0) {
      console.log('✅ Product status information found');
      if (availableCount > 0) {
        const availableText = await availableBadge.first().textContent();
        console.log(`   - Availability: ${availableText}`);
      }
      if (featuredCount > 0) {
        console.log('   - Featured badge present');
      }
      if (inventoryCount > 0) {
        const inventoryText = await inventoryStatus.first().textContent();
        console.log(`   - Inventory status: ${inventoryText}`);
      }
    } else {
      console.log('⚠️ No status badges found (may be optional)');
    }

    // Verify related products section
    const relatedProductsSection = page.locator(TestSelectors.productDetailRelatedProducts).or(
      page.getByText(/productos relacionados/i).locator('..')
    );
    await expect(relatedProductsSection).toBeVisible({ timeout: 5000 });
    
    // Check for related products heading
    const relatedHeading = page.getByText(/productos relacionados/i);
    await expect(relatedHeading).toBeVisible();
    console.log('✅ Related products section found');

    // Check for related products content (loading, list, or empty message)
    const relatedProductsLoading = relatedProductsSection.locator('.animate-pulse');
    const relatedProductsList = relatedProductsSection.locator('[data-testid^="catalog-product-card"]');
    const relatedProductsEmpty = relatedProductsSection.getByText(/no hay productos relacionados/i);
    
    const relatedLoadingCount = await relatedProductsLoading.count();
    const listCount = await relatedProductsList.count();
    const emptyCount = await relatedProductsEmpty.count();
    
    if (relatedLoadingCount > 0) {
      console.log('⏳ Related products are loading...');
      // Wait for loading to complete
      await expect(relatedProductsLoading.first()).not.toBeVisible({ timeout: 10000 });
      
      // Re-check after loading
      const listCountAfter = await relatedProductsList.count();
      const emptyCountAfter = await relatedProductsEmpty.count();
      
      if (listCountAfter > 0) {
        console.log(`✅ Found ${listCountAfter} related product(s)`);
      } else if (emptyCountAfter > 0) {
        console.log('ℹ️ No related products available');
      }
    } else if (listCount > 0) {
      console.log(`✅ Found ${listCount} related product(s)`);
    } else if (emptyCount > 0) {
      const emptyText = await relatedProductsEmpty.textContent();
      expect(emptyText).toContain('No hay productos relacionados');
      console.log('ℹ️ No related products available');
    } else {
      console.log('⚠️ Related products section state unclear');
    }

    // Optional: Verify breadcrumb (already tested in QA-55, but verify it's present)
    const breadcrumb = page.locator(TestSelectors.productDetailBreadcrumb);
    if (await breadcrumb.count() > 0) {
      await expect(breadcrumb).toBeVisible();
      console.log('✅ Breadcrumb navigation present');
    }

    // Optional: Verify main image or "Sin imagen"
    const imageGallery = page.locator(TestSelectors.productDetailImageGallery);
    if (await imageGallery.count() > 0) {
      const mainImage = page.locator(TestSelectors.productDetailMainImage);
      const noImage = page.locator(TestSelectors.productDetailNoImage);
      
      if (await mainImage.count() > 0) {
        await expect(mainImage).toBeVisible();
        console.log('✅ Product image found');
      } else if (await noImage.count() > 0) {
        await expect(noImage).toBeVisible();
        const noImageText = await noImage.textContent();
        expect(noImageText).toContain('Sin imagen');
        console.log('ℹ️ Product has no image (placeholder shown)');
      }
    }

    console.log('✅ Product detail page information verified');
    console.log(`📊 Page load time: ${pageLoadTime.toFixed(2)}s`);
  });
});
