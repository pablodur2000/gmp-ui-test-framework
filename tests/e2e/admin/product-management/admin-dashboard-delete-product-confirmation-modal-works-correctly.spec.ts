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
 * E2E Test - Admin Dashboard Delete Product Confirmation Modal Works Correctly (QA-48)
 * 
 * Comprehensive test that verifies the delete-product confirmation modal displays correctly:
 * title, message, product name, Cancelar and Eliminar actions, and that Cancelar closes
 * without deleting and Eliminar triggers deletion.
 * 
 * Based on: QA_TICKET_QA_36_ADMIN_DASHBOARD_DELETE_PRODUCT_CONFIRMATION_MODAL.md
 * Parent Epic: QA-17
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 30-60 seconds
 * - Verifies modal UI content and Cancel vs Confirm behavior
 * - Tests modal title, message, itemName, irreversible text, and button actions
 * 
 * Tags: @regression, @e2e, @admin, @desktop, @development, @staging, @production
 * 
 * Note: This test requires valid admin credentials in environment variables:
 * - TEST_ADMIN_EMAIL: Admin user email address
 * - TEST_ADMIN_PASSWORD: Admin user password
 * 
 * Note: This test focuses on the confirmation modal UI and behavior, not the full delete flow.
 */
test.describe('Admin Dashboard Delete Product Confirmation Modal Works Correctly (QA-48)', () => {
  // Cleanup tracker for this test suite
  const cleanupTracker = new TestCleanupTracker();

  // Store test product ID for cleanup tracking
  let testProductId: string | null = null;

  // Cleanup after each test - CRITICAL: Always clean up test products, even if test fails
  test.afterEach(async () => {
    // Always clean up the test product we created, even if test failed
    if (testProductId) {
      console.log(`🧹 Cleanup: Removing test product ${testProductId}`);
      const result = await cleanupTestProduct(testProductId);
      if (result.success) {
        console.log(`✅ Cleanup: Test product ${testProductId} removed successfully`);
      } else {
        console.warn(`⚠️ Cleanup: Failed to remove test product ${testProductId}: ${result.error}`);
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

  test('should display modal correctly and handle Cancelar and Eliminar actions', {
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
      description: `Test product created for delete modal test at ${new Date().toISOString()}`,
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

    // Get initial total product count (before search)
    const allProductCardsBeforeSearch = page.locator('[data-testid^="admin-product-card"]');
    const initialTotalCount = await allProductCardsBeforeSearch.count();
    console.log(`📊 Initial total product count: ${initialTotalCount}`);

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

    // Get filtered product count (only test products matching search)
    const productCards = page.locator('[data-testid^="admin-product-card"]');
    const filteredCount = await productCards.count();
    console.log(`📊 Filtered products found (TEST_DELETE_): ${filteredCount}`);

    // ============================================================================
    // SECTION 1: Open modal and verify content
    // ============================================================================
    // Click delete button to open modal (on our test product)
    const deleteButton = testProductCard.locator(TestSelectors.adminDeleteProductButton(testProductId)).or(
      testProductCard.getByRole('button', { name: /eliminar/i })
    );

    await expect(deleteButton).toBeVisible();
    
    // Click and wait for modal to appear
    await Promise.all([
      page.waitForSelector(TestSelectors.adminDeleteProductConfirmationModal, { timeout: 5000 }).catch(() => {
        return page.waitForSelector('text=Eliminar Producto', { timeout: 5000 });
      }),
      deleteButton.click()
    ]);

    // Wait for modal to appear - use first() to avoid strict mode violation
    const deleteModal = page.locator(TestSelectors.adminDeleteProductConfirmationModal).first();
    await expect(deleteModal).toBeVisible({ timeout: 5000 });

    // Verify modal title
    const modalTitle = deleteModal.locator(TestSelectors.adminDeleteProductConfirmationModalTitle).or(
      deleteModal.getByRole('heading', { name: /eliminar producto/i })
    );
    await expect(modalTitle).toBeVisible({ timeout: 3000 });
    await expect(modalTitle).toHaveText(/eliminar producto/i);

    // Verify modal message
    const modalMessage = deleteModal.getByText(/¿Estás seguro de que quieres eliminar este producto\?/i);
    await expect(modalMessage).toBeVisible();
    
    const permanentMessage = deleteModal.getByText(/eliminará permanentemente el producto y todas sus imágenes/i);
    await expect(permanentMessage).toBeVisible();

    // Verify product name in red box (should be our test product)
    const productNameInModal = deleteModal.getByText(testProductTitle, { exact: false });
    await expect(productNameInModal).toBeVisible();
    console.log(`✅ Product name found in modal: ${testProductTitle}`);

    // Verify "Esta acción no se puede deshacer" text
    const irreversibleText = deleteModal.getByText(/esta acción no se puede deshacer/i);
    await expect(irreversibleText).toBeVisible();

    // Verify Cancelar button
    const cancelButton = deleteModal.locator(TestSelectors.adminDeleteProductConfirmationModalCancelButton).or(
      deleteModal.getByRole('button', { name: /cancelar/i })
    );
    await expect(cancelButton).toBeVisible();

    // Verify Eliminar (confirm) button
    const confirmButton = deleteModal.locator(TestSelectors.adminDeleteProductConfirmationModalConfirmButton).or(
      deleteModal.getByRole('button', { name: /eliminar/i }).filter({ hasText: /eliminar/i })
    );
    await expect(confirmButton).toBeVisible();

    // Verify close (X) button
    const closeButton = deleteModal.locator(TestSelectors.adminDeleteProductConfirmationModalCloseButton).or(
      deleteModal.getByRole('button').filter({ hasText: '' }).first()
    );
    if (await closeButton.count() > 0) {
      await expect(closeButton).toBeVisible();
      console.log('✅ Close (X) button found');
    }

    console.log('✅ Modal content verified');

    // ============================================================================
    // SECTION 2: Cancelar closes without deleting
    // ============================================================================
    await cancelButton.click();

    // Wait for modal to close
    await expect(deleteModal).not.toBeVisible({ timeout: 5000 });

    // Verify test product is still in the list
    const productStillExists = page.locator(TestSelectors.adminProductCard(testProductId));
    await expect(productStillExists).toBeVisible({ timeout: 3000 });

    // Verify product count unchanged (still filtered by search)
    const newProductCards = page.locator('[data-testid^="admin-product-card"]');
    const newCount = await newProductCards.count();
    expect(newCount).toBe(filteredCount);
    console.log('✅ Cancelar closed modal without deleting test product');

    // ============================================================================
    // SECTION 3: Eliminar confirms and deletes
    // ============================================================================
    // Open modal again
    await deleteButton.click();

    // Wait for modal to appear again
    await expect(deleteModal).toBeVisible({ timeout: 5000 });

    // Click Eliminar (confirm)
    const confirmButtonAgain = deleteModal.locator(TestSelectors.adminDeleteProductConfirmationModalConfirmButton).or(
      deleteModal.getByRole('button', { name: /eliminar/i }).filter({ hasText: /eliminar/i })
    );
    await expect(confirmButtonAgain).toBeVisible();
    await confirmButtonAgain.click();

    // Wait for modal to close
    await expect(deleteModal).not.toBeVisible({ timeout: 10000 });

    // Wait for products list to refresh - wait for the specific test product to disappear
    const deletedProductCard = page.locator(TestSelectors.adminProductCard(testProductId));
    await expect(deletedProductCard).not.toBeVisible({ timeout: 10000 });
    
    // Additional wait for network to be idle to ensure list has refreshed
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForTimeout(500);

    // Verify the test product is deleted
    // Note: In parallel runs, other tests' products may be present, so we only verify
    // that our specific test product is gone, not the total count
    const testProductStillExists = await deletedProductCard.count();
    expect(testProductStillExists).toBe(0);
    
    // Verify deletion is complete - our test product is gone
    // We don't verify total count because other tests may create/delete products in parallel
    // The only reliable check is that our specific test product was deleted (verified above)
    
    // Double-check that our test product is not in the full list (after clearing search)
    const searchInputAfterDelete = page.locator(TestSelectors.adminProductSearchInput).or(
      page.getByPlaceholder(/buscar productos por nombre/i)
    );
    await searchInputAfterDelete.clear();
    await searchInputAfterDelete.press('Enter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for search to clear and products to reload
    
    // Verify our test product is still deleted (not in the full list)
    const testProductInFullList = page.locator(TestSelectors.adminProductCard(testProductId));
    const testProductStillInList = await testProductInFullList.count();
    expect(testProductStillInList).toBe(0);
    
    console.log(`✅ Test product deleted and verified - not found in full product list`);

    // Mark product as deleted (cleanup will still try to remove it, but it should already be gone)
    console.log('✅ Eliminar confirmed and test product deleted');
    console.log(`📊 Page load time: ${pageLoadTime.toFixed(2)}s`);
  });
});
