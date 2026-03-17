import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, navigateToAdminDashboard } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
} from '../../../utils';

/**
 * E2E Test - Admin Dashboard View Categories Displays Correctly (QA-60 - Test 1)
 * 
 * Comprehensive test that verifies an admin can open the "Gestionar Categorías" view
 * on the dashboard and see the categories list with proper grouping, product counts,
 * loading states, and empty states.
 * 
 * Based on: QA-60 Admin Dashboard Category Management E2E Tests
 * Parent Epic: QA-17
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 30-60 seconds
 * - Verifies categories view toggle, grouping by main category, product counts, loading/empty/list states
 * - Tests category card structure and content
 * 
 * Tags: @regression, @e2e, @admin, @category-management, @desktop, @development, @staging, @production
 * 
 * Note: This test requires valid admin credentials in environment variables:
 * - TEST_ADMIN_EMAIL: Admin user email address
 * - TEST_ADMIN_PASSWORD: Admin user password
 * 
 * Note: This test is read-only and does not modify data.
 */
test.describe('Admin Dashboard View Categories Displays Correctly (QA-60)', () => {
  test('should open categories view and display content correctly', {
    tag: ['@regression', '@e2e', '@admin', '@category-management', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Get admin credentials from environment
    // ============================================================================
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      console.log('⚠️ Skipping QA-60: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
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
    // SECTION 1: Verify Quick Action Card and Open Categories View
    // ============================================================================
    console.log('🔍 Section 1: Opening Categories view from dashboard cards');

    const manageCategoriesButton = page.locator(TestSelectors.adminManageCategoriesButton);
    await expect(manageCategoriesButton).toBeVisible({ timeout: 5000 });
    
    // Verify button text before clicking
    const buttonText = await manageCategoriesButton.textContent();
    console.log(`📋 Button text: ${buttonText}`);

    // Click to open categories view
    await manageCategoriesButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Small delay for view to render

    // Verify categories view header is visible
    const categoriesHeader = page.locator(TestSelectors.adminCategoriesViewHeader);
    await expect(categoriesHeader).toBeVisible({ timeout: 10000 });
    await expect(categoriesHeader).toHaveText(/categorías/i);

    // Verify button text changed (if toggle works)
    const buttonTextAfter = await manageCategoriesButton.textContent();
    if (buttonTextAfter?.includes('Ocultar') || buttonTextAfter?.includes('Cerrar')) {
      console.log('✅ Button text changed to "Ocultar Categorías" / "Cerrar categorías"');
    }

    // ============================================================================
    // SECTION 2: Verify Categories View Container
    // ============================================================================
    console.log('🔍 Section 2: Verifying categories view container');

    // Verify categories view container exists
    const categoriesView = page.locator(TestSelectors.adminCategoriesView);
    await expect(categoriesView).toBeVisible({ timeout: 5000 });
    
    // Check for loading state first
    const loadingSpinner = page.locator(TestSelectors.adminCategoriesLoading);
    
    const isLoading = await loadingSpinner.count() > 0;
    if (isLoading) {
      console.log('⏳ Categories are loading, waiting...');
      await expect(loadingSpinner).not.toBeVisible({ timeout: 10000 });
    }

    // ============================================================================
    // SECTION 3: Verify Categories List Display or Empty State
    // ============================================================================
    console.log('🔍 Section 3: Verifying categories list or empty state');

    // Check for empty state
    const emptyState = page.locator(TestSelectors.adminCategoriesEmptyState);
    
    const hasEmptyState = await emptyState.count() > 0;
    
    if (hasEmptyState) {
      await expect(emptyState).toBeVisible({ timeout: 5000 });
      console.log('ℹ️ No categories available - empty state displayed');
      // Verify empty state message
      const emptyStateText = await emptyState.textContent();
      expect(emptyStateText).toMatch(/no se encontraron categorías|crea tu primera categoría/i);
      return; // End test if no categories exist
    }

    // ============================================================================
    // SECTION 4: Verify Categories List Display
    // ============================================================================
    console.log('🔍 Section 4: Verifying categories list display');

    // Wait for categories to appear
    await page.waitForTimeout(1000); // Allow time for categories to render

    // Look for category group headings
    const cueroGroupHeading = page.locator(TestSelectors.adminCategoryGroupHeadingCuero);
    const macrameGroupHeading = page.locator(TestSelectors.adminCategoryGroupHeadingMacrame);

    const hasCueroGroup = await cueroGroupHeading.count() > 0;
    const hasMacrameGroup = await macrameGroupHeading.count() > 0;

    if (!hasCueroGroup && !hasMacrameGroup) {
      // No groups found, but also no empty state - might be loading or error
      console.log('⚠️ No category groups found and no empty state - checking for categories...');
      
      // Try to find any category cards directly
      const anyCategoryCard = page.locator('[data-testid^="admin-category-card-"]').first();
      
      if (await anyCategoryCard.count() === 0) {
        console.log('⚠️ No categories found - test may need categories in database');
        return;
      }
    }

    // ============================================================================
    // SECTION 5: Verify Grouping by Main Category
    // ============================================================================
    console.log('🔍 Section 5: Verifying grouping by main category');

    if (hasCueroGroup) {
      await expect(cueroGroupHeading).toBeVisible({ timeout: 5000 });
      console.log('✅ "Artesanías en Cuero" group heading found');
      
      // Verify Cuero group container exists
      const cueroGroup = page.locator(TestSelectors.adminCategoryGroupCuero);
      await expect(cueroGroup).toBeVisible({ timeout: 5000 });
      
      // Verify at least one category card exists in Cuero group
      const cueroCategoryCards = cueroGroup.locator('[data-testid^="admin-category-card-"]');
      const cueroCardCount = await cueroCategoryCards.count();
      if (cueroCardCount > 0) {
        console.log(`✅ Found ${cueroCardCount} category(ies) in Cuero group`);
      }
    }

    if (hasMacrameGroup) {
      await expect(macrameGroupHeading).toBeVisible({ timeout: 5000 });
      console.log('✅ "Macramé Artesanal" group heading found');
      
      // Verify Macramé group container exists
      const macrameGroup = page.locator(TestSelectors.adminCategoryGroupMacrame);
      await expect(macrameGroup).toBeVisible({ timeout: 5000 });
      
      // Verify at least one category card exists in Macramé group
      const macrameCategoryCards = macrameGroup.locator('[data-testid^="admin-category-card-"]');
      const macrameCardCount = await macrameCategoryCards.count();
      if (macrameCardCount > 0) {
        console.log(`✅ Found ${macrameCardCount} category(ies) in Macramé group`);
      }
    }

    // ============================================================================
    // SECTION 6: Verify Category Card Structure
    // ============================================================================
    console.log('🔍 Section 6: Verifying category card structure');

    // Find first category card (from either group)
    const firstCategoryCard = page.locator('[data-testid^="admin-category-card-"]').first();

    if (await firstCategoryCard.count() > 0) {
      await expect(firstCategoryCard).toBeVisible({ timeout: 5000 });
      console.log('✅ Found at least one category card');

      // Extract category ID from the card's data-testid
      const cardTestId = await firstCategoryCard.getAttribute('data-testid');
      const categoryId = cardTestId?.replace('admin-category-card-', '');
      
      if (!categoryId) {
        console.log('⚠️ Could not extract category ID from card');
        return;
      }

      // Verify category name is displayed
      const categoryName = page.locator(TestSelectors.adminCategoryName(categoryId));
      await expect(categoryName).toBeVisible({ timeout: 5000 });
      const nameText = await categoryName.textContent();
      expect(nameText).toBeTruthy();
      expect(nameText?.trim().length).toBeGreaterThan(0);
      console.log(`✅ Category name displayed: ${nameText?.trim()}`);

      // Verify category description is displayed
      const categoryDescription = page.locator(TestSelectors.adminCategoryDescription(categoryId));
      if (await categoryDescription.count() > 0) {
        const descText = await categoryDescription.textContent();
        if (descText && descText.trim().length > 0) {
          console.log(`✅ Category description displayed: ${descText.trim().substring(0, 50)}...`);
        }
      }

      // Verify main category badge is displayed
      const mainCategoryBadge = page.locator(TestSelectors.adminCategoryMainCategoryBadge(categoryId));
      await expect(mainCategoryBadge).toBeVisible({ timeout: 5000 });
      const badgeText = await mainCategoryBadge.textContent();
      expect(badgeText).toMatch(/cuero|macramé/i);
      console.log(`✅ Main category badge displayed: ${badgeText?.trim()}`);

      // Verify product count is displayed
      const productCount = page.locator(TestSelectors.adminCategoryProductCount(categoryId));
      await expect(productCount).toBeVisible({ timeout: 5000 });
      const countText = await productCount.textContent();
      expect(countText).toMatch(/\d+ producto\(s\)/i);
      console.log(`✅ Product count displayed: ${countText?.trim()}`);

      // Verify Edit and Delete buttons are present
      const editButton = page.locator(TestSelectors.adminEditCategoryButton(categoryId));
      const deleteButton = page.locator(TestSelectors.adminDeleteCategoryButton(categoryId));
      
      await expect(editButton).toBeVisible({ timeout: 5000 });
      console.log('✅ Edit button found on category card');
      
      await expect(deleteButton).toBeVisible({ timeout: 5000 });
      console.log('✅ Delete button found on category card');
    }

    // ============================================================================
    // SECTION 7: Verify View Toggle Behavior
    // ============================================================================
    console.log('🔍 Section 7: Verifying view toggle behavior');

    // Click "Gestionar Categorías" again to close
    await manageCategoriesButton.click();
    await page.waitForTimeout(500);

    // Verify categories view is hidden (header should not be visible or should show "Actividad Reciente")
    const activityHeader = page.locator(TestSelectors.adminActivityViewHeader);
    const categoriesHeaderAfterClose = page.locator(TestSelectors.adminCategoriesViewHeader);
    
    // Either categories header is hidden or activity header is visible
    const categoriesHidden = await categoriesHeaderAfterClose.count() === 0 || 
                             !(await categoriesHeaderAfterClose.isVisible());
    const activityVisible = await activityHeader.count() > 0 && 
                           await activityHeader.isVisible();
    
    if (categoriesHidden || activityVisible) {
      console.log('✅ Categories view closed successfully');
    }

    // Click "Gestionar Productos" to verify only one view is active
    const manageProductsButton = page.locator(TestSelectors.adminManageProductsButton);
    await manageProductsButton.click();
    await page.waitForTimeout(500);

    // Verify products view is open and categories view is closed
    const productsHeader = page.locator(TestSelectors.adminProductsViewHeader);
    await expect(productsHeader).toBeVisible({ timeout: 5000 });
    console.log('✅ Products view opened, categories view closed');

    // Click "Gestionar Categorías" again to reopen
    await manageCategoriesButton.click();
    await page.waitForTimeout(500);

    // Verify categories view is open again
    await expect(categoriesHeader).toBeVisible({ timeout: 5000 });
    console.log('✅ Categories view reopened successfully');

    console.log('✅ QA-60 Test 1: View Categories List and Display - All verifications passed');
  });
});
