import { test, expect } from '@playwright/test';
import {
  navigateToAdminLogin,
  navigateToAdminDashboard,
  expectPathname,
} from '../utils/navigation';
import { TestSelectors } from '../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
} from '../utils';

/**
 * Integration Test - Complete Admin Product Management Flow (Create, Edit, Delete) (QA-58)
 *
 * End-to-end admin flow that verifies:
 * - Login to admin dashboard
 * - Open product catalog view
 * - Create a new product via ProductForm
 * - Edit that product via ProductEditForm
 * - Delete that product via DeleteConfirmationModal
 *
 * Based on: QA_TICKET_QA_58_INTEGRATION_COMPLETE_ADMIN_PRODUCT_MANAGEMENT_FLOW.md
 * Parent Epic: QA-20
 *
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 2–3 minutes
 * - High-level assertions per step (forms/modal visible, list updated) without duplicating deep field validation
 *
 * Tags: @regression, @e2e, @integration, @admin, @desktop, @development, @staging, @production
 */
test.describe('Integration - Complete Admin Product Management Flow (QA-58)', () => {
  test('should complete create → edit → delete product flow correctly', {
    tag: ['@regression', '@e2e', '@integration', '@admin', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Login as admin and open Products catalog
    // ============================================================================
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      console.log('⚠️ Skipping QA-58: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
      return;
    }

    console.log('📋 Setup: Logging in as admin for product management flow');

    const loginPageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToAdminLogin(page),
      10,
      3
    );

    await monitorAndCheckConsoleErrors(page, 1000);
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
    await expectPathname(page, '/admin/login');

    const emailInput = page.locator(TestSelectors.adminLoginEmailInput);
    const passwordInput = page.locator(TestSelectors.adminLoginPasswordInput);
    const loginSubmitButton = page.locator(TestSelectors.adminLoginSubmitButton);

    await emailInput.fill(adminEmail);
    await passwordInput.fill(adminPassword);
    await loginSubmitButton.click();

    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });
    await expectPathname(page, '/admin/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    const dashboardPage = page.locator(TestSelectors.adminDashboardPage);
    await expect(dashboardPage).toBeVisible({ timeout: 10000 });

    console.log('✅ Logged in and dashboard loaded');

    // Open products catalog view
    const manageProductsButton = page.locator(TestSelectors.adminManageProductsButton);
    await expect(manageProductsButton).toBeVisible({ timeout: 10000 });
    await manageProductsButton.click();
    await page.waitForLoadState('networkidle');

    const productsHeader = page.locator(TestSelectors.adminProductsViewHeader);
    await expect(productsHeader).toBeVisible({ timeout: 10000 });

    const productList = page.locator(TestSelectors.adminProductList);

    // Generate unique product data
    const timestamp = Date.now();
    const baseTitle = `E2E Product QA-58 ${timestamp}`;
    const updatedTitle = `${baseTitle} (Updated)`;

    // ============================================================================
    // SECTION 1: Create Product
    // ============================================================================
    console.log('🔍 Section 1: Creating new product');

    const addProductButton = page.locator(TestSelectors.adminAddProductButton);
    await expect(addProductButton).toBeVisible({ timeout: 10000 });
    await addProductButton.click();

    const productFormModal = page.locator(TestSelectors.adminProductFormModal);
    await expect(productFormModal).toBeVisible({ timeout: 5000 });

    const productForm = page.locator(TestSelectors.adminProductForm);
    await expect(productForm).toBeVisible({ timeout: 5000 });

    // Fill minimal required fields
    const titleInput = page.locator(TestSelectors.adminProductFormTitleInput);
    const descriptionInput = page.locator(TestSelectors.adminProductFormDescriptionInput);
    const shortDescriptionInput = page.locator(TestSelectors.adminProductFormShortDescriptionInput);
    const priceInput = page.locator(TestSelectors.adminProductFormPriceInput);
    const categorySelect = page.locator(TestSelectors.adminProductFormCategorySelect);
    const submitButton = page.locator(TestSelectors.adminProductFormSubmitButton);

    await titleInput.fill(baseTitle);
    await descriptionInput.fill(`Integration test product created at ${new Date(timestamp).toISOString()}`);
    await shortDescriptionInput.fill(`Short desc QA-58 ${timestamp}`);
    await priceInput.fill('9999');

    // Wait briefly for categories and select first real option
    await page.waitForTimeout(500);
    const categoryOptions = await categorySelect.locator('option').all();
    if (categoryOptions.length > 1) {
      await categorySelect.selectOption({ index: 1 });
    } else {
      console.log('⚠️ No categories available for product creation');
    }

    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();

    // Form should close after successful creation
    await expect(productFormModal).toHaveCount(0, { timeout: 10000 });

    // Wait for products list to refresh and verify new product appears
    await page.waitForLoadState('networkidle');
    await expect(productList).toBeVisible({ timeout: 10000 });

    const createdProductCard = page.locator('[data-testid^="admin-product-card-"]').filter({
      hasText: baseTitle,
    }).first();

    await expect(createdProductCard).toBeVisible({ timeout: 15000 });
    console.log(`✅ Product created and visible in list: "${baseTitle}"`);

    // Extract product ID from card testid for re-use
    const createdCardTestId = await createdProductCard.getAttribute('data-testid');
    const createdIdMatch = createdCardTestId?.match(/admin-product-card-(.+)/);
    if (!createdIdMatch || !createdIdMatch[1]) {
      console.log(`⚠️ Could not extract product ID from card testid: ${createdCardTestId}`);
      test.skip(true, 'Cannot continue QA-58 without product ID');
      return;
    }
    const productId = createdIdMatch[1];

    // ============================================================================
    // SECTION 2: Edit Product
    // ============================================================================
    console.log('🔍 Section 2: Editing created product');

    const editButton = page.locator(TestSelectors.adminEditProductButton(productId));
    await expect(editButton).toBeVisible({ timeout: 10000 });
    await editButton.click();

    const editModal = page.locator(TestSelectors.adminProductEditModal);
    await expect(editModal).toBeVisible({ timeout: 5000 });

    const editFormTitleInput = page.locator(TestSelectors.adminProductEditFormTitleInput);
    const editSubmitButton = page.locator(TestSelectors.adminProductEditFormSubmitButton);

    await expect(editFormTitleInput).toBeVisible({ timeout: 5000 });
    await editFormTitleInput.fill(updatedTitle);
    await expect(editSubmitButton).toBeEnabled({ timeout: 5000 });
    await editSubmitButton.click();

    // Edit modal should close
    await expect(editModal).toHaveCount(0, { timeout: 10000 });

    // Verify updated title in list
    await page.waitForLoadState('networkidle');
    const updatedProductCard = page.locator('[data-testid^="admin-product-card-"]').filter({
      hasText: updatedTitle,
    }).first();
    await expect(updatedProductCard).toBeVisible({ timeout: 15000 });

    console.log(`✅ Product edited successfully: "${updatedTitle}"`);

    // ============================================================================
    // SECTION 3: Delete Product with Confirmation
    // ============================================================================
    console.log('🔍 Section 3: Deleting product via confirmation modal');

    const deleteButton = page.locator(TestSelectors.adminDeleteProductButton(productId));
    await expect(deleteButton).toBeVisible({ timeout: 10000 });

    // Capture current count for sanity (optional)
    const initialCards = await page.locator('[data-testid^="admin-product-card-"]').count();

    await deleteButton.click();

    const deleteModal = page.locator(TestSelectors.adminDeleteProductConfirmationModal);
    await expect(deleteModal).toBeVisible({ timeout: 5000 });

    const deleteModalTitle = page.locator(TestSelectors.adminDeleteProductConfirmationModalTitle);
    await expect(deleteModalTitle).toBeVisible({ timeout: 5000 });
    const modalTitleText = (await deleteModalTitle.textContent())?.trim() || '';
    expect(modalTitleText).toMatch(/eliminar producto/i);

    const cancelButton = page.locator(TestSelectors.adminDeleteProductConfirmationModalCancelButton);
    const confirmButton = page.locator(TestSelectors.adminDeleteProductConfirmationModalConfirmButton);

    await expect(cancelButton).toBeVisible({ timeout: 5000 });
    await expect(confirmButton).toBeVisible({ timeout: 5000 });

    // Confirm deletion
    await confirmButton.click();

    // Modal should close
    await expect(deleteModal).toHaveCount(0, { timeout: 10000 });

    // Wait for list to refresh and verify product removed
    await page.waitForLoadState('networkidle');

    const finalCards = await page.locator('[data-testid^="admin-product-card-"]').count();
    const deletedProductCard = page.locator('[data-testid^="admin-product-card-"]').filter({
      hasText: updatedTitle,
    }).first();

    await expect(deletedProductCard).toHaveCount(0, { timeout: 10000 });

    if (finalCards < initialCards) {
      console.log(`✅ Product deleted and list count decreased (${initialCards} → ${finalCards})`);
    } else {
      console.log('✅ Product deleted from list (no card with updated title found)');
    }

    console.log('✅ QA-58: Complete Admin Product Management Flow - create, edit, delete completed successfully');
  });
});

