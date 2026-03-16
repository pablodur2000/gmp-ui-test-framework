import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
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
    // ============================================================================
    // SETUP: Get admin credentials from environment
    // ============================================================================
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      console.log('⚠️ Skipping QA-71: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
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
    // SECTION 1: Verify Activity View and Check for Activities
    // ============================================================================
    console.log('🔍 Section 1: Verifying activity view and checking for activities');

    // Assert main content title is "Actividad Reciente"
    const activityHeader = page.locator(TestSelectors.adminActivityViewHeader);
    await expect(activityHeader).toBeVisible({ timeout: 10000 });
    await expect(activityHeader).toHaveText(/actividad reciente/i);

    // Wait for activity list to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Small wait for React rendering

    // Check for empty state or list
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
    const initialCount = await activityRows.count();

    if (initialCount === 0) {
      console.log('ℹ️ QA-71: No activity rows found - skipping test');
      test.skip();
      return;
    }

    console.log(`✅ QA-71: Found ${initialCount} activity row(s) - proceeding with deletion test`);

    // ============================================================================
    // SECTION 2: Capture First Activity and Delete It
    // ============================================================================
    console.log('🔍 Section 2: Capturing first activity and deleting it');

    const firstRow = activityRows.first();
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    const rowTestId = await firstRow.getAttribute('data-testid');
    const idMatch = rowTestId?.match(/admin-activity-row-(.+)/);
    expect(idMatch?.[1]).toBeTruthy();
    const activityId = idMatch![1];

    console.log(`📝 QA-71: Will delete activity log ID: ${activityId} (initial count: ${initialCount})`);

    // Click delete button (X icon)
    const deleteButton = page.locator(TestSelectors.adminActivityDeleteButton(activityId));
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
    await deleteButton.click();

    console.log(`✅ QA-71: Clicked delete button for activity ${activityId}`);

    // deleteActivityLog calls loadRecentActivity() which triggers a network request
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500); // Small wait for React state update

    // ============================================================================
    // SECTION 3: Verify Activity Log Removed from List
    // ============================================================================
    console.log('🔍 Section 3: Verifying activity log removed from list');

    // Verify the specific row is gone
    const deletedRow = page.locator(TestSelectors.adminActivityRow(activityId));
    const deletedRowCount = await deletedRow.count();
    expect(deletedRowCount).toBe(0);

    // Verify list count decreased (unless it was the only row and now empty)
    const newActivityRows = page.locator('[data-testid^="admin-activity-row-"]');
    const newCount = await newActivityRows.count();

    if (newCount === 0) {
      // All activities deleted, should show empty state
      const newEmptyState = page.locator(TestSelectors.adminActivityEmptyState);
      await expect(newEmptyState).toBeVisible({ timeout: 10000 });
      console.log('✅ QA-71: Activity deleted - list is now empty (empty state shown)');
    } else {
      // List still has entries, count should be one less
      expect(newCount).toBe(initialCount - 1);
      console.log(`✅ QA-71: Activity deleted - count decreased from ${initialCount} to ${newCount}`);
    }

    console.log(`✅ QA-71: Activity log ${activityId} successfully deleted and removed from list`);
  });
});
