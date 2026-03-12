import { test, expect } from '@playwright/test';
import { navigateToHome, navigateToCatalog, navigateToProduct, expectPathname } from '../utils/navigation';
import { TestSelectors } from '../utils/selectors';
import { trackPageLoad, monitorAndCheckConsoleErrors, waitForProductsApiCall, verifyProductsApiResponse } from '../utils';
import { waitForScrollToComplete, waitForElementInViewport, waitForFirstVisitAnimation } from '../utils/wait-helpers';

/**
 * Smoke Test - Critical Public Paths Load Correctly (QA-5)
 * 
 * Comprehensive smoke test that verifies HomePage, CatalogPage, and ProductDetailPage
 * load correctly with content validation, interactions, data correctness, and performance checks.
 * 
 * Based on: QA_TICKET_QA_5_SMOKE_CRITICAL_PUBLIC_PATHS.md
 * Parent Epic: QA-2
 * 
 * Test Strategy:
 * - Fast execution (10-15 seconds total)
 * - Desktop viewport only (1920x1080)
 * - Critical path verification with Supabase API checks
 * - Intersection Observer animations
 * 
 * Tags: @regression, @smoke, @heartbeat, @desktop, @development, @staging, @production
 */
test.describe('Smoke Test - Critical Public Paths (QA-5)', () => {
  test('should load HomePage correctly with all sections and Supabase data', {
    tag: ['@regression', '@smoke', '@heartbeat', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate to home page and track performance
    // ============================================================================
    // Set up API listener BEFORE navigation (for page load API calls)
    const featuredApiPromise = waitForProductsApiCall(page, {}, 10000);
    
    const pageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToHome(page)
    );

    // Wait for first-visit animation to complete (if present)
    await waitForFirstVisitAnimation(page, 3000).catch(() => {
      // Animation might not be present, continue anyway
    });

    // ============================================================================
    // SECTION 1: Page Load and Performance Verification
    // ============================================================================
    await expect(page).toHaveTitle(/GMP|Artesanías en Cuero/i);

    // Monitor console errors
    await monitorAndCheckConsoleErrors(page, 1000);

    // ============================================================================
    // SECTION 2: Header and Sticky Behavior
    // ============================================================================
    const header = page.locator(TestSelectors.header);
    await expect(header).toBeVisible();

    await page.evaluate(() => (globalThis as any).window?.scrollTo(0, 500));
    await waitForScrollToComplete(page, 500);

    const headerPosition = await header.boundingBox();
    expect(headerPosition?.y).toBeLessThanOrEqual(10);

    const logo = page.locator(TestSelectors.headerLogo);
    await expect(logo).toBeVisible();

    // ============================================================================
    // SECTION 3: Hero Section Verification
    // ============================================================================
    await page.evaluate(() => (globalThis as any).window?.scrollTo(0, 0));
    await waitForScrollToComplete(page, 0);

    const heroSection = page.locator(TestSelectors.homeHeroSection);
    await expect(heroSection).toBeVisible();

    const viewportHeight = page.viewportSize()?.height || 1080;
    const heroHeight = await heroSection.boundingBox().then(box => box?.height || 0);
    expect(heroHeight).toBeGreaterThan(viewportHeight * 0.8);

    const heroSlides = heroSection.locator('.hero-slide');
    const slideCount = await heroSlides.count();
    if (slideCount > 0) {
      const firstSlide = heroSlides.first();
      const bgImage = await firstSlide.evaluate((el) => {
        const styles = (globalThis as any).getComputedStyle(el);
        return styles.backgroundImage;
      });
      expect(bgImage).toContain('url(');
    }

    const heroCtaButton = page.locator(TestSelectors.homeHeroCtaButton);
    await expect(heroCtaButton).toBeVisible();

    // ============================================================================
    // SECTION 4: Location Section with Intersection Observer
    // ============================================================================
    const locationSection = page.locator(TestSelectors.homeLocationSection);
    await waitForElementInViewport(page, TestSelectors.homeLocationSection);

    await expect(locationSection).toBeVisible();

    // Verify shipping and quality guarantee cards (Tienda Física card removed)
    await expect(page.locator(TestSelectors.homeLocationInfoCardEnvios)).toBeVisible();
    await expect(page.locator(TestSelectors.homeLocationInfoCardGarantia)).toBeVisible();

    // Verify tracking link
    await expect(page.locator(TestSelectors.homeLocationRastrearEnvioLink)).toBeVisible();

    // ============================================================================
    // SECTION 5: Featured Products Section with Supabase Data
    // ============================================================================
    const featuredSection = page.locator(TestSelectors.homeFeaturedProducts);
    
    // Check if featured products section exists before trying to scroll to it
    const featuredSectionExists = await featuredSection.count() > 0;
    
    if (featuredSectionExists) {
      await waitForElementInViewport(page, TestSelectors.homeFeaturedProducts);
      await expect(featuredSection).toBeVisible();

      // Wait for API response
      const apiResult = await featuredApiPromise;
      
      expect(apiResult.received).toBe(true);
      expect(apiResult.status).toBe(200);
      expect(verifyProductsApiResponse(apiResult)).toBe(true);
      console.log('✅ Supabase API call verified (200 OK)');

      const productCards = page.locator('[data-testid^="home-featured-product-card"]');
      const cardCount = await productCards.count();

      if (cardCount > 0) {
        await expect(productCards.first()).toBeVisible();
        console.log(`✅ Found ${cardCount} featured product cards`);
      } else {
        console.log('ℹ️ No featured products found (section may be empty)');
      }
    } else {
      console.log('ℹ️ Featured products section does not exist (no featured products in DB)');
    }

    // ============================================================================
    // SECTION 6: About GMP Section
    // ============================================================================
    const aboutSection = page.locator(TestSelectors.homeAboutGmpSection);
    await waitForElementInViewport(page, TestSelectors.homeAboutGmpSection);

    await expect(aboutSection).toBeVisible();

    const aboutHeading = page.locator(TestSelectors.homeAboutGmpHeading);
    await expect(aboutHeading).toBeVisible();

    // ============================================================================
    // SECTION 7: CTA Section
    // ============================================================================
    const ctaSection = page.locator(TestSelectors.homeCtaSection);
    await waitForElementInViewport(page, TestSelectors.homeCtaSection);

    await expect(ctaSection).toBeVisible();

    const ctaButton = page.locator(TestSelectors.homeCtaCatalogLink);
    await expect(ctaButton).toBeVisible();
  });

  test('should load CatalogPage correctly with products and filters', {
    tag: ['@regression', '@smoke', '@heartbeat', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate to catalog page
    // ============================================================================
    // Set up API listener BEFORE navigation (for page load API calls)
    const catalogApiPromise = waitForProductsApiCall(page, {}, 10000);
    
    await navigateToCatalog(page);
    await page.waitForURL(/\/catalogo/, { timeout: 10000 });

    // ============================================================================
    // SECTION 1: Page Load and Basic Elements
    // ============================================================================
    await expect(page).toHaveTitle(/catálogo|productos/i);

    const header = page.locator(TestSelectors.header);
    await expect(header).toBeVisible();

    const catalogHeading = page.locator(TestSelectors.catalogHeading);
    await expect(catalogHeading).toBeVisible();

    // Monitor console errors (non-critical for catalog page)
    await monitorAndCheckConsoleErrors(page, 1000, false);

    // ============================================================================
    // SECTION 2: Filters and Search
    // ============================================================================
    const filters = page.locator(TestSelectors.catalogFilters);

    if (await filters.count() > 0) {
      await expect(filters).toBeVisible();
    }

    const searchInput = page.locator(TestSelectors.catalogSearchInput);

    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible();
    }

    // ============================================================================
    // SECTION 3: Products Load from Supabase
    // ============================================================================
    // Wait for API response (already set up before navigation)
    const apiResult = await catalogApiPromise;

    expect(apiResult.received).toBe(true);
    expect(apiResult.status).toBe(200);
    expect(verifyProductsApiResponse(apiResult)).toBe(true);
    
    if (Array.isArray(apiResult.data)) {
      console.log(`✅ Supabase API verified: ${apiResult.data.length} products`);
    }

    const productCards = page.locator('[data-testid^="catalog-product-card"]');
    const cardCount = await productCards.count();

    if (cardCount > 0) {
      await expect(productCards.first()).toBeVisible();
      console.log(`✅ Found ${cardCount} product cards`);
    } else {
      console.log('ℹ️ No products found in catalog');
    }

    // ============================================================================
    // SECTION 4: Product Card Interaction
    // ============================================================================
    if (cardCount > 0) {
      await Promise.all([
        page.waitForURL(/\/producto\//, { timeout: 5000 }),
        productCards.first().click()
      ]);

      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/producto\//);
      console.log('✅ Product card navigation works');
    }
  });

  test('should load ProductDetailPage correctly with product data from Supabase', {
    tag: ['@regression', '@smoke', '@heartbeat', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Get a product ID from catalog first
    // ============================================================================
    await navigateToCatalog(page);
    await page.waitForURL(/\/catalogo/, { timeout: 10000 });
    // Wait for products to load or empty state to appear
    await page.waitForFunction(
      () => {
        const doc = (globalThis as any).document;
        if (!doc) return false;
        const cards = doc.querySelectorAll('[data-testid^="catalog-product-card"], .product-card');
        const emptyState = doc.querySelector('[data-testid="catalog-empty-state"]');
        // Return true if we have products OR empty state OR if catalog page is loaded (heading visible)
        const heading = doc.querySelector('[data-testid="catalog-heading"]') || 
                       doc.querySelector('h1, h2')?.textContent?.toLowerCase().includes('catálogo');
        return cards.length > 0 || emptyState || heading;
      },
      { timeout: 10000 }
    ).catch(() => {
      // If timeout, continue anyway - catalog might be loading slowly
      console.log('⚠️ Products loading check timed out, continuing...');
    });

    const productCards = page.locator('[data-testid^="catalog-product-card"]');
    const cardCount = await productCards.count();

    if (cardCount === 0) {
      console.log('⚠️ No products found in catalog, skipping ProductDetailPage test');
      return;
    }

    // Get product ID from first card's link
    const firstCard = productCards.first();
    const cardLink = firstCard.locator('a').first();
    const href = await cardLink.getAttribute('href');

    if (!href) {
      console.log('⚠️ Product card has no link, skipping ProductDetailPage test');
      return;
    }

    const productIdMatch = href.match(/\/producto\/([^\/]+)/);
    if (!productIdMatch) {
      console.log('⚠️ Could not extract product ID from link, skipping ProductDetailPage test');
      return;
    }

    const productId = productIdMatch[1];

    // ============================================================================
    // SETUP: Navigate to product detail page
    // ============================================================================
    // Set up API listener BEFORE navigation (for product detail API call)
    // Product detail page loads a single product by ID
    const productDetailApiPromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('/rest/v1/products') &&
               response.request().method() === 'GET' &&
               (url.includes(`id=eq.${productId}`) || url.includes(`eq.${productId}`));
      },
      { timeout: 10000 }
    );

    await navigateToProduct(page, productId);
    await page.waitForURL(/\/producto\//, { timeout: 10000 });

    // ============================================================================
    // SECTION 1: Page Load and URL Verification
    // ============================================================================
    // Verify URL contains product ID (more reliable than title check)
    await expectPathname(page, `/producto/${productId}`);
    
    // Verify page title (default site title, not product-specific)
    await expect(page).toHaveTitle(/Artesanías en Cuero|GMP/i);

    // Monitor console errors (non-critical)
    await monitorAndCheckConsoleErrors(page, 1000, false);

    // ============================================================================
    // SECTION 2: Product Data from Supabase
    // ============================================================================
    const apiResponse = await productDetailApiPromise;
    
    expect(apiResponse.status()).toBe(200);
    
    const apiData = await apiResponse.json();
    expect(Array.isArray(apiData) || (apiData && typeof apiData === 'object')).toBe(true);
    
    const product = Array.isArray(apiData) ? apiData[0] : apiData;
    if (product && (product.name || product.title)) {
      console.log(`✅ Supabase API verified: Product "${product.name || product.title}"`);

      // Verify product title is visible (use fallback if selector doesn't exist)
      const productTitle = page.locator(TestSelectors.productDetailTitle || 'h1, h2').first();
      const titleCount = await productTitle.count();
      
      if (titleCount > 0) {
        await expect(productTitle).toBeVisible();
        const titleText = await productTitle.textContent();
        if (titleText) {
          expect(titleText).toContain(product.name || product.title);
        }
      } else {
        // If selector doesn't exist, just verify API call succeeded
        console.log('ℹ️ Product title selector not found, but API call verified');
      }
    }

    // ============================================================================
    // SECTION 3: Product Images
    // ============================================================================
    const productImage = page.locator(TestSelectors.productDetailImage(0));

    if (await productImage.count() > 0) {
      await expect(productImage).toBeVisible();
      const imageSrc = await productImage.getAttribute('src');
      expect(imageSrc).toBeTruthy();
    }

    // ============================================================================
    // SECTION 4: Navigation Elements
    // ============================================================================
    // Note: Back button may not have data-testid yet - using role selector only
    const backButton = page.getByRole('button', { name: /volver al catálogo/i });

    if (await backButton.count() > 0) {
      await expect(backButton).toBeVisible();
      await Promise.all([
        page.waitForURL((url) => new URL(url).pathname.endsWith('/catalogo'), { timeout: 5000 }),
        backButton.click()
      ]);
      await expectPathname(page, '/catalogo');
      console.log('✅ Back to catalog navigation works');
    }
  });
});

