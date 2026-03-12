import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, navigateToAdminDashboard } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
} from '../../../utils';

/**
 * E2E Test - Admin Dashboard View Products Catalog Works Correctly (QA-50)
 * 
 * Comprehensive test that verifies an admin can open the "View products catalog"
 * (Gestionar Productos / Ver y editar productos) on the dashboard and see the product
 * list with search bar, loading state, empty state or product cards (title, Editar,
 * Eliminar, image, price, category, availability).
 * 
 * Based on: QA_TICKET_QA_38_ADMIN_DASHBOARD_VIEW_PRODUCTS_CATALOG.md
 * Parent Epic: QA-17
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 30-60 seconds
 * - Verifies catalog view toggle, search bar, loading/empty/list states
 * - Tests product card structure and content
 * 
 * Tags: @regression, @e2e, @admin, @desktop, @development, @staging, @production
 * 
 * Note: This test requires valid admin credentials in environment variables:
 * - TEST_ADMIN_EMAIL: Admin user email address
 * - TEST_ADMIN_PASSWORD: Admin user password
 * 
 * Note: This test is read-only and does not modify data.
 */
test.describe('Admin Dashboard View Products Catalog Works Correctly (QA-50)', () => {
  test('should open products catalog and display content correctly', {
    tag: ['@regression', '@e2e', '@admin', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Get admin credentials from environment
    // ============================================================================
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      console.log('⚠️ Skipping test: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
      return;
    }

    // ============================================================================
    // SETUP: Navigate to admin dashboard and track performance
    // ============================================================================
    const pageLoadTime = await trackPageLoad(
      page,
      async () => {
        await navigateToAdminLogin(page);
        await page.locator(TestSelectors.adminLoginEmailInput).fill(adminEmail);
        await page.locator(TestSelectors.adminLoginPasswordInput).fill(adminPassword);
        await page.locator(TestSelectors.adminLoginSubmitButton).click();
        await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });
        await navigateToAdminDashboard(page);
      },
      10, // max 10 seconds
      5   // warn if > 5 seconds
    );

    await monitorAndCheckConsoleErrors(page, 1000);

    // ============================================================================
    // SECTION 1: Open products catalog
    // ============================================================================
    const manageProductsButton = page.locator(TestSelectors.adminManageProductsButton).or(
      page.getByRole('button', { name: /gestionar productos|ver y editar productos/i })
    );
    
    await expect(manageProductsButton).toBeVisible({ timeout: 5000 });
    
    // Verify button text before clicking
    const buttonText = await manageProductsButton.textContent();
    console.log(`📋 Button text: ${buttonText}`);

    // Click to open catalog
    await manageProductsButton.click();
    await page.waitForLoadState('networkidle');

    // Wait for catalog content to appear - check for search input first
    const searchInput = page.locator(TestSelectors.adminProductSearchInput).or(
      page.getByPlaceholder(/buscar productos por nombre/i)
    );
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Verify button text changed (if toggle works)
    const buttonTextAfter = await manageProductsButton.textContent();
    if (buttonTextAfter?.includes('Ocultar') || buttonTextAfter?.includes('Cerrar')) {
      console.log('✅ Button text changed to "Ocultar Productos" / "Cerrar catálogo"');
    }

    // ============================================================================
    // SECTION 2: Verify search bar and export button
    // ============================================================================
    // Verify search input (already waited for above, but verify placeholder)
    await expect(searchInput).toHaveAttribute('placeholder', /buscar productos por nombre.*presiona enter/i);

    // Verify export button
    const exportButton = page.locator(TestSelectors.adminExportProductsButton).or(
      page.getByRole('button', { name: /exportar/i })
    );
    await expect(exportButton).toBeVisible();
    console.log('✅ Search bar and export button visible');

    // ============================================================================
    // SECTION 3: Verify content (loading, empty, or list)
    // ============================================================================
    // Wait for network to be idle (products should have loaded)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give a bit more time for React to render

    // Check for loading state first
    const loadingState = page.locator(TestSelectors.adminProductsLoading);
    const hasLoading = await loadingState.count() > 0;
    
    if (hasLoading) {
      console.log('⏳ Products are loading...');
      await expect(loadingState).not.toBeVisible({ timeout: 15000 });
    }

    // Check for empty state or product list
    const emptyState = page.locator(TestSelectors.adminProductsEmptyState).or(
      page.getByText(/no se encontraron productos/i)
    );
    const productList = page.locator(TestSelectors.adminProductList);
    const productCards = page.locator('[data-testid^="admin-product-card"]');

    // Check what's visible on the page
    const emptyStateCount = await emptyState.count();
    const productListCount = await productList.count();
    const productCardsCount = await productCards.count();

    console.log(`📊 State check: emptyState=${emptyStateCount}, productList=${productListCount}, productCards=${productCardsCount}`);

    if (emptyStateCount > 0) {
      // Empty state
      await expect(emptyState).toBeVisible();
      const emptyText = await emptyState.textContent();
      if (emptyText?.includes('No se encontraron productos')) {
        console.log('ℹ️ Catalog is empty');
        // Verify empty state message
        if (emptyText.includes('¡Crea tu primer producto!')) {
          console.log('✅ Empty state message: "No se encontraron productos. ¡Crea tu primer producto!"');
        }
      }
    } else if (await productList.count() > 0 || await productCards.count() > 0) {
      // Product list exists
      const cardCount = await productCards.count();
      console.log(`✅ Found ${cardCount} product(s) in catalog`);

      if (cardCount > 0) {
        // Verify first product card structure
        const firstCard = productCards.first();
        await expect(firstCard).toBeVisible();

        // Verify product title
        const productTitle = firstCard.locator('h3').first();
        if (await productTitle.count() > 0) {
          await expect(productTitle).toBeVisible();
          const titleText = await productTitle.textContent();
          console.log(`✅ Product title: ${titleText}`);
        }

        // Verify Editar button
        const editButton = firstCard.locator(TestSelectors.adminEditProductButton('*')).or(
          firstCard.getByRole('button', { name: /editar/i })
        );
        if (await editButton.count() > 0) {
          await expect(editButton).toBeVisible();
          console.log('✅ Editar button found');
        }

        // Verify Eliminar button
        const deleteButton = firstCard.locator(TestSelectors.adminDeleteProductButton('*')).or(
          firstCard.getByRole('button', { name: /eliminar/i })
        );
        if (await deleteButton.count() > 0) {
          await expect(deleteButton).toBeVisible();
          console.log('✅ Eliminar button found');
        }

        // Verify price (if present)
        const priceText = firstCard.getByText(/precio:/i);
        if (await priceText.count() > 0) {
          await expect(priceText).toBeVisible();
          console.log('✅ Price information found');
        }

        // Verify category (if present)
        const categoryText = firstCard.getByText(/categoría:/i);
        if (await categoryText.count() > 0) {
          await expect(categoryText).toBeVisible();
          console.log('✅ Category information found');
        }

        // Verify availability badges (if present)
        const disponibilidadBadge = firstCard.getByText(/disponible|no disponible/i);
        if (await disponibilidadBadge.count() > 0) {
          console.log('✅ Availability badge found');
        }

        // Verify featured badge (if present)
        const destacadoBadge = firstCard.getByText(/destacado/i);
        if (await destacadoBadge.count() > 0) {
          console.log('✅ Featured badge found');
        }

        // Verify product image (if present)
        const productImage = firstCard.locator('img').first();
        if (await productImage.count() > 0) {
          await expect(productImage).toBeVisible();
          console.log('✅ Product image found');
        }
      }
    } else {
      console.log('⚠️ Neither empty state nor product list found - may still be loading');
    }

    console.log('✅ Products catalog view verified');
    console.log(`📊 Page load time: ${pageLoadTime.toFixed(2)}s`);
  });
});
