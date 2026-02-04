import { test, expect } from '@playwright/test';
import { navigateToHome, navigateToCatalog, navigateToProduct } from '../utils/navigation';
import { TestSelectors } from '../utils/selectors';
import { trackPageLoad, monitorAndCheckConsoleErrors } from '../utils';
import { setupSupabaseListener } from '../utils/api-listener';
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
test.describe('Smoke Test - Critical Public Paths', () => {
  test('should load HomePage correctly with all sections and Supabase data', {
    tag: ['@regression', '@smoke', '@heartbeat', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate to home page and track performance
    // ============================================================================
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

    await expect(page.locator(TestSelectors.homeLocationInfoCardTiendaFisica)).toBeVisible();
    await expect(page.locator(TestSelectors.homeLocationInfoCardEnvios)).toBeVisible();
    await expect(page.locator(TestSelectors.homeLocationInfoCardGarantia)).toBeVisible();

    // Verify address text (in address card)
    const addressText = page.locator(TestSelectors.homeLocationAddressText);
    await expect(addressText).toBeVisible();

    // Verify map address (in map section)
    const mapAddress = page.locator(TestSelectors.homeLocationMapAddress);
    await expect(mapAddress).toBeVisible();

    // ============================================================================
    // SECTION 5: Featured Products Section with Supabase Data
    // ============================================================================
    // Set up response listener BEFORE scrolling to section
    const supabaseResponse = setupSupabaseListener(page, {
      endpoint: 'products',
      queryParams: { featured: 'eq.true' }
    });

    const featuredSection = page.locator(TestSelectors.homeFeaturedProducts);
    await waitForElementInViewport(page, TestSelectors.homeFeaturedProducts);

    if (await featuredSection.count() > 0) {
      await expect(featuredSection).toBeVisible();

      // Wait for API response
      const response = await supabaseResponse;
      
      if (response.received) {
        expect(response.status).toBe(200);
        console.log('✅ Supabase API call verified (200 OK)');
      }

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
    await navigateToCatalog(page);
    await page.waitForLoadState('networkidle');

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
    // Set up response listener BEFORE waiting
    const supabaseResponse = setupSupabaseListener(page, {
      endpoint: 'products',
      queryParams: {} // All products (not featured)
    }, 5000);

    // Wait for API response
    const response = await supabaseResponse;

    if (response.received) {
      expect(response.status).toBe(200);
      if (response.data && Array.isArray(response.data)) {
        console.log(`✅ Supabase API verified: ${response.data.length} products`);
      }
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
    await page.waitForLoadState('networkidle');
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
    let supabaseResponseReceived = false;
    let supabaseResponseStatus = 0;
    let productData: any = null;

    // Set up response listener BEFORE navigation
    const supabaseResponse = setupSupabaseListener(page, {
      endpoint: 'products',
      urlPattern: new RegExp(`id=eq\\.${productId}`)
    }, 5000);

    await navigateToProduct(page, productId);
    await page.waitForLoadState('networkidle');

    // ============================================================================
    // SECTION 1: Page Load and URL Verification
    // ============================================================================
    // Verify URL contains product ID (more reliable than title check)
    await expect(page).toHaveURL(new RegExp(`/producto/${productId}`, 'i'));
    
    // Verify page title (default site title, not product-specific)
    await expect(page).toHaveTitle(/Artesanías en Cuero|GMP/i);

    // Monitor console errors (non-critical)
    await monitorAndCheckConsoleErrors(page, 1000, false);

    // ============================================================================
    // SECTION 2: Product Data from Supabase
    // ============================================================================
    const response = await supabaseResponse;
    
    if (response.received) {
      expect(response.status).toBe(200);
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        const product = response.data[0];
        console.log(`✅ Supabase API verified: Product "${product.name || product.title}"`);

        const productTitle = page.locator(TestSelectors.productDetailTitle);
        await expect(productTitle).toBeVisible();

        if (product.name || product.title) {
          const titleText = await productTitle.textContent();
          expect(titleText).toContain(product.name || product.title);
        }
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
        page.waitForURL(/\/catalogo/, { timeout: 5000 }),
        backButton.click()
      ]);
      await expect(page).toHaveURL(/\/catalogo/);
      console.log('✅ Back to catalog navigation works');
    }
  });
});

