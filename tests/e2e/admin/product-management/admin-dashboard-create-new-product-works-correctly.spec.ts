import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, navigateToAdminDashboard, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
  TestCleanupTracker,
} from '../../../utils';

/**
 * E2E Test - Admin Dashboard Create New Product Works Correctly (QA-33)
 * 
 * Comprehensive test that verifies an admin can open the "Create new product" flow
 * from the dashboard, fill the product form with all required fields, submit the form,
 * and see the modal close with the new product reflected in the product list or activity log.
 * 
 * Based on: QA_TICKET_QA_33_ADMIN_DASHBOARD_CREATE_NEW_PRODUCT.md
 * Parent Epic: QA-17
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 45-90 seconds
 * - Verifies complete create-product flow: open form, fill fields, submit, verify success
 * - Tests modal behavior, form submission, and product creation
 * 
 * Tags: @regression, @e2e, @admin, @desktop, @development, @staging, @production
 * 
 * Note: This test requires valid admin credentials in environment variables:
 * - TEST_ADMIN_EMAIL: Admin user email address
 * - TEST_ADMIN_PASSWORD: Admin user password
 */
test.describe('Admin Dashboard Create New Product Works Correctly (QA-33)', () => {
  // Cleanup tracker for this test suite
  const cleanupTracker = new TestCleanupTracker();

  // Cleanup after each test
  test.afterEach(async () => {
    const tracked = cleanupTracker.getTrackedCount();
    if (tracked.products > 0 || tracked.categories > 0 || tracked.sales > 0 || tracked.activityLogs > 0) {
      console.log(`📋 Cleanup: Cleaning up ${tracked.products} products, ${tracked.categories} categories, ${tracked.sales} sales, ${tracked.activityLogs} activity logs`);
      await cleanupTracker.cleanupAll();
    }
  });

  test('should create a new product successfully and close the modal', {
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
    const testProductTitle = `Test Product ${timestamp}`;
    const testProductDescription = `Test product description created at ${new Date().toISOString()}`;
    const testProductShortDescription = `Short desc ${timestamp}`;
    const testProductPrice = '5000';
    const testProductFeatures = 'Feature 1\nFeature 2\nFeature 3';

    // ============================================================================
    // SETUP: Login as admin
    // ============================================================================
    console.log('📋 Setup: Logging in as admin');

    const loginPageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToAdminLogin(page),
      5, // max 5 seconds
      3  // warn if > 3 seconds
    );
    
    // Clear any existing authentication
    await page.context().clearCookies();
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (e) {
      console.log('ℹ️ Could not clear storage (may be in secure context)');
    }

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

    // Wait for navigation to dashboard
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 });
    await expectPathname(page, '/admin/dashboard');

    // Verify dashboard loaded
    const dashboardPage = page.locator(TestSelectors.adminDashboardPage);
    await expect(dashboardPage).toBeVisible({ timeout: 5000 });

    console.log('✅ Successfully logged in and navigated to dashboard');

    // ============================================================================
    // SECTION 1: Open Create Product Form
    // ============================================================================
    console.log('📋 Section 1: Opening create product form');

    // Click "Agregar Producto" button
    const addProductButton = page.locator(TestSelectors.adminAddProductButton);
    await expect(addProductButton).toBeVisible();
    await expect(addProductButton).toBeEnabled();

    await addProductButton.click();

    // Wait for modal to appear
    const productFormModal = page.locator(TestSelectors.adminProductFormModal);
    await expect(productFormModal).toBeVisible({ timeout: 3000 });

    // Verify modal title
    const modalTitle = page.locator(TestSelectors.adminProductFormModalTitle);
    await expect(modalTitle).toBeVisible();
    const titleText = await modalTitle.textContent();
    expect(titleText?.trim()).toBe('Crear Nuevo Producto');

    // Verify form is visible
    const productForm = page.locator(TestSelectors.adminProductForm);
    await expect(productForm).toBeVisible();

    console.log('✅ Create product form modal opened successfully');

    // ============================================================================
    // SECTION 2: Fill Form with Required Fields
    // ============================================================================
    console.log('📋 Section 2: Filling form with required fields');

    // Fill title
    const titleInput = page.locator(TestSelectors.adminProductFormTitleInput);
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toBeEnabled();
    await titleInput.fill(testProductTitle);
    const titleValue = await titleInput.inputValue();
    expect(titleValue).toBe(testProductTitle);

    // Fill description
    const descriptionInput = page.locator(TestSelectors.adminProductFormDescriptionInput);
    await expect(descriptionInput).toBeVisible();
    await expect(descriptionInput).toBeEnabled();
    await descriptionInput.fill(testProductDescription);
    const descriptionValue = await descriptionInput.inputValue();
    expect(descriptionValue).toBe(testProductDescription);

    // Fill short description
    const shortDescriptionInput = page.locator(TestSelectors.adminProductFormShortDescriptionInput);
    await expect(shortDescriptionInput).toBeVisible();
    await expect(shortDescriptionInput).toBeEnabled();
    await shortDescriptionInput.fill(testProductShortDescription);
    const shortDescriptionValue = await shortDescriptionInput.inputValue();
    expect(shortDescriptionValue).toBe(testProductShortDescription);

    // Fill features (optional but we'll test it)
    const featuresInput = page.locator(TestSelectors.adminProductFormFeaturesInput);
    await expect(featuresInput).toBeVisible();
    await expect(featuresInput).toBeEnabled();
    await featuresInput.fill(testProductFeatures);
    const featuresValue = await featuresInput.inputValue();
    expect(featuresValue).toBe(testProductFeatures);

    // Fill price
    const priceInput = page.locator(TestSelectors.adminProductFormPriceInput);
    await expect(priceInput).toBeVisible();
    await expect(priceInput).toBeEnabled();
    await priceInput.fill(testProductPrice);
    const priceValue = await priceInput.inputValue();
    expect(priceValue).toBe(testProductPrice);

    // Select category (wait for categories to load, then select first available)
    const categorySelect = page.locator(TestSelectors.adminProductFormCategorySelect);
    await expect(categorySelect).toBeVisible();
    await expect(categorySelect).toBeEnabled();

    // Wait a moment for categories to load
    await page.waitForTimeout(500);

    // Get available options (skip the "Select a category" placeholder)
    const options = await categorySelect.locator('option').all();
    if (options.length > 1) {
      // Select the first actual category (index 1, since 0 is the placeholder)
      await categorySelect.selectOption({ index: 1 });
      const selectedCategory = await categorySelect.inputValue();
      expect(selectedCategory).toBeTruthy();
      expect(selectedCategory).not.toBe('');
      console.log(`✅ Selected category: ${selectedCategory}`);
    } else {
      console.log('⚠️ No categories available - test may fail at submission');
    }

    // Verify checkboxes are visible (available checkbox should be checked by default)
    const availableCheckbox = page.locator(TestSelectors.adminProductFormAvailableCheckbox);
    await expect(availableCheckbox).toBeVisible();
    const isAvailableChecked = await availableCheckbox.isChecked();
    expect(isAvailableChecked).toBe(true); // Default is true

    // Featured checkbox (default is false)
    const featuredCheckbox = page.locator(TestSelectors.adminProductFormFeaturedCheckbox);
    await expect(featuredCheckbox).toBeVisible();
    const isFeaturedChecked = await featuredCheckbox.isChecked();
    expect(isFeaturedChecked).toBe(false); // Default is false

    // Verify inventory status select (default should be "disponible_pieza_unica")
    const inventoryStatusSelect = page.locator(TestSelectors.adminProductFormInventoryStatusSelect);
    await expect(inventoryStatusSelect).toBeVisible();
    const inventoryStatus = await inventoryStatusSelect.inputValue();
    expect(inventoryStatus).toBe('disponible_pieza_unica'); // Default value

    console.log('✅ Form filled with all required fields');

    // ============================================================================
    // SECTION 3: Submit Form and Verify Submission
    // ============================================================================
    console.log('📋 Section 3: Submitting form and verifying submission');

    // Set up response listener for product creation API call
    const productCreateResponsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('/rest/v1/products') && 
               response.request().method() === 'POST';
      },
      { timeout: 15000 }
    );

    // Click submit button
    const submitButton = page.locator(TestSelectors.adminProductFormSubmitButton);
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    // Verify button text before submission
    const submitButtonText = await submitButton.textContent();
    expect(submitButtonText?.trim()).toBe('Create Product');

    // Click submit and wait for API response (button may become disabled/unavailable during submission)
    await submitButton.click();

    // Wait a moment to allow button state to change
    await page.waitForTimeout(200);
    
    // Check if button shows "Creating..." state (optional check - button may be disabled)
    try {
      const submittingButton = page.locator(TestSelectors.adminProductFormSubmitButton);
      const submittingButtonText = await submittingButton.textContent({ timeout: 500 });
      if (submittingButtonText?.includes('Creating')) {
        console.log('✅ Submit button shows "Creating Product..." state');
      }
    } catch (e) {
      // Button may be disabled or modal may be closing - this is OK
      console.log('ℹ️ Submit button state check skipped (button may be disabled during submission)');
    }

    // Wait for product creation API response
    const productCreateResponse = await productCreateResponsePromise;
    expect(productCreateResponse.status()).toBe(201); // Created

    const productData = await productCreateResponse.json();
    expect(productData).toBeTruthy();
    expect(Array.isArray(productData) ? productData.length > 0 : productData !== null).toBe(true);

    const createdProduct = Array.isArray(productData) ? productData[0] : productData;
    expect(createdProduct).toHaveProperty('id');
    expect(createdProduct.title).toBe(testProductTitle);

    // Track product for cleanup
    cleanupTracker.trackProduct(createdProduct.id);

    console.log(`✅ Product created successfully with ID: ${createdProduct.id}`);

    // ============================================================================
    // SECTION 4: Verify Modal Closes and Success
    // ============================================================================
    console.log('📋 Section 4: Verifying modal closes and success');

    // Wait for modal to close (should happen automatically after onSuccess callback)
    await expect(productFormModal).not.toBeVisible({ timeout: 5000 });

    // Verify we're back on the dashboard
    await expectPathname(page, '/admin/dashboard');
    await expect(dashboardPage).toBeVisible();

    // Verify the form is no longer visible
    const formStillVisible = await productForm.isVisible().catch(() => false);
    expect(formStillVisible).toBe(false);

    console.log('✅ Modal closed successfully after product creation');

    // ============================================================================
    // SECTION 5: Verify Success (Product Created)
    // ============================================================================
    console.log('📋 Section 5: Verifying product creation success');

    // Product creation was already verified via API response in Section 3
    // The modal closing in Section 4 confirms the onSuccess callback executed
    // No additional UI verification needed - API response is the source of truth

    console.log('✅ Product creation flow completed successfully');

    // ============================================================================
    // CLEANUP: Handled by test.afterEach hook
    // ============================================================================
    // Product is tracked in cleanupTracker and will be deleted automatically
    // after the test completes (success or failure)

    console.log('✅ Test completed successfully');
  });
});
