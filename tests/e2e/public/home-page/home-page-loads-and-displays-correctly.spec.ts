import { test, expect } from '@playwright/test';
import { navigateToHome } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import { trackPageLoad, monitorAndCheckConsoleErrors } from '../../../utils';
import { setupSupabaseListener } from '../../../utils/api-listener';
import { waitForElementInViewport, verifyImagesLoad, waitForFirstVisitAnimation } from '../../../utils';

/**
 * E2E Test - HomePage Loads and Displays Correctly (QA-8)
 * 
 * Comprehensive test that verifies HomePage loads correctly with all sections,
 * Intersection Observer animations, scroll behavior, content validation, image loading,
 * and data from Supabase.
 * 
 * Based on: QA_TICKET_QA_8_HOMEPAGE_LOADS.md
 * Parent Epic: QA-3
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 45-60 seconds
 * - Comprehensive section validation with Supabase API verification
 * 
 * Tags: @e2e, @public, @homepage, @desktop, @development, @staging, @production
 */
test.describe('HomePage - Loads and Displays Correctly', () => {
  test('should load all sections correctly with animations and Supabase data', {
    tag: ['@e2e', '@public', '@homepage', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate to home page and track performance
    // ============================================================================
    const pageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToHome(page),
      5, // max 5 seconds
      3  // warn if > 3 seconds
    );

    // Wait for first-visit animation to complete (if present)
    await waitForFirstVisitAnimation(page, 3000).catch(() => {
      // Animation might not be present, continue anyway
    });

    // ============================================================================
    // SECTION 1: Page Load and Performance Verification
    // ============================================================================
    await expect(page).toHaveTitle(/Artesanías en Cuero|GMP/i);

    // Monitor console errors
    await monitorAndCheckConsoleErrors(page, 1000);

    // ============================================================================
    // SECTION 2: Hero Section Basic Verification
    // ============================================================================
    const heroSection = page.locator(TestSelectors.homeHeroSection).or(
      page.locator('section').filter({ hasText: /artesanías|macramé/i }).first()
    );
    await expect(heroSection).toBeVisible();

    const viewportHeight = page.viewportSize()?.height || 1080;
    const heroHeight = await heroSection.boundingBox().then(box => box?.height || 0);
    expect(heroHeight).toBeGreaterThan(viewportHeight * 0.8);

    const heroSlides = heroSection.locator('.hero-slide');
    const slideCount = await heroSlides.count();
    expect(slideCount).toBeGreaterThan(0);

    let visibleSlide = null;
    for (let i = 0; i < slideCount; i++) {
      const slide = heroSlides.nth(i);
      const opacity = await slide.evaluate((el) => {
        const styles = (globalThis as any).getComputedStyle(el);
        return parseFloat(styles.opacity);
      });
      if (opacity > 0.9) {
        visibleSlide = slide;
        break;
      }
    }

    expect(visibleSlide).not.toBeNull();

    const bgImage = await visibleSlide!.evaluate((el) => {
      const styles = (globalThis as any).getComputedStyle(el);
      return styles.backgroundImage;
    });
    expect(bgImage).toContain('url(');

    const heroContent = page.locator(TestSelectors.homeHeroContent).or(
      heroSection.locator('div').filter({ hasText: /artesanías|macramé|paysandú|monederos/i }).first()
    );

    const title = heroContent.locator(TestSelectors.homeHeroTitle).or(heroContent.locator('h1').first());
    const subtitle = heroContent.locator(TestSelectors.homeHeroSubtitle).or(
      heroContent.locator('span').filter({ hasText: /hechas|tradición|tejidos|paysandú|detalles/i }).first()
    );
    const description = heroContent.locator(TestSelectors.homeHeroDescription).or(heroContent.locator('p').first());
    const heroCtaButton = page.locator(TestSelectors.homeHeroCtaButton);

    await expect(title).toBeVisible();
    await expect(subtitle).toBeVisible();
    await expect(description).toBeVisible();
    await expect(heroCtaButton).toBeVisible();

    // ============================================================================
    // SECTION 3: Location Section with Intersection Observer
    // ============================================================================
    const locationSection = page.locator(TestSelectors.homeLocationSection).or(
      page.locator('section').filter({ hasText: /ubicación/i })
    );
    await waitForElementInViewport(page, TestSelectors.homeLocationSection);

    await expect(locationSection).toBeVisible();

    const locationHeading = page.locator(TestSelectors.homeLocationHeading).or(
      page.getByRole('heading', { name: /ubicación/i })
    );
    await expect(locationHeading).toBeVisible();

    await expect(page.locator(TestSelectors.homeLocationInfoCardTiendaFisica)).toBeVisible();
    await expect(page.locator(TestSelectors.homeLocationInfoCardEnvios)).toBeVisible();
    await expect(page.locator(TestSelectors.homeLocationInfoCardGarantia)).toBeVisible();

    // Verify address text (in address card)
    const addressText = page.locator(TestSelectors.homeLocationAddressText);
    await expect(addressText).toBeVisible();

    // Verify map address (in map section)
    const mapAddress = page.locator(TestSelectors.homeLocationMapAddress);
    await expect(mapAddress).toBeVisible();

    await expect(page.locator(TestSelectors.homeLocationVerMapaButton)).toBeVisible();
    await expect(page.locator(TestSelectors.homeLocationRastrearEnvioLink)).toBeVisible();

    // ============================================================================
    // SECTION 4: Featured Products Section with Supabase Data
    // ============================================================================
    // Set up response listener BEFORE scrolling to section
    const supabaseResponse = setupSupabaseListener(page, {
      endpoint: 'products',
      queryParams: { featured: 'eq.true' }
    }, 5000);

    const featuredSection = page.locator(TestSelectors.homeFeaturedProducts).or(
      page.locator('section').filter({ hasText: /productos destacados/i })
    );
    await waitForElementInViewport(page, TestSelectors.homeFeaturedProducts);

    if (await featuredSection.count() > 0) {
      await expect(featuredSection).toBeVisible();

      const heading = page.locator(TestSelectors.homeFeaturedProductsHeading).or(
        page.getByRole('heading', { name: /productos destacados/i })
      );
      await expect(heading).toBeVisible();

      // Wait for API response
      const response = await supabaseResponse;
      
      if (response.received) {
        expect(response.status).toBe(200);
        if (response.data && Array.isArray(response.data)) {
          console.log(`✅ Supabase API verified: ${response.data.length} featured products`);
        }
      }

      const productCards = page.locator('[data-testid^="home-featured-product-card"]');
      const cardCount = await productCards.count();

      if (cardCount > 0) {
        await expect(productCards.first()).toBeVisible();
        console.log(`✅ Found ${cardCount} featured product cards`);

        const firstCard = productCards.first();
        const cardImage = firstCard.locator('img').first();
        if (await cardImage.count() > 0) {
          const imageSrc = await cardImage.getAttribute('src');
          expect(imageSrc).toBeTruthy();
        }
      } else {
        console.log('ℹ️ No featured products found (section may be empty)');
      }

      const verTodosLink = page.locator(TestSelectors.homeFeaturedProductsVerTodosLink);
      if (await verTodosLink.count() > 0) {
        await expect(verTodosLink).toBeVisible();
      }
    } else {
      console.log('ℹ️ Featured products section does not exist (no featured products in DB)');
    }

    // ============================================================================
    // SECTION 5: About GMP Section with Intersection Observer
    // ============================================================================
    const aboutSection = page.locator(TestSelectors.homeAboutGmpSection).or(
      page.locator('#sobre-gmp')
    );
    await waitForElementInViewport(page, TestSelectors.homeAboutGmpSection);

    await expect(aboutSection).toBeVisible();

    const aboutHeading = page.locator(TestSelectors.homeAboutGmpHeading).or(
      page.getByRole('heading', { name: /sobre gmp/i })
    );
    await expect(aboutHeading).toBeVisible();

    const aboutDescription = aboutSection.locator(TestSelectors.homeAboutGmpDescription);
    await expect(aboutDescription).toBeVisible();

    const artisanName = page.locator(TestSelectors.homeAboutGmpArtisanName).or(
      page.getByRole('heading', { name: /gabriela ponzoni/i })
    );
    await expect(artisanName).toBeVisible();

    const artisanImage = page.locator(TestSelectors.homeAboutGmpArtisanImage).or(
      aboutSection.locator('img').first()
    );
    if (await artisanImage.count() > 0) {
      await expect(artisanImage).toBeVisible();
      const imageSrc = await artisanImage.getAttribute('src');
      expect(imageSrc).toBeTruthy();
    }

    // ============================================================================
    // SECTION 6: CTA Section Verification
    // ============================================================================
    const ctaSection = page.locator(TestSelectors.homeCtaSection).or(
      page.locator('section').filter({ hasText: /listo para descubrir/i })
    );
    await waitForElementInViewport(page, TestSelectors.homeCtaSection);

    await expect(ctaSection).toBeVisible();

    const ctaSectionButton = page.locator(TestSelectors.homeCtaCatalogLink).or(
      page.getByRole('button', { name: /ver catálogo completo/i })
    );
    await expect(ctaSectionButton).toBeVisible();

    // ============================================================================
    // SECTION 7: Page Health and Accessibility
    // ============================================================================
    const bodyContent = page.locator('body');
    await expect(bodyContent).not.toBeEmpty();

    // Verify images load successfully
    await verifyImagesLoad(page, 5, false);
  });
});

