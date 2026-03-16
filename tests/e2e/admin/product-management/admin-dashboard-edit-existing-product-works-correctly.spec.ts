import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, navigateToAdminDashboard, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
  TestCleanupTracker,
} from '../../../utils';
import { createTestProduct, cleanupTestProduct } from '../../../utils/supabase-cleanup';

/**
 * E2E Test - Admin Dashboard Edit Existing Product Works Correctly (QA-34)
 * 
 * Comprehensive test that verifies an admin can open the product catalog on the dashboard,
 * click "Editar" on an existing product, change fields in the edit form, save, and see
 * the modal close and the updated data reflected in the product list or activity log.
 * 
 * Based on: QA_TICKET_QA_34_ADMIN_DASHBOARD_EDIT_EXISTING_PRODUCT.md
 * Parent Epic: QA-17
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 45-90 seconds
 * - Verifies complete edit-product flow: open catalog, click edit, change fields, submit, verify success
 * - Tests modal behavior, form submission, and product update
 * 
 * Tags: @regression, @e2e, @admin, @desktop, @development, @staging, @production
 * 
 * Note: This test requires valid admin credentials in environment variables:
 * - TEST_ADMIN_EMAIL: Admin user email address
 * - TEST_ADMIN_PASSWORD: Admin user password
 * 
 * Note: This test creates its own isolated test product for editing.
 */
test.describe('Admin Dashboard Edit Existing Product Works Correctly (QA-34)', () => {
  // Store test product ID for cleanup
  let testProductId: string | null = null;

  // Cleanup after each test - CRITICAL: Always clean up test product, even if test fails
  test.afterEach(async () => {
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
  });

  test('should edit an existing product successfully and close the modal', {
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

    // Generate unique product data for this test
    const timestamp = Date.now();
    const testProductTitle = `TEST_EDIT_${timestamp}`;
    const updatedProductTitle = `TEST_EDIT_UPDATED_${timestamp}`;
    const updatedProductShortDescription = `Updated short desc ${timestamp}`;

    // ============================================================================
    // SETUP: Create isolated test product for editing
    // ============================================================================
    console.log('📦 Creating isolated test product for editing...');
    const testProduct = await createTestProduct({
      title: testProductTitle,
      description: `Test product created for edit test at ${new Date().toISOString()}`,
      short_description: `Test edit product ${timestamp}`,
      price: 1000,
      available: true,
      featured: false,
      inventory_status: 'disponible_pieza_unica' as const,
      images: []
    });

    if (!testProduct.success || !testProduct.productId) {
      test.skip();
      console.log(`⚠️ Skipping test: Failed to create test product: ${testProduct.error}`);
      return;
    }

    testProductId = testProduct.productId;
    console.log(`✅ Created test product: ${testProductTitle} (${testProductId})`);

    // ============================================================================
    // SETUP: Login as admin
    // ============================================================================
    console.log('📋 Setup: Logging in as admin');

    // Clear any existing authentication before loading login (avoids affecting new session)
    await page.context().clearCookies();
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (e) {
      console.log('ℹ️ Could not clear storage (may be in secure context)');
    }

    const loginPageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToAdminLogin(page),
      10, // max 10 seconds (images have delay)
      3  // warn if > 3 seconds
    );

    await monitorAndCheckConsoleErrors(page, 1000);
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
    await expectPathname(page, '/admin/login');

    // Fill and submit login form
    const emailInput = page.locator(TestSelectors.adminLoginEmailInput);
    const passwordInput = page.locator(TestSelectors.adminLoginPasswordInput);
    const loginSubmitButton = page.locator(TestSelectors.adminLoginSubmitButton);

    await emailInput.fill(adminEmail);
    await passwordInput.fill(adminPassword);
    await loginSubmitButton.click();

    // Wait for dashboard to be visible (not just URL). Dashboard runs checkUser() on mount
    // and may redirect back to login if session isn't ready; waiting for the element ensures
    // we only proceed when the app has rendered the dashboard.
    const dashboardPage = page.locator(TestSelectors.adminDashboardPage);
    await expect(dashboardPage).toBeVisible({ timeout: 15000 });
    await expectPathname(page, '/admin/dashboard');

    console.log('✅ Successfully logged in and navigated to dashboard');

    // ============================================================================
    // SECTION 1: Open Product Catalog
    // ============================================================================
    console.log('📋 Section 1: Opening product catalog');

    // Click "Gestionar Productos" / "Ver y editar productos" button
    const manageProductsButton = page.locator(TestSelectors.adminManageProductsButton).or(
      page.getByRole('button', { name: /gestionar productos/i })
    );
    await expect(manageProductsButton).toBeVisible({ timeout: 5000 });
    await expect(manageProductsButton).toBeEnabled();

    await manageProductsButton.click();
    await page.waitForLoadState('networkidle');

    // Wait for search input to appear (confirms catalog is open)
    const searchInput = page.locator(TestSelectors.adminProductSearchInput).or(
      page.getByPlaceholder(/buscar productos por nombre/i)
    );
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Wait for network to be idle (products should have loaded)
    await page.waitForLoadState('networkidle');
    
    // Check for loading state first
    const loadingState = page.locator(TestSelectors.adminProductsLoading);
    const hasLoading = await loadingState.count() > 0;
    
    if (hasLoading) {
      console.log('⏳ Products are loading...');
      await expect(loadingState).not.toBeVisible({ timeout: 15000 });
    }

    // Wait for products or empty state
    await page.waitForFunction(
      () => {
        const doc = (globalThis as any).document;
        if (!doc) return false;
        const cards = doc.querySelectorAll('[data-testid^="admin-product-card"]');
        const emptyState = doc.querySelector('[data-testid="admin-products-empty-state"]');
        return cards.length > 0 || emptyState !== null;
      },
      { timeout: 15000 }
    );

    // Wait for the test product to appear in the list (with retries)
    let testProductCard = page.locator(TestSelectors.adminProductCard(testProductId));
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts && (await testProductCard.count()) === 0) {
      await page.waitForTimeout(2000);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      testProductCard = page.locator(TestSelectors.adminProductCard(testProductId));
      attempts++;
    }

    // Verify test product card exists
    await expect(testProductCard).toBeVisible({ timeout: 10000 });

    const productId = testProductId;
    console.log(`✅ Product catalog opened, found test product with ID: ${productId}`);

    // Get original product data for cleanup (via API response listener)
    const productDataResponsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('/rest/v1/products') && 
               response.request().method() === 'GET';
      },
      { timeout: 5000 }
    ).catch(() => null);

    // ============================================================================
    // SECTION 2: Open Edit Form
    // ============================================================================
    console.log('📋 Section 2: Opening edit form');

    // Click "Editar" button for the first product
    const editButton = page.locator(TestSelectors.adminEditProductButton(productId));
    await expect(editButton).toBeVisible();
    await expect(editButton).toBeEnabled();

    await editButton.click();

    // Wait for edit modal to appear
    const editModal = page.locator(TestSelectors.adminProductEditModal);
    await expect(editModal).toBeVisible({ timeout: 3000 });

    // Verify modal title
    const modalTitle = page.locator(TestSelectors.adminProductEditModalTitle);
    await expect(modalTitle).toBeVisible();
    const titleText = await modalTitle.textContent();
    expect(titleText).toContain('Editar Producto:');

    // Get original product title from modal title (should be our test product)
    const originalTitle = titleText?.replace('Editar Producto: ', '').trim() || '';
    expect(originalTitle).toBe(testProductTitle); // Verify we're editing our test product

    // Verify form is visible
    const editForm = page.locator(TestSelectors.adminProductEditForm);
    await expect(editForm).toBeVisible();

    console.log(`✅ Edit form modal opened successfully for product: ${originalTitle}`);

    // ============================================================================
    // SECTION 3: Edit Product Fields
    // ============================================================================
    console.log('📋 Section 3: Editing product fields');

    // Edit title
    const titleInput = page.locator(TestSelectors.adminProductEditFormTitleInput);
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toBeEnabled();
    
    // Get current title value
    const currentTitle = await titleInput.inputValue();
    expect(currentTitle).toBe(originalTitle);

    // Update title
    await titleInput.fill(updatedProductTitle);
    const updatedTitleValue = await titleInput.inputValue();
    expect(updatedTitleValue).toBe(updatedProductTitle);

    console.log(`✅ Updated product title from "${originalTitle}" to "${updatedProductTitle}"`);

    // ============================================================================
    // SECTION 4: Submit Form and Verify Submission
    // ============================================================================
    console.log('📋 Section 4: Submitting form and verifying submission');

    // Set up response listener for product update API call
    const productUpdateResponsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('/rest/v1/products') && 
               response.request().method() === 'PATCH';
      },
      { timeout: 15000 }
    );

    // Click submit button
    const submitButton = page.locator(TestSelectors.adminProductEditFormSubmitButton);
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    // Verify button text before submission
    const submitButtonText = await submitButton.textContent();
    expect(submitButtonText?.trim()).toContain('Actualizar Producto');

    await submitButton.click();

    // Wait a moment to allow button state to change
    await page.waitForTimeout(200);
    
    // Check if button shows "Actualizando..." state (optional check)
    try {
      const submittingButton = page.locator(TestSelectors.adminProductEditFormSubmitButton);
      const submittingButtonText = await submittingButton.textContent({ timeout: 500 });
      if (submittingButtonText?.includes('Actualizando')) {
        console.log('✅ Submit button shows "Actualizando..." state');
      }
    } catch (e) {
      // Button may be disabled or modal may be closing - this is OK
      console.log('ℹ️ Submit button state check skipped (button may be disabled during submission)');
    }

    // Wait for product update API response
    const productUpdateResponse = await productUpdateResponsePromise;
    expect(productUpdateResponse.status()).toBe(200); // OK

    const productData = await productUpdateResponse.json();
    expect(productData).toBeTruthy();
    expect(Array.isArray(productData) ? productData.length > 0 : productData !== null).toBe(true);

    const updatedProduct = Array.isArray(productData) ? productData[0] : productData;
    expect(updatedProduct).toHaveProperty('id');
    expect(updatedProduct.id).toBe(productId);
    expect(updatedProduct.title).toBe(updatedProductTitle);

    console.log(`✅ Product updated successfully with new title: ${updatedProductTitle}`);

    // ============================================================================
    // SECTION 5: Verify Modal Closes and Success
    // ============================================================================
    console.log('📋 Section 5: Verifying modal closes and success');

    // Wait for modal to close (should happen automatically after onUpdate callback)
    await expect(editModal).not.toBeVisible({ timeout: 5000 });

    // Verify we're still on the dashboard
    await expectPathname(page, '/admin/dashboard');
    await expect(dashboardPage).toBeVisible();

    // Verify the form is no longer visible
    const formStillVisible = await editForm.isVisible().catch(() => false);
    expect(formStillVisible).toBe(false);

    console.log('✅ Modal closed successfully after product update');

    // ============================================================================
    // SECTION 6: Verify Product Update in List
    // ============================================================================
    console.log('📋 Section 6: Verifying product update in list');

    // Wait a moment for product list to refresh
    await page.waitForTimeout(1000);

    // Verify the updated product appears in the list with new title
    const updatedProductCard = page.locator(TestSelectors.adminProductCard(productId));
    await expect(updatedProductCard).toBeVisible({ timeout: 5000 });

    // Verify the product card shows the updated title
    const productCardTitle = await updatedProductCard.locator('h3').textContent();
    expect(productCardTitle?.trim()).toBe(updatedProductTitle);

    console.log(`✅ Product list shows updated title: ${updatedProductTitle}`);

    console.log('✅ Product edit flow completed successfully');

    // ============================================================================
    // CLEANUP: Handled by test.afterEach hook
    // ============================================================================
    // Test product will be cleaned up in afterEach hook

    console.log('✅ Test completed successfully');
  });
});
