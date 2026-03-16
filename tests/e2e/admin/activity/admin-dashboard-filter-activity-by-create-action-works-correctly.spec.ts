import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import { monitorAndCheckConsoleErrors, trackPageLoad } from '../../../utils';

/**
 * E2E Test - Admin Dashboard Filter Activity by Create Action Works Correctly (QA-68)
 *
 * Verifies that an admin can filter the "Actividad Reciente" list by the CREATE action type
 * using the "Crear" filter pill, and that the UI reflects the filtered results.
 *
 * Based on: QA-68 Admin Dashboard Filter Activity by Create Action Works Correctly
 * Parent Epic: QA-19
 *
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Uses admin credentials from environment variables
 * - Does NOT create activity data (accepts empty-state or existing data)
 * - Validates filtered empty-state OR list rows consistent with CREATE filter
 *
 * Tags: @regression, @e2e, @admin, @desktop, @development, @staging, @production
 */
test.describe('Admin Dashboard Filter Activity by Create Action Works Correctly (QA-68)', () => {
  test('should filter recent activity by CREATE action and show correct results', {
    tag: ['@regression', '@e2e', '@admin', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Get admin credentials from environment
    // ============================================================================
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      console.log('⚠️ Skipping QA-68: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
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
    // SECTION 1: Verify Activity View Controls
    // ============================================================================
    console.log('🔍 Section 1: Verifying activity view controls');

    // Assert main content title is "Actividad Reciente"
    const activityHeader = page.locator(TestSelectors.adminActivityViewHeader);
    await expect(activityHeader).toBeVisible({ timeout: 10000 });
    await expect(activityHeader).toHaveText(/actividad reciente/i);

    // Assert filter pills visible: "Todos", "Crear", "Actualizar", "Eliminar"
    const filtersContainer = page.locator(TestSelectors.adminActivityFilters);
    await expect(filtersContainer).toBeVisible({ timeout: 10000 });
    await expect(page.locator(TestSelectors.adminActivityFilterAll)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(TestSelectors.adminActivityFilterCreate)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(TestSelectors.adminActivityFilterUpdate)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(TestSelectors.adminActivityFilterDelete)).toBeVisible({ timeout: 10000 });

    console.log('✅ Activity view header and filter pills are visible');

    // ============================================================================
    // SECTION 2: Apply CREATE Filter
    // ============================================================================
    console.log('🔍 Section 2: Applying CREATE filter');

    await page.locator(TestSelectors.adminActivityFilterCreate).click();

    // searchActivity runs via useEffect; allow time for async fetch + React update
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(300);

    console.log('✅ CREATE filter pill clicked');

    // ============================================================================
    // SECTION 3: Verify Filtered Results
    // ============================================================================
    console.log('🔍 Section 3: Verifying filtered results match CREATE');

    const emptyState = page.locator(TestSelectors.adminActivityEmptyState);
    const activityList = page.locator(TestSelectors.adminActivityList);

    const hasEmptyState = (await emptyState.count()) > 0 && (await emptyState.isVisible());
    const hasList = (await activityList.count()) > 0 && (await activityList.isVisible());

    if (hasEmptyState) {
      await expect(emptyState).toBeVisible({ timeout: 10000 });
      await expect(emptyState).toHaveText(/no se encontraron actividades que coincidan con los filtros/i);
      console.log('ℹ️ QA-68: CREATE filter shows valid empty-state (no matching activities)');
      return;
    }

    expect(hasList).toBeTruthy();
    await expect(activityList).toBeVisible({ timeout: 10000 });

    const activityRows = page.locator('[data-testid^="admin-activity-row-"]');
    const rowCount = await activityRows.count();
    expect(rowCount).toBeGreaterThan(0);

    const rowsToCheck = Math.min(rowCount, 5);
    for (let i = 0; i < rowsToCheck; i++) {
      const row = activityRows.nth(i);
      await expect(row).toBeVisible({ timeout: 10000 });

      // The dot color encodes the action type. For CREATE it should be green.
      const dot = row.locator('div.w-2.h-2.rounded-full');
      await expect(dot).toBeVisible({ timeout: 10000 });
      const dotClass = (await dot.getAttribute('class')) || '';
      expect(dotClass).toMatch(/bg-green-500/);

      // Validate the action text is consistent with a CREATE action
      const rowTestId = await row.getAttribute('data-testid');
      const idMatch = rowTestId?.match(/admin-activity-row-(.+)/);
      expect(idMatch?.[1]).toBeTruthy();
      const activityId = idMatch![1];

      const actionText = page.locator(TestSelectors.adminActivityActionText(activityId));
      await expect(actionText).toBeVisible({ timeout: 10000 });
      await expect(actionText).toHaveText(/creó|creo|crear|creada|creado/i);
    }

    console.log(`✅ QA-68: CREATE filter applied and verified on ${rowsToCheck} row(s)`);
  });
});
