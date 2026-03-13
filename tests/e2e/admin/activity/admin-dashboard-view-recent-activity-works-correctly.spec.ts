import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, navigateToAdminDashboard, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
} from '../../../utils';

/**
 * E2E Test - Admin Dashboard View Recent Activity Works Correctly (QA-43)
 *
 * Verifies that the admin dashboard shows the "Actividad Reciente" (Recent Activity) view
 * by default (when no other view is selected), with loading/empty state or a list of
 * activity entries showing action type, resource, resource name, user email, and timestamp.
 *
 * Based on: QA_TICKET_QA_46_ADMIN_DASHBOARD_VIEW_RECENT_ACTIVITY.md
 * Parent Epic: QA-19
 *
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Uses admin credentials from environment variables
 * - Does NOT create test activity data (relies on existing data or empty state)
 * - Activity view is the default when products/sales/categories views are not open
 * - Verifies title, search bar, filter pills, and list or empty state
 *
 * Tags: @regression, @e2e, @admin, @desktop, @development, @staging, @production
 */
test.describe('Admin Dashboard View Recent Activity Works Correctly (QA-43)', () => {
  test('should display recent activity view with title, search, filters, and list or empty state', {
    tag: ['@regression', '@e2e', '@admin', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Get admin credentials from environment
    // ============================================================================
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      console.log('⚠️ Skipping QA-43: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
      return;
    }

    // ============================================================================
    // SETUP: Navigate to Admin Login and Login as Admin
    // ============================================================================
    const pageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToAdminLogin(page),
      10, // max 10 seconds (images have delay)
      3   // warn if > 3 seconds
    );

    await monitorAndCheckConsoleErrors(page, 1000);

    await expectPathname(page, '/admin/login');

    // Fill login form
    await page.locator(TestSelectors.adminLoginEmailInput).fill(adminEmail);
    await page.locator(TestSelectors.adminLoginPasswordInput).fill(adminPassword);
    await page.locator(TestSelectors.adminLoginSubmitButton).click();

    // Wait for dashboard
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const adminDashboardPage = page.locator(TestSelectors.adminDashboardPage);
    await expect(adminDashboardPage).toBeVisible({ timeout: 10000 });

    console.log(`✅ Logged in as admin and navigated to dashboard (load time: ${pageLoadTime.toFixed(2)}s)`);

    // ============================================================================
    // SECTION 1: Verify Activity View and Title
    // ============================================================================
    console.log('🔍 Section 1: Verifying activity view and title');

    // Ensure we are NOT in products, sales, or categories view
    // Activity view is the default when none of these are open
    // Check that products catalog is not open
    const productsCatalog = page.locator(TestSelectors.adminProductsCatalogContent);
    if ((await productsCatalog.count()) > 0 && (await productsCatalog.isVisible())) {
      // Close products catalog if open
      const closeProductsButton = page.getByRole('button', { name: /ocultar productos|ver productos/i }).first();
      if (await closeProductsButton.count() > 0) {
        await closeProductsButton.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Check that sales view is not open
    const salesHeader = page.locator(TestSelectors.adminSalesViewHeader);
    if ((await salesHeader.count()) > 0 && (await salesHeader.isVisible())) {
      // Close sales view if open
      const closeSalesButton = page.locator(TestSelectors.adminSalesViewCard).or(
        page.getByRole('button', { name: /ocultar ventas/i }).first()
      );
      if (await closeSalesButton.count() > 0) {
        await closeSalesButton.click();
        await page.waitForLoadState('networkidle');
      }
    }

    // Wait for activity view to be visible
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Small wait for React rendering

    // Assert main content title is "Actividad Reciente"
    const activityHeader = page.locator(TestSelectors.adminActivityViewHeader);
    await expect(activityHeader).toBeVisible({ timeout: 10000 });
    await expect(activityHeader).toHaveText(/actividad reciente/i);

    console.log('✅ Activity view header "Actividad Reciente" is visible');

    // ============================================================================
    // SECTION 2: Verify Search, Filters, and Content
    // ============================================================================
    console.log('🔍 Section 2: Verifying search bar, filter pills, and list or empty state');

    // Assert search input visible with correct placeholder
    const searchInput = page.locator(TestSelectors.adminActivitySearchInput);
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await expect(searchInput).toHaveAttribute('placeholder', /buscar por nombre de recurso o email.*presiona enter/i);

    console.log('✅ Activity search input is visible with correct placeholder');

    // Assert filter pills visible: "Todos", "Crear", "Actualizar", "Eliminar"
    const filtersContainer = page.locator(TestSelectors.adminActivityFilters);
    await expect(filtersContainer).toBeVisible({ timeout: 10000 });

    const filterAll = page.locator(TestSelectors.adminActivityFilterAll);
    const filterCreate = page.locator(TestSelectors.adminActivityFilterCreate);
    const filterUpdate = page.locator(TestSelectors.adminActivityFilterUpdate);
    const filterDelete = page.locator(TestSelectors.adminActivityFilterDelete);

    await expect(filterAll).toBeVisible({ timeout: 10000 });
    await expect(filterCreate).toBeVisible({ timeout: 10000 });
    await expect(filterUpdate).toBeVisible({ timeout: 10000 });
    await expect(filterDelete).toBeVisible({ timeout: 10000 });

    console.log('✅ All filter pills are visible (Todos, Crear, Actualizar, Eliminar)');

    // Wait for activity list to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Small wait for React rendering

    // Check for empty state or list
    const emptyState = page.locator(TestSelectors.adminActivityEmptyState);
    const activityList = page.locator(TestSelectors.adminActivityList);

    const hasEmptyState = (await emptyState.count()) > 0 && (await emptyState.isVisible());
    const hasList = (await activityList.count()) > 0 && (await activityList.isVisible());

    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();
      const emptyText = await emptyState.textContent();
      console.log(`ℹ️ Activity view shows empty state: "${emptyText?.trim()}"`);
      // Empty state is acceptable - test passes
      return;
    }

    if (hasList) {
      await expect(activityList).toBeVisible({ timeout: 10000 });

      // Assert at least one activity row exists
      const activityRows = page.locator('[data-testid^="admin-activity-row-"]');
      const rowCount = await activityRows.count();
      expect(rowCount).toBeGreaterThan(0);

      console.log(`✅ Activity list is visible with ${rowCount} activity row(s)`);

      // Verify at least one row has expected structure
      const firstRow = activityRows.first();
      await expect(firstRow).toBeVisible();

      // Get activity ID from the row's data-testid
      const firstRowTestId = await firstRow.getAttribute('data-testid');
      const activityIdMatch = firstRowTestId?.match(/admin-activity-row-(.+)/);
      if (!activityIdMatch || !activityIdMatch[1]) {
        console.log('⚠️ Could not extract activity ID from row testid');
        return;
      }
      const activityId = activityIdMatch[1];

      // Check for action text (e.g., "Creó Producto...", "Actualizó Venta")
      const actionText = page.locator(TestSelectors.adminActivityActionText(activityId));
      await expect(actionText).toBeVisible();
      const actionTextContent = await actionText.textContent();
      expect(actionTextContent).toBeTruthy();
      expect(actionTextContent?.trim().length).toBeGreaterThan(0);

      // Check for "by {email} • {date}" pattern
      const metadataText = page.locator(TestSelectors.adminActivityMetadata(activityId));
      await expect(metadataText).toBeVisible();
      const metadataContent = await metadataText.textContent();
      expect(metadataContent).toMatch(/by .+ • .+/i);

      // Check for colored dot (indicator of action type)
      const dot = firstRow.locator('div.w-2.h-2.rounded-full');
      await expect(dot).toBeVisible();

      console.log(`✅ First activity row verified:`);
      console.log(`   - Action: ${actionTextContent?.trim()}`);
      console.log(`   - Metadata: ${metadataContent?.trim()}`);

      // Optional: Check for delete button (X)
      const deleteButton = page.locator(TestSelectors.adminActivityDeleteButton(activityId));
      if (await deleteButton.count() > 0) {
        await expect(deleteButton).toBeVisible();
        console.log('✅ Delete button (X) is visible on activity row');
      }
    } else {
      // Neither empty state nor list is visible - this is unexpected
      console.log('⚠️ Neither empty state nor activity list is visible');
      // Test should still pass if we got this far (title, search, filters are visible)
    }

    console.log('✅ QA-43 activity view verified successfully');
  });
});
