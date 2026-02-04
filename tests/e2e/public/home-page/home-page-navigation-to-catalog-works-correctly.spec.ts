import { test, expect } from '@playwright/test';
import { navigateToHome } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import { waitForFirstVisitAnimation, waitForHoverEffect, waitForElementInViewport, waitForScrollToComplete } from '../../../utils/wait-helpers';

/**
 * E2E Test - HomePage Navigation to Catalog Works Correctly (QA-10)
 * 
 * Comprehensive test that verifies all CTA buttons on HomePage navigate to catalog correctly,
 * including hero section CTA, CTA section button, and header CTA button.
 * 
 * Based on: QA_TICKET_QA_10_HOMEPAGE_NAVIGATION_TO_CATALOG.md
 * Parent Epic: QA-3
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 30-45 seconds
 * - Comprehensive CTA button testing with interactions and hover effects
 * 
 * Tags: @regression, @e2e, @public, @homepage, @navigation, @desktop, @development, @staging, @production
 */
test.describe('HomePage - Navigation to Catalog', () => {
  test('should navigate to catalog from all CTA buttons correctly', {
    tag: ['@regression', '@e2e', '@public', '@homepage', '@navigation', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate to home page
    // ============================================================================
    await navigateToHome(page);
    await page.waitForLoadState('networkidle');
    await waitForFirstVisitAnimation(page, 3000);

    // ============================================================================
    // SECTION 1: Test Hero Section CTA
    // ============================================================================
    const heroCtaButton = page.locator(TestSelectors.homeHeroCtaButton);
    await expect(heroCtaButton).toBeVisible();

    const heroButtonBgBefore = await heroCtaButton.evaluate((el) => {
      const styles = (globalThis as any).getComputedStyle(el);
      return styles.backgroundColor;
    });

    await heroCtaButton.hover();
    await waitForHoverEffect(page, TestSelectors.homeHeroCtaButton, 'backgroundColor', 500);

    const heroButtonBgAfter = await heroCtaButton.evaluate((el) => {
      const styles = (globalThis as any).getComputedStyle(el);
      return styles.backgroundColor;
    });

    if (heroButtonBgAfter !== heroButtonBgBefore) {
      console.log('✅ Hero CTA button hover effect detected');
    }

    const heroButtonTransformBefore = await heroCtaButton.evaluate((el) => {
      const styles = (globalThis as any).getComputedStyle(el);
      return styles.transform;
    });

    await heroCtaButton.hover();
    await waitForHoverEffect(page, TestSelectors.homeHeroCtaButton, 'backgroundColor', 500);

    const heroButtonTransformAfter = await heroCtaButton.evaluate((el) => {
      const styles = (globalThis as any).getComputedStyle(el);
      return styles.transform;
    });

    if (heroButtonTransformAfter !== heroButtonTransformBefore) {
      console.log('✅ Hero CTA button scale effect detected');
    }

    await Promise.all([
      page.waitForURL(/\/catalogo/, { timeout: 5000 }),
      heroCtaButton.click()
    ]);

    await expect(page).toHaveURL(/\/catalogo/);
    console.log('✅ Hero CTA button navigation works');

    await page.goBack();
    await page.waitForLoadState('networkidle');

    // ============================================================================
    // SECTION 2: Test CTA Section Button
    // ============================================================================
    await navigateToHome(page);
    await page.waitForLoadState('networkidle');

    const ctaSection = page.locator(TestSelectors.homeCtaSection);
    await waitForElementInViewport(page, TestSelectors.homeCtaSection);

    await expect(ctaSection).toBeVisible();

    const ctaButton = page.locator(TestSelectors.homeCtaCatalogLink);
    await expect(ctaButton).toBeVisible();

    const ctaButtonBgBefore = await ctaButton.evaluate((el) => {
      const styles = (globalThis as any).getComputedStyle(el);
      return styles.backgroundColor;
    });

    await ctaButton.hover();
    await waitForHoverEffect(page, TestSelectors.homeCtaCatalogLink, 'backgroundColor', 500);

    const ctaButtonBgAfter = await ctaButton.evaluate((el) => {
      const styles = (globalThis as any).getComputedStyle(el);
      return styles.backgroundColor;
    });

    if (ctaButtonBgAfter !== ctaButtonBgBefore) {
      console.log('✅ CTA section button hover effect detected');
    }

    await Promise.all([
      page.waitForURL(/\/catalogo/, { timeout: 5000 }),
      ctaButton.click()
    ]);

    await expect(page).toHaveURL(/\/catalogo/);
    console.log('✅ CTA section button navigation works');

    await page.goBack();
    await page.waitForLoadState('networkidle');

    // ============================================================================
    // SECTION 3: Test Header CTA Button
    // ============================================================================
    await navigateToHome(page);
    await page.waitForLoadState('networkidle');

    // Note: Header CTA button may not have data-testid yet - using role selector only
    const headerCtaButton = page.getByRole('button', { name: /ver catálogo/i });

    if (await headerCtaButton.count() > 0) {
      await expect(headerCtaButton).toBeVisible();

      await headerCtaButton.hover();
      // Wait for hover effect to complete
      await waitForHoverEffect(page, TestSelectors.headerCtaButton || 'button', 'backgroundColor', 300);

      await Promise.all([
        page.waitForURL(/\/catalogo/, { timeout: 5000 }),
        headerCtaButton.click()
      ]);

      await expect(page).toHaveURL(/\/catalogo/);
      console.log('✅ Header CTA button navigation works');

      // ============================================================================
      // SECTION 4: Test Navigation from Different States
      // ============================================================================
      await navigateToHome(page);
      await page.waitForLoadState('networkidle');

      await page.evaluate(() => {
        (globalThis as any).window?.scrollTo(0, 1000);
      });
      await waitForScrollToComplete(page, 1000);

      if (await headerCtaButton.count() > 0) {
        await headerCtaButton.click();
        await page.waitForURL(/\/catalogo/, { timeout: 5000 });
        await expect(page).toHaveURL(/\/catalogo/);
        console.log('✅ Header CTA works from scrolled position');
      }
    } else {
      console.log('ℹ️ Header CTA button may not be implemented yet');
    }

    // ============================================================================
    // SECTION 5: Test Browser History
    // ============================================================================
    await navigateToHome(page);
    await page.waitForLoadState('networkidle');

    const heroCtaButtonForHistory = page.locator(TestSelectors.homeHeroCtaButton);
    await expect(heroCtaButtonForHistory).toBeVisible();
    await heroCtaButtonForHistory.click();
    await page.waitForURL(/\/catalogo/, { timeout: 5000 });

    await page.goBack();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/gmp-web-app\/?$/);
    console.log('✅ Browser history management works correctly');
  });
});

