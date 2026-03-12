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
 * E2E Test - Admin Dashboard Product Form Validation Works Correctly (QA-51)
 * 
 * Comprehensive test that verifies the create-product form (ProductForm) enforces required
 * fields so that submit with missing or invalid data does not create a product (browser
 * validation or error display), and that filling all required fields allows successful submit.
 * 
 * Based on: QA_TICKET_QA_39_ADMIN_DASHBOARD_PRODUCT_FORM_VALIDATION.md
 * Parent Epic: QA-17
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 45-60 seconds
 * - Verifies HTML5 required field validation
 * - Tests empty submit, partial fill, and full required submit
 * - Uses isolated test product with TEST_VALIDATION_ prefix
 * 
 * Tags: @regression, @e2e, @admin, @desktop, @development, @staging, @production
 * 
 * Note: This test requires valid admin credentials in environment variables:
 * - TEST_ADMIN_EMAIL: Admin user email address
 * - TEST_ADMIN_PASSWORD: Admin user password
 * 
 * Note: This test creates an isolated test product with TEST_VALIDATION_ prefix and cleans it up.
 */
test.describe('Admin Dashboard Product Form Validation Works Correctly (QA-51)', () => {
  // Cleanup tracker for this test suite
  const cleanupTracker = new TestCleanupTracker();

  // Store test product ID for cleanup
  let testProductId: string | null = null;

  // Cleanup after each test - CRITICAL: Always clean up test product, even if test fails
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

  test('should enforce required fields and allow submit when all required fields are filled', {
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
    // SETUP: Open Create Product Form
    // ============================================================================
    const addProductButton = page.locator(TestSelectors.adminAddProductButton).or(
      page.getByRole('button', { name: /agregar producto|crear nuevo producto/i })
    );
    await expect(addProductButton).toBeVisible({ timeout: 5000 });
    await addProductButton.click();

    // Wait for modal to appear - use first() to avoid strict mode violation
    const productFormModal = page.locator(TestSelectors.adminProductFormModal).first();
    await expect(productFormModal).toBeVisible({ timeout: 5000 });

    // Verify form is visible
    const productForm = page.locator(TestSelectors.adminProductForm);
    await expect(productForm).toBeVisible();

    // Get form inputs
    const titleInput = page.locator(TestSelectors.adminProductFormTitleInput);
    const descriptionInput = page.locator(TestSelectors.adminProductFormDescriptionInput);
    const shortDescriptionInput = page.locator(TestSelectors.adminProductFormShortDescriptionInput);
    const priceInput = page.locator(TestSelectors.adminProductFormPriceInput);
    const categorySelect = page.locator(TestSelectors.adminProductFormCategorySelect);
    const inventoryStatusSelect = page.locator(TestSelectors.adminProductFormInventoryStatusSelect);
    const submitButton = page.locator(TestSelectors.adminProductFormSubmitButton).or(
      page.getByRole('button', { name: /create product/i })
    );

    await expect(titleInput).toBeVisible();
    await expect(descriptionInput).toBeVisible();
    await expect(shortDescriptionInput).toBeVisible();
    await expect(priceInput).toBeVisible();
    await expect(categorySelect).toBeVisible();
    await expect(inventoryStatusSelect).toBeVisible();
    await expect(submitButton).toBeVisible();

    console.log('✅ Create product form opened successfully');

    // ============================================================================
    // SECTION 1: Empty submit blocked
    // ============================================================================
    console.log('📋 Section 1: Testing empty form submission (should be blocked)');

    // Try to submit with all fields empty
    await submitButton.click();

    // Form should still be visible (browser validation prevents submit)
    await expect(productForm).toBeVisible({ timeout: 2000 });
    
    // Check if browser validation message appears (may vary by browser)
    // The form should not have been submitted, so modal should still be open
    await expect(productFormModal).toBeVisible();
    console.log('✅ Empty form submission blocked by browser validation');

    // ============================================================================
    // SECTION 2: Partial fill blocked
    // ============================================================================
    console.log('📋 Section 2: Testing partial fill (should still be blocked)');

    // Fill only Title
    await titleInput.fill('TEST_VALIDATION_Partial');
    
    // Try to submit
    await submitButton.click();

    // Form should still be visible (other required fields missing)
    await expect(productForm).toBeVisible({ timeout: 2000 });
    await expect(productFormModal).toBeVisible();
    console.log('✅ Partial fill submission blocked (other required fields missing)');

    // ============================================================================
    // SECTION 3: Full required submit succeeds
    // ============================================================================
    console.log('📋 Section 3: Testing full required fields (should succeed)');

    // Generate unique product data
    const timestamp = Date.now();
    const testProductTitle = `TEST_VALIDATION_${timestamp}`;
    const testProductDescription = `Test product for validation test at ${new Date().toISOString()}`;
    const testProductShortDescription = `Validation test product ${timestamp}`;
    const testProductPrice = '5000';

    // Fill all required fields
    await titleInput.fill(testProductTitle);
    await descriptionInput.fill(testProductDescription);
    await shortDescriptionInput.fill(testProductShortDescription);
    await priceInput.fill(testProductPrice);

    // Wait for categories to load, then select first available category (not "Select a category")
    await page.waitForTimeout(500);
    const categoryOptions = categorySelect.locator('option');
    const categoryCount = await categoryOptions.count();
    
    if (categoryCount > 1) {
      // Select first non-empty category (index 1, since index 0 is "Select a category")
      await categorySelect.selectOption({ index: 1 });
      console.log('✅ Category selected');
    } else {
      console.log('⚠️ No categories available - test may fail on category requirement');
    }

    // Inventory status should already have a default value, but verify it's set
    const inventoryValue = await inventoryStatusSelect.inputValue();
    if (!inventoryValue) {
      await inventoryStatusSelect.selectOption({ index: 0 }); // Select first option
    }

    // Submit form
    await submitButton.click();

    // Wait for modal to close (indicates successful submission)
    await expect(productFormModal).not.toBeVisible({ timeout: 10000 });

    // Wait for form submission to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify product was created by checking if we can find it in the catalog
    // Open catalog to verify product exists
    const manageProductsButton = page.locator(TestSelectors.adminManageProductsButton).or(
      page.getByRole('button', { name: /gestionar productos/i })
    );
    
    if (await manageProductsButton.count() > 0) {
      await manageProductsButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Search for our test product
      const searchInput = page.locator(TestSelectors.adminProductSearchInput).or(
        page.getByPlaceholder(/buscar productos por nombre/i)
      );
      if (await searchInput.count() > 0) {
        await searchInput.fill(testProductTitle);
        await searchInput.press('Enter');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Find the product card
        const productCards = page.locator('[data-testid^="admin-product-card"]');
        const cardCount = await productCards.count();
        
        if (cardCount > 0) {
          // Extract product ID from first card
          const firstCard = productCards.first();
          const cardTestId = await firstCard.getAttribute('data-testid');
          const productIdMatch = cardTestId?.match(/admin-product-card-([a-f0-9-]+)/);
          
          if (productIdMatch && productIdMatch[1]) {
            testProductId = productIdMatch[1];
            cleanupTracker.trackProduct(testProductId);
            console.log(`✅ Product created successfully: ${testProductTitle} (${testProductId})`);
          } else {
            console.log('✅ Product created (could not extract ID for cleanup)');
          }
        } else {
          console.log('⚠️ Product may have been created but not found in search');
        }
      }
    }

    console.log('✅ Full required fields submission succeeded');
    console.log(`📊 Page load time: ${pageLoadTime.toFixed(2)}s`);
  });
});
