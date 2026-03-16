import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import { stepGroup } from '../../../utils/step-executor';
import { monitorAndCheckConsoleErrors, trackPageLoad } from '../../../utils';

/**
 * E2E Test - Admin Dashboard Delete Activity Log Works Correctly (QA-71)
 *
 * Verifies that an admin can delete an activity log entry by clicking the delete button (X icon)
 * on an activity row, and that the UI reflects the deletion (row disappears, list updates).
 *
 * Based on: QA-71 Admin Dashboard Delete Activity Log Works Correctly
 * Parent Epic: QA-19
 *
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Uses admin credentials from environment variables
 * - Does NOT create activity data (uses existing activity if available)
 * - Skips gracefully if no activities exist to delete
 * - Verifies row disappears after deletion
 *
 * Tags: @regression, @e2e, @admin, @desktop, @development, @staging, @production
 */
test.describe('Admin Dashboard Delete Activity Log Works Correctly (QA-71)', () => {
  test('should delete an activity log entry and remove it from the list', {
    tag: ['@regression', '@e2e', '@admin', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      console.log('⚠️ Skipping QA-71: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
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

    await stepGroup('Pre-check: Activity view and at least one activity exists', [
      {
        name: 'Verify Activity view header is visible',
        action: async () => {
          const activityHeader = page.locator(TestSelectors.adminActivityViewHeader);
          await expect(activityHeader).toBeVisible({ timeout: 10000 });
          await expect(activityHeader).toHaveText(/actividad reciente/i);
        },
      },
      {
        name: 'Check if activity list has entries (skip if empty)',
        action: async () => {
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(500); // Small wait for React rendering

          const emptyState = page.locator(TestSelectors.adminActivityEmptyState);
          const activityList = page.locator(TestSelectors.adminActivityList);

          const hasEmptyState = (await emptyState.count()) > 0 && (await emptyState.isVisible());
          const hasList = (await activityList.count()) > 0 && (await activityList.isVisible());

          if (hasEmptyState) {
            console.log('ℹ️ QA-71: No activities to delete - skipping test');
            test.skip();
            return;
          }

          if (!hasList) {
            console.log('ℹ️ QA-71: Activity list not visible - skipping test');
            test.skip();
            return;
          }

          const activityRows = page.locator('[data-testid^="admin-activity-row-"]');
          const rowCount = await activityRows.count();

          if (rowCount === 0) {
            console.log('ℹ️ QA-71: No activity rows found - skipping test');
            test.skip();
            return;
          }

          console.log(`✅ QA-71: Found ${rowCount} activity row(s) - proceeding with deletion test`);
        },
      },
    ]);

    await stepGroup('Action: Delete first activity log', [
      {
        name: 'Capture first activity row ID and initial count',
        action: async () => {
          const activityRows = page.locator('[data-testid^="admin-activity-row-"]');
          const firstRow = activityRows.first();
          await expect(firstRow).toBeVisible({ timeout: 10000 });

          const rowTestId = await firstRow.getAttribute('data-testid');
          const idMatch = rowTestId?.match(/admin-activity-row-(.+)/);
          expect(idMatch?.[1]).toBeTruthy();
          const activityId = idMatch![1];

          // Store activityId in page context for next step
          await page.evaluate((id) => {
            (window as any).__testActivityId = id;
          }, activityId);

          const initialCount = await activityRows.count();
          await page.evaluate((count) => {
            (window as any).__testInitialCount = count;
          }, initialCount);

          console.log(`📝 QA-71: Will delete activity log ID: ${activityId} (initial count: ${initialCount})`);
        },
      },
      {
        name: 'Click delete button (X icon) on first activity row',
        action: async () => {
          const activityId = await page.evaluate(() => (window as any).__testActivityId);
          expect(activityId).toBeTruthy();

          const deleteButton = page.locator(TestSelectors.adminActivityDeleteButton(activityId));
          await expect(deleteButton).toBeVisible({ timeout: 10000 });
          await deleteButton.click();

          console.log(`✅ QA-71: Clicked delete button for activity ${activityId}`);
        },
      },
      {
        name: 'Wait for deletion to complete (network + React update)',
        action: async () => {
          // deleteActivityLog calls loadRecentActivity() which triggers a network request
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(500); // Small wait for React state update
        },
      },
    ]);

    await stepGroup('Assert: Activity log removed from list', [
      {
        name: 'Verify deleted activity row is no longer visible',
        action: async () => {
          const activityId = await page.evaluate(() => (window as any).__testActivityId);
          const initialCount = await page.evaluate(() => (window as any).__testInitialCount);

          expect(activityId).toBeTruthy();
          expect(initialCount).toBeGreaterThan(0);

          // Verify the specific row is gone
          const deletedRow = page.locator(TestSelectors.adminActivityRow(activityId));
          const deletedRowCount = await deletedRow.count();
          expect(deletedRowCount).toBe(0);

          // Verify list count decreased (unless it was the only row and now empty)
          const activityRows = page.locator('[data-testid^="admin-activity-row-"]');
          const newCount = await activityRows.count();

          if (newCount === 0) {
            // All activities deleted, should show empty state
            const emptyState = page.locator(TestSelectors.adminActivityEmptyState);
            await expect(emptyState).toBeVisible({ timeout: 10000 });
            console.log('✅ QA-71: Activity deleted - list is now empty (empty state shown)');
          } else {
            // List still has entries, count should be one less
            expect(newCount).toBe(initialCount - 1);
            console.log(`✅ QA-71: Activity deleted - count decreased from ${initialCount} to ${newCount}`);
          }

          console.log(`✅ QA-71: Activity log ${activityId} successfully deleted and removed from list`);
        },
      },
    ]);
  });
});
