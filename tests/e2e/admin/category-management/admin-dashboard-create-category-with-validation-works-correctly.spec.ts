import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, navigateToAdminDashboard, expectPathname } from '../../../utils/navigation';
import { TestSelectors, TestCleanupTracker } from '../../../utils';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
} from '../../../utils';

/**
 * E2E Test - Admin Dashboard Create Category With Validation Works Correctly (QA-60 - Test 2)
 *
 * Verifies that an admin can:
 * - Open the "Agregar Categoría" modal from the dashboard
 * - See validation errors when submitting invalid data
 * - Successfully create a new category and see it in the categories list
 *
 * Based on: QA-60 Admin Dashboard Category Management E2E Tests
 * Parent Epic: QA-17
 *
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 45-75 seconds
 * - Uses unique category names for isolation
 * - Cleans up created categories via Supabase after the test
 *
 * Tags: @regression, @e2e, @admin, @category-management, @desktop, @development, @staging, @production
 *
 * Note: This test requires valid admin credentials in environment variables:
 * - TEST_ADMIN_EMAIL: Admin user email address
 * - TEST_ADMIN_PASSWORD: Admin user password
 */
test.describe('Admin Dashboard Create Category With Validation Works Correctly (QA-60 - Test 2)', () => {
  const cleanupTracker = new TestCleanupTracker();

  test.afterEach(async () => {
    const tracked = cleanupTracker.getTrackedCount();
    if (tracked.categories > 0) {
      console.log(`📋 Cleanup: Cleaning up ${tracked.categories} categories created in QA-60 Test 2`);
      await cleanupTracker.cleanupAll();
    }
  });

  test('should validate and create a new category correctly', {
    tag: ['@regression', '@e2e', '@admin', '@category-management', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Get admin credentials from environment
    // ============================================================================
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      console.log('⚠️ Skipping QA-60 Test 2: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
      return;
    }

    // ============================================================================
    // SETUP: Navigate to admin dashboard and track performance
    // ============================================================================
    console.log('📋 Setup: Logging in as admin and navigating to dashboard for category creation');

    const pageLoadTime = await trackPageLoad(
      page,
      async () => {
        await navigateToAdminLogin(page);
        await expectPathname(page, '/admin/login');

        await page.locator(TestSelectors.adminLoginEmailInput).fill(adminEmail);
        await page.locator(TestSelectors.adminLoginPasswordInput).fill(adminPassword);
        await page.locator(TestSelectors.adminLoginSubmitButton).click();

        await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });
        await navigateToAdminDashboard(page);
      },
      10, // max 10 seconds
      5   // warn if > 5 seconds
    );

    await monitorAndCheckConsoleErrors(page, 1000);

    const dashboardPage = page.locator(TestSelectors.adminDashboardPage);
    await expect(dashboardPage).toBeVisible({ timeout: 10000 });
    console.log(`✅ Logged in and dashboard loaded (load time: ${pageLoadTime.toFixed(2)}s)`);

    // ============================================================================
    // SECTION 1: Open Categories View and Category Create Modal
    // ============================================================================
    console.log('🔍 Section 1: Opening Categories view and category create modal');

    const manageCategoriesButton = page.locator(TestSelectors.adminManageCategoriesButton);
    await expect(manageCategoriesButton).toBeVisible({ timeout: 5000 });

    await manageCategoriesButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Small delay for view to render

    const categoriesHeader = page.locator(TestSelectors.adminCategoriesViewHeader);
    await expect(categoriesHeader).toBeVisible({ timeout: 10000 });

    // Open "Nueva Categoría" modal
    const addCategoryButton = page.locator(TestSelectors.adminAddCategoryButton);
    await expect(addCategoryButton).toBeVisible({ timeout: 5000 });
    await addCategoryButton.click();

    const categoryCreateModal = page.locator(TestSelectors.adminCategoryCreateModal);
    await expect(categoryCreateModal).toBeVisible({ timeout: 5000 });

    const categoryFormTitle = page.locator(TestSelectors.adminCategoryFormModalTitle);
    await expect(categoryFormTitle).toBeVisible({ timeout: 5000 });
    await expect(categoryFormTitle).toHaveText(/crear nueva categoría/i);

    const categoryForm = page.locator(TestSelectors.adminCategoryForm);
    await expect(categoryForm).toBeVisible({ timeout: 5000 });

    // ============================================================================
    // SECTION 2: Validation - Submit invalid data and verify errors
    // ============================================================================
    console.log('🔍 Section 2: Validating category form with invalid data');

    const nameInput = page.locator(TestSelectors.adminCategoryFormNameInput);
    const descriptionInput = page.locator(TestSelectors.adminCategoryFormDescriptionInput);
    const mainCategorySelect = page.locator(TestSelectors.adminCategoryFormMainCategorySelect);
    const submitButton = page.locator(TestSelectors.adminCategoryFormSubmitButton);

    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await expect(descriptionInput).toBeVisible({ timeout: 5000 });
    await expect(mainCategorySelect).toBeVisible({ timeout: 5000 });
    await expect(submitButton).toBeVisible({ timeout: 5000 });

    // Use whitespace to bypass HTML required attribute but trigger custom validation
    await nameInput.fill('   ');
    await descriptionInput.fill('   ');

    await submitButton.click();

    const nameError = page.locator(TestSelectors.adminCategoryFormNameError);
    const descriptionError = page.locator(TestSelectors.adminCategoryFormDescriptionError);

    await expect(nameError).toBeVisible({ timeout: 5000 });
    await expect(nameError).toHaveText(/nombre es requerido/i);

    await expect(descriptionError).toBeVisible({ timeout: 5000 });
    await expect(descriptionError).toHaveText(/descripción es requerida/i);

    console.log('✅ Validation errors displayed correctly for empty name and description');

    // ============================================================================
    // SECTION 3: Create a valid category and verify it appears in the list
    // ============================================================================
    console.log('🔍 Section 3: Creating a valid category');

    const timestamp = Date.now();
    const categoryName = `TEST Category QA-60 ${timestamp}`;
    const categoryDescription = `Descripción para ${categoryName}`;

    await nameInput.fill(categoryName);
    await descriptionInput.fill(categoryDescription);

    // Change main category to macramé for coverage
    await mainCategorySelect.selectOption('macrame');

    await submitButton.click();

    // Modal should close after successful creation
    await expect(categoryCreateModal).not.toBeVisible({ timeout: 10000 });

    // Wait for categories list to refresh
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find the newly created category card by scanning cards and matching name text
    const categoryCards = page.locator('[data-testid^="admin-category-card-"]');
    const cardCount = await categoryCards.count();

    expect(cardCount).toBeGreaterThan(0);

    let createdCategoryId: string | null = null;

    for (let i = 0; i < cardCount; i++) {
      const card = categoryCards.nth(i);
      const cardTestId = await card.getAttribute('data-testid');
      const idMatch = cardTestId?.match(/admin-category-card-(.+)/);
      if (!idMatch || !idMatch[1]) {
        continue;
      }

      const categoryId = idMatch[1];
      const nameLocator = page.locator(TestSelectors.adminCategoryName(categoryId));
      if ((await nameLocator.count()) === 0) {
        continue;
      }

      const nameText = (await nameLocator.textContent())?.trim() || '';
      if (nameText === categoryName) {
        createdCategoryId = categoryId;
        break;
      }
    }

    expect(createdCategoryId).not.toBeNull();
    console.log(`✅ Created category found in list with ID: ${createdCategoryId}`);

    // Track category for cleanup
    if (createdCategoryId) {
      cleanupTracker.trackCategory(createdCategoryId);

      const createdName = page.locator(TestSelectors.adminCategoryName(createdCategoryId));
      const createdDescription = page.locator(TestSelectors.adminCategoryDescription(createdCategoryId));
      const createdBadge = page.locator(TestSelectors.adminCategoryMainCategoryBadge(createdCategoryId));

      await expect(createdName).toBeVisible({ timeout: 5000 });
      await expect(createdName).toHaveText(categoryName);

      await expect(createdDescription).toBeVisible({ timeout: 5000 });
      await expect(createdDescription).toContainText(categoryDescription.substring(0, 10));

      await expect(createdBadge).toBeVisible({ timeout: 5000 });
      await expect(createdBadge).toHaveText(/macramé/i);
    }

    console.log('✅ QA-60 Test 2: Category created successfully and displayed with correct data');
  });
});

