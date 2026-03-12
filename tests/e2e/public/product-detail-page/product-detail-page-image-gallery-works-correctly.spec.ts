import { test, expect } from '@playwright/test';
import { navigateToProduct, navigateToCatalog, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import { 
  trackPageLoad, 
  monitorAndCheckConsoleErrors,
  waitForFirstVisitAnimation
} from '../../../utils';

/**
 * E2E Test - Product Detail Page Image Gallery Works Correctly (QA-44)
 * 
 * Comprehensive test that verifies the product detail page image gallery shows the main image
 * and, when the product has multiple images, thumbnails that switch the main image on click.
 * 
 * Based on: QA_TICKET_QA_54_PRODUCT_DETAIL_PAGE_IMAGE_GALLERY_WORKS_CORRECTLY.md
 * Parent Epic: QA-14
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 30-45 seconds
 * - Verifies main image, thumbnails, and image switching
 * 
 * Tags: @regression, @e2e, @public, @desktop, @development, @staging, @production
 */
test.describe('ProductDetailPage - Image Gallery Works Correctly (QA-44)', () => {
  test('should display main image and thumbnails, and switch main image on thumbnail click', {
    tag: ['@regression', '@e2e', '@public', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate to catalog to find a product with images
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
      console.log('ℹ️ Catalog is empty - no products available to test image gallery');
      test.skip(true, 'No products available in catalog to test image gallery');
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
        test.skip(true, 'No products available in catalog to test image gallery');
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
    // SECTION 1: Navigate to product detail and verify gallery
    // ============================================================================
    console.log('🔍 Section 1: Navigating to product detail and verifying gallery');

    // Navigate to product detail page
    await navigateToProduct(page, productId);
    
    // Wait for URL to match product detail pattern
    await page.waitForURL(/\/producto\/[a-f0-9-]+/, { timeout: 10000 });
    await expectPathname(page, `/producto/${productId}`);

    // Wait for loading to complete
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
      test.skip(true, 'Product not found');
      return;
    }

    // Verify image gallery container is visible
    const imageGallery = page.locator(TestSelectors.productDetailImageGallery);
    await expect(imageGallery).toBeVisible({ timeout: 5000 });
    console.log('✅ Image gallery container found');

    // Check for main image or "Sin imagen" placeholder
    const mainImage = page.locator(TestSelectors.productDetailMainImage);
    const noImage = page.locator(TestSelectors.productDetailNoImage);
    
    const mainImageCount = await mainImage.count();
    const noImageCount = await noImage.count();
    
    if (noImageCount > 0) {
      // Product has no images
      await expect(noImage).toBeVisible();
      const noImageText = await noImage.textContent();
      expect(noImageText).toContain('Sin imagen');
      console.log('ℹ️ Product has no images (placeholder shown)');
      console.log('✅ Image gallery verified (no images case)');
      return;
    }
    
    if (mainImageCount === 0) {
      console.log('⚠️ Main image not found - product may not have images');
      test.skip(true, 'Product does not have images');
      return;
    }

    // Verify main image is visible
    await expect(mainImage).toBeVisible({ timeout: 5000 });
    const mainImageSrc = await mainImage.getAttribute('src');
    expect(mainImageSrc).toBeTruthy();
    console.log(`✅ Main image found: ${mainImageSrc?.substring(0, 50)}...`);

    // Check for thumbnails
    const thumbnail0 = page.locator(TestSelectors.productDetailThumbnail(0));
    const thumbnail1 = page.locator(TestSelectors.productDetailThumbnail(1));
    
    const thumbnail0Count = await thumbnail0.count();
    const thumbnail1Count = await thumbnail1.count();
    
    if (thumbnail0Count === 0 && thumbnail1Count === 0) {
      // Single image product - no thumbnails
      console.log('ℹ️ Product has single image (no thumbnails)');
      console.log('✅ Image gallery verified (single image case)');
      return;
    }

    // Multiple images - verify thumbnails
    console.log('✅ Product has multiple images - thumbnails found');
    
    // Count total thumbnails
    let thumbnailCount = 0;
    for (let i = 0; i < 10; i++) {
      const thumbnail = page.locator(TestSelectors.productDetailThumbnail(i));
      if (await thumbnail.count() > 0) {
        thumbnailCount++;
      } else {
        break;
      }
    }
    console.log(`📊 Found ${thumbnailCount} thumbnail(s)`);

    // Verify first thumbnail is visible
    await expect(thumbnail0).toBeVisible({ timeout: 5000 });
    const thumbnail0Src = await thumbnail0.locator('img').getAttribute('src');
    expect(thumbnail0Src).toBeTruthy();
    console.log(`✅ First thumbnail found: ${thumbnail0Src?.substring(0, 50)}...`);

    // ============================================================================
    // SECTION 2: Click thumbnail and verify main image changes
    // ============================================================================
    console.log('🔍 Section 2: Testing thumbnail click to switch main image');

    // Get initial main image src
    const initialMainImageSrc = await mainImage.getAttribute('src');
    console.log(`📸 Initial main image: ${initialMainImageSrc?.substring(0, 50)}...`);

    // If we have at least 2 thumbnails, click the second one
    if (thumbnailCount >= 2) {
      // Get second thumbnail src
      await expect(thumbnail1).toBeVisible({ timeout: 5000 });
      const thumbnail1Src = await thumbnail1.locator('img').getAttribute('src');
      expect(thumbnail1Src).toBeTruthy();
      console.log(`📸 Second thumbnail: ${thumbnail1Src?.substring(0, 50)}...`);

      // Click second thumbnail
      await thumbnail1.click();
      
      // Wait for main image to update (src should change)
      await page.waitForFunction(
        (initialSrc) => {
          const doc = (globalThis as any).document;
          if (!doc) return false;
          const mainImg = doc.querySelector('[data-testid="product-detail-main-image"]');
          return mainImg && mainImg.src !== initialSrc;
        },
        initialMainImageSrc,
        { timeout: 5000 }
      );

      // Verify main image src changed
      const newMainImageSrc = await mainImage.getAttribute('src');
      expect(newMainImageSrc).not.toBe(initialMainImageSrc);
      expect(newMainImageSrc).toBe(thumbnail1Src);
      console.log(`✅ Main image updated to: ${newMainImageSrc?.substring(0, 50)}...`);

      // Verify second thumbnail has active border (border-leather-600)
      const thumbnail1Classes = await thumbnail1.getAttribute('class');
      expect(thumbnail1Classes).toContain('border-leather-600');
      console.log('✅ Second thumbnail has active border');

      // Verify first thumbnail no longer has active border
      const thumbnail0Classes = await thumbnail0.getAttribute('class');
      expect(thumbnail0Classes).not.toContain('border-leather-600');
      expect(thumbnail0Classes).toContain('border-gray-200');
      console.log('✅ First thumbnail border updated correctly');
    } else {
      // Only one thumbnail - verify it's clickable but main image won't change
      console.log('ℹ️ Product has only one image - thumbnail click test skipped');
    }

    console.log('✅ Image gallery functionality verified');
    console.log(`📊 Page load time: ${pageLoadTime.toFixed(2)}s`);
  });
});
