import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
} from '../../../utils';

/**
 * E2E Test - Admin Dashboard Update Sale Status to En Proceso Works Correctly (QA-63)
 *
 * Verifies that an admin can change the status of a sale to "En Proceso" using the
 * status dropdown in the sales list, and that the UI reflects the change.
 *
 * Based on: QA-63 Admin Dashboard Update Sale Status to En Proceso Works Correctly
 * Parent Epic: QA-18
 *
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Uses existing sales data (does not create new sales)
 * - Changes one sale's status to "en_proceso" and then restores original status
 *   to avoid leaving persistent side effects in the database.
 *
 * Tags: @regression, @e2e, @admin, @desktop, @development, @staging, @production
 */
test.describe('Admin Dashboard Update Sale Status to En Proceso Works Correctly (QA-63)', () => {
  test('should update sale status to En Proceso and reflect change in UI', {
    tag: ['@regression', '@e2e', '@admin', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Get admin credentials from environment
    // ============================================================================
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      console.log('⚠️ Skipping QA-63: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
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
    // SECTION 1: Open Sales View
    // ============================================================================
    console.log('🔍 Section 1: Opening Sales view from dashboard cards for status update');

    const viewSalesCard = page.locator(TestSelectors.adminSalesViewCard);
    await expect(viewSalesCard).toBeVisible({ timeout: 10000 });
    await viewSalesCard.click();

    const salesHeader = page.locator(TestSelectors.adminSalesViewHeader);
    await expect(salesHeader).toBeVisible({ timeout: 10000 });

    await page.waitForLoadState('networkidle');

    // Check empty state
    const emptyState = page.locator(TestSelectors.adminSalesEmptyState);
    if ((await emptyState.count()) > 0) {
      await expect(emptyState).toBeVisible();
      console.log('ℹ️ No sales available - skipping QA-63 status update test');
      test.skip(true, 'No sales available to test status update to En Proceso');
      return;
    }

    // ============================================================================
    // SECTION 2: Pick a Sale and Change Status to "en_proceso"
    // ============================================================================
    console.log('🔍 Section 2: Updating first sale status to "en_proceso" and restoring original');

    // Use the first sale card
    const salesList = page.locator(TestSelectors.adminSalesList);
    await expect(salesList).toBeVisible({ timeout: 10000 });

    const firstSaleCard = salesList.locator('[data-testid^="admin-sale-card-"]').first();
    await expect(firstSaleCard).toBeVisible({ timeout: 10000 });

    // Extract sale ID from data-testid to target status select
    const saleCardTestId = await firstSaleCard.getAttribute('data-testid');
    const saleIdMatch = saleCardTestId?.match(/admin-sale-card-(.+)/);
    if (!saleIdMatch || !saleIdMatch[1]) {
      console.log(`⚠️ Could not extract sale ID from card testid: ${saleCardTestId}`);
      test.skip(true, 'Could not extract sale ID from sale card');
      return;
    }
    const saleId = saleIdMatch[1];

    const statusSelect = page.locator(TestSelectors.adminSaleStatusSelect(saleId));
    await expect(statusSelect).toBeVisible({ timeout: 10000 });

    const originalStatus = await statusSelect.inputValue();
    console.log(`📦 Original sale status: ${originalStatus}`);

    // If already "en_proceso", temporarily change to another status then back to "en_proceso"
    if (originalStatus !== 'en_proceso') {
      // Set to en_proceso directly
      await statusSelect.selectOption('en_proceso');
      // Wait for the select value to actually change (React state update + re-render)
      await expect(statusSelect).toHaveValue('en_proceso', { timeout: 10000 });
      console.log('✅ Sale status updated to "en_proceso"');
    } else {
      // Change to pendiente then back to en_proceso to exercise control
      await statusSelect.selectOption('pendiente');
      // Wait for the select value to actually change
      await expect(statusSelect).toHaveValue('pendiente', { timeout: 10000 });
      console.log('✅ Sale status temporarily changed to "pendiente"');

      await statusSelect.selectOption('en_proceso');
      // Wait for the select value to actually change back
      await expect(statusSelect).toHaveValue('en_proceso', { timeout: 10000 });
      console.log('✅ Sale status changed back to "en_proceso"');
    }

    // Restore original status if it was not "en_proceso" to avoid persistent changes.
    // After each status update the app calls loadSales() and re-renders; wait for network
    // to settle so the restore takes effect and the assert sees the updated value.
    if (originalStatus !== 'en_proceso') {
      await statusSelect.selectOption(originalStatus);
      await page.waitForLoadState('networkidle');
      // Re-resolve locator after re-render so we assert on the current element
      const statusSelectAfterRestore = page.locator(TestSelectors.adminSaleStatusSelect(saleId));
      await expect(statusSelectAfterRestore).toHaveValue(originalStatus, { timeout: 10000 });
      console.log(`✅ Sale status restored to original value "${originalStatus}"`);
    }

    console.log('✅ QA-63 status update to "en_proceso" verified and original status restored when needed');
  });
});

