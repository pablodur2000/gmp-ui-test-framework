import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import { stepGroup } from '../../../utils/step-executor';
import { monitorAndCheckConsoleErrors, trackPageLoad } from '../../../utils';

/**
 * E2E Test - Admin Dashboard Filter Activity by Delete Action Works Correctly (QA-70)
 *
 * Verifies that an admin can filter the "Actividad Reciente" list by the DELETE action type
 * using the "Eliminar" filter pill, and that the UI reflects the filtered results.
 *
 * Based on: QA-70 Admin Dashboard Filter Activity by Delete Action Works Correctly
 * Parent Epic: QA-19
 *
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Uses admin credentials from environment variables
 * - Does NOT create activity data (accepts empty-state or existing data)
 * - Validates filtered empty-state OR list rows consistent with DELETE filter
 *
 * Tags: @regression, @e2e, @admin, @desktop, @development, @staging, @production
 */
test.describe('Admin Dashboard Filter Activity by Delete Action Works Correctly (QA-70)', () => {
  test('should filter recent activity by DELETE action and show correct results', {
    tag: ['@regression', '@e2e', '@admin', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      console.log('⚠️ Skipping QA-70: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
      return;
    }

    await stepGroup('Setup: Login to admin dashboard', [
      {
        name: 'Navigate to admin login',
        action: async () => {
          await trackPageLoad(page, async () => await navigateToAdminLogin(page), 10, 3);
          await monitorAndCheckConsoleErrors(page, 1000);
          await expectPathname(page, '/admin/login');
        },
      },
      {
        name: 'Submit login form',
        action: async () => {
          await page.locator(TestSelectors.adminLoginEmailInput).fill(adminEmail);
          await page.locator(TestSelectors.adminLoginPasswordInput).fill(adminPassword);
          await page.locator(TestSelectors.adminLoginSubmitButton).click();

          await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });
          await page.waitForLoadState('networkidle');
          await expect(page.locator(TestSelectors.adminDashboardPage)).toBeVisible({ timeout: 10000 });
        },
      },
    ]);

    await stepGroup('Pre-check: Activity view controls are visible', [
      {
        name: 'Verify Activity view header is visible',
        action: async () => {
          const activityHeader = page.locator(TestSelectors.adminActivityViewHeader);
          await expect(activityHeader).toBeVisible({ timeout: 10000 });
          await expect(activityHeader).toHaveText(/actividad reciente/i);
        },
      },
      {
        name: 'Verify filter pills exist',
        action: async () => {
          await expect(page.locator(TestSelectors.adminActivityFilters)).toBeVisible({ timeout: 10000 });
          await expect(page.locator(TestSelectors.adminActivityFilterAll)).toBeVisible({ timeout: 10000 });
          await expect(page.locator(TestSelectors.adminActivityFilterCreate)).toBeVisible({ timeout: 10000 });
          await expect(page.locator(TestSelectors.adminActivityFilterUpdate)).toBeVisible({ timeout: 10000 });
          await expect(page.locator(TestSelectors.adminActivityFilterDelete)).toBeVisible({ timeout: 10000 });
        },
      },
    ]);

    await stepGroup('Action: Apply DELETE filter', [
      {
        name: 'Click "Eliminar" filter pill',
        action: async () => {
          await page.locator(TestSelectors.adminActivityFilterDelete).click();
        },
      },
      {
        name: 'Wait for filtered state to render (list or empty)',
        action: async () => {
          // searchActivity runs via useEffect; allow time for async fetch + React update
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(300);
        },
      },
    ]);

    await stepGroup('Assert: Filtered results match DELETE', [
      {
        name: 'Validate empty-state OR list rows consistent with DELETE',
        action: async () => {
          const emptyState = page.locator(TestSelectors.adminActivityEmptyState);
          const activityList = page.locator(TestSelectors.adminActivityList);

          const hasEmptyState = (await emptyState.count()) > 0 && (await emptyState.isVisible());
          const hasList = (await activityList.count()) > 0 && (await activityList.isVisible());

          if (hasEmptyState) {
            await expect(emptyState).toBeVisible({ timeout: 10000 });
            await expect(emptyState).toHaveText(/no se encontraron actividades que coincidan con los filtros/i);
            console.log('ℹ️ QA-70: DELETE filter shows valid empty-state (no matching activities)');
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

            // The dot color encodes the action type. For DELETE it should be red.
            const dot = row.locator('div.w-2.h-2.rounded-full');
            await expect(dot).toBeVisible({ timeout: 10000 });
            const dotClass = (await dot.getAttribute('class')) || '';
            expect(dotClass).toMatch(/bg-red-500/);

            // Validate the action text is consistent with a DELETE action
            const rowTestId = await row.getAttribute('data-testid');
            const idMatch = rowTestId?.match(/admin-activity-row-(.+)/);
            expect(idMatch?.[1]).toBeTruthy();
            const activityId = idMatch![1];

            const actionText = page.locator(TestSelectors.adminActivityActionText(activityId));
            await expect(actionText).toBeVisible({ timeout: 10000 });
            await expect(actionText).toHaveText(/eliminó|elimino|eliminar|eliminada|eliminado/i);
          }

          console.log(`✅ QA-70: DELETE filter applied and verified on ${rowsToCheck} row(s)`);
        },
      },
    ]);
  });
});
