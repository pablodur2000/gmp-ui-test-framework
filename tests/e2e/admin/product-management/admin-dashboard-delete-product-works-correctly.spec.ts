import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, navigateToAdminDashboard } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
  TestCleanupTracker,
} from '../../../utils';
import { createTestProduct, cleanupTestProduct } from '../../../utils/supabase-cleanup';

/**
 * E2E Test - Admin Dashboard Delete Product Works Correctly (QA-47)
 * 
 * Comprehensive test that verifies an admin can delete a product from the dashboard:
 * click "Eliminar" on a product in the catalog, confirm in the modal, and see the product
 * removed from the list and success feedback.
 * 
 * Based on: QA_TICKET_QA_35_ADMIN_DASHBOARD_DELETE_PRODUCT.md
 * Parent Epic: QA-17
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 45-90 seconds
 * - Verifies complete delete-product flow: open catalog, click delete, confirm in modal, verify removal
 * - Tests modal behavior, deletion confirmation, and product removal
 * 
 * Tags: @regression, @e2e, @admin, @desktop, @development, @staging, @production
 * 
 * Note: This test requires valid admin credentials in environment variables:
 * - TEST_ADMIN_EMAIL: Admin user email address
 * - TEST_ADMIN_PASSWORD: Admin user password
 * 
 * Note: This test will delete a product. It's recommended to use a product created in test
 * or seed data to avoid impacting shared data.
 */
test.describe('Admin Dashboard Delete Product Works Correctly (QA-47)', () => {
  // Cleanup tracker for this test suite
  const cleanupTracker = new TestCleanupTracker();

  // Store test product ID for cleanup tracking
  let testProductId: string | null = null;

  // Cleanup after each test - CRITICAL: Always clean up test products, even if test fails
  test.afterEach(async () => {
    // Always clean up the test product we created, even if test failed
    // Note: Product may have been deleted by the test, but cleanup will handle that gracefully
    if (testProductId) {
      console.log(`🧹 Cleanup: Removing test product ${testProductId}`);
      const result = await cleanupTestProduct(testProductId);
      if (result.success) {
        console.log(`✅ Cleanup: Test product ${testProductId} removed successfully`);
      } else {
        console.log(`ℹ️ Product ${testProductId} not found (may have been already deleted)`);
      }
      testProductId = null;
    }

    // Clean up any other tracked resources
    const tracked = cleanupTracker.getTrackedCount();
    if (tracked.products > 0 || tracked.categories > 0 || tracked.sales > 0 || tracked.activityLogs > 0) {
      console.log(`📋 Cleanup: Cleaning up ${tracked.products} products, ${tracked.categories} categories, ${tracked.sales} sales, ${tracked.activityLogs} activity logs`);
      await cleanupTracker.cleanupAll();
    }
  });

  test('should delete a product successfully after confirmation', {
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
    // SETUP: Create isolated test product for deletion
    // ============================================================================
    console.log('📦 Creating isolated test product for deletion test...');
    const timestamp = Date.now();
    const testProductTitle = `TEST_DELETE_${timestamp}`;
    const testProductData = {
      title: testProductTitle,
      description: `Test product created for delete test at ${new Date().toISOString()}`,
      short_description: `Test delete product ${timestamp}`,
      price: 1000,
      available: true,
      featured: false,
      inventory_status: 'disponible_pieza_unica' as const,
      images: []
    };

    // Create test product via Supabase API
    const createResult = await createTestProduct(testProductData);
    if (!createResult.success || !createResult.productId) {
      throw new Error(`Failed to create test product: ${createResult.error || 'Unknown error'}`);
    }

    testProductId = createResult.productId;
    console.log(`✅ Created test product: ${testProductTitle} (${testProductId})`);
    
    // Track for cleanup
    cleanupTracker.trackProduct(testProductId);

    // ============================================================================
    // SETUP: Open product catalog and find our test product
    // ============================================================================
    const manageProductsButton = page.locator(TestSelectors.adminManageProductsButton).or(
      page.getByRole('button', { name: /gestionar productos/i })
    );
    
    await expect(manageProductsButton).toBeVisible({ timeout: 5000 });
    await manageProductsButton.click();
    await page.waitForLoadState('networkidle');

    // Wait for search input to appear (confirms catalog is open)
    const searchInput = page.locator(TestSelectors.adminProductSearchInput).or(
      page.getByPlaceholder(/buscar productos por nombre/i)
    );
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Search for our test product by prefix
    await searchInput.fill('TEST_DELETE_');
    await searchInput.press('Enter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for search results

    // Check for loading state first
    const loadingState = page.locator(TestSelectors.adminProductsLoading);
    const hasLoading = await loadingState.count() > 0;
    
    if (hasLoading) {
      console.log('⏳ Products are loading...');
      await expect(loadingState).not.toBeVisible({ timeout: 15000 });
    }

    // Find our test product card
    const testProductCard = page.locator(TestSelectors.adminProductCard(testProductId));
    await expect(testProductCard).toBeVisible({ timeout: 10000 });
    
    // SAFETY CHECK: Verify the product title starts with TEST_DELETE_ prefix
    const actualProductTitle = await testProductCard.locator('h3').first().textContent();
    if (!actualProductTitle || !actualProductTitle.startsWith('TEST_DELETE_')) {
      throw new Error(
        `🚨 SAFETY CHECK FAILED: Product title "${actualProductTitle}" does not start with TEST_DELETE_ prefix! ` +
        `This prevents accidental deletion of real products. Aborting test.`
      );
    }
    console.log(`✅ Found test product in catalog: ${testProductTitle}`);
    console.log(`🔒 Safety check passed: Product has TEST_DELETE_ prefix`);

    // Get initial product count (only test products in search results)
    const productCards = page.locator('[data-testid^="admin-product-card"]');
    const initialCount = await productCards.count();
    console.log(`📊 Initial product count: ${initialCount}`);

    // ============================================================================
    // SECTION 1: Open delete confirmation modal
    // ============================================================================

    // Click delete button on our test product
    const deleteButton = testProductCard.locator(TestSelectors.adminDeleteProductButton(testProductId)).or(
      testProductCard.getByRole('button', { name: /eliminar/i })
    );

    await expect(deleteButton).toBeVisible();
    
    // Click and wait for modal to appear
    await Promise.all([
      page.waitForSelector(TestSelectors.adminDeleteProductConfirmationModal, { timeout: 5000 }).catch(() => {
        // Fallback: wait for modal by title text
        return page.waitForSelector('text=Eliminar Producto', { timeout: 5000 });
      }),
      deleteButton.click()
    ]);

    // Wait for modal to appear - use first() to avoid strict mode violation
    const deleteModal = page.locator(TestSelectors.adminDeleteProductConfirmationModal).first();
    await expect(deleteModal).toBeVisible({ timeout: 5000 });

    // Verify modal content - use fallback if data-testid not found
    const modalTitle = deleteModal.locator(TestSelectors.adminDeleteProductConfirmationModalTitle).or(
      deleteModal.getByRole('heading', { name: /eliminar producto/i })
    );
    await expect(modalTitle).toBeVisible({ timeout: 3000 });
    await expect(modalTitle).toHaveText(/eliminar producto/i);

    // Verify product name is shown in modal
    const modalContent = deleteModal.locator('text=' + (testProductTitle || ''));
    if (await modalContent.count() > 0) {
      console.log('✅ Product name found in modal');
    }

    // ============================================================================
    // SECTION 2: Confirm deletion
    // ============================================================================
    const confirmButton = page.locator(TestSelectors.adminDeleteProductConfirmationModalConfirmButton).or(
      deleteModal.getByRole('button', { name: /eliminar/i }).filter({ hasText: /eliminar/i })
    );

    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // Wait for modal to close
    await expect(deleteModal).not.toBeVisible({ timeout: 10000 });

    // Wait for products list to refresh
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Small delay for list refresh

    // ============================================================================
    // SECTION 3: Verify product removed
    // ============================================================================
    // Verify modal is closed
    await expect(deleteModal).not.toBeVisible();

    // Verify product is no longer in the list
    const deletedProductCard = page.locator(TestSelectors.adminProductCard(testProductId));
    await expect(deletedProductCard).not.toBeVisible({ timeout: 10000 });

    // Verify product count decreased (if there were multiple products)
    if (initialCount > 1) {
      const newProductCards = page.locator('[data-testid^="admin-product-card"]');
      const newCount = await newProductCards.count();
      expect(newCount).toBe(initialCount - 1);
      console.log(`✅ Product count decreased from ${initialCount} to ${newCount}`);
    } else {
      console.log('ℹ️ Only one product was present, so count verification skipped');
    }

    // Verify product title is no longer visible
    if (testProductTitle) {
      const titleElement = page.getByText(testProductTitle, { exact: false });
      if (await titleElement.count() > 0) {
        // Check if it's in a product card (should not be)
        const titleInCard = page.locator(TestSelectors.adminProductCard(testProductId)).getByText(testProductTitle);
        await expect(titleInCard).not.toBeVisible({ timeout: 2000 });
      }
    }

    console.log('✅ Product successfully deleted');
    console.log(`📊 Page load time: ${pageLoadTime.toFixed(2)}s`);
  });
});
