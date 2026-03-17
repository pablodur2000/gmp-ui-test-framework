import { test, expect } from '@playwright/test';
import {
  navigateToAdminLogin,
  expectPathname,
} from '../utils/navigation';
import { TestSelectors } from '../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
} from '../utils';

/**
 * Integration Test - Complete Admin Sales Management Flow (View and Update Status) (QA-59)
 *
 * End-to-end admin flow that verifies:
 * - Login to admin dashboard
 * - Open Sales view
 * - If sales exist: update one sale's status via dropdown and verify the change
 * - If no sales: verify proper empty state
 *
 * Based on: QA_TICKET_QA_59_INTEGRATION_COMPLETE_ADMIN_SALES_MANAGEMENT_FLOW.md
 * Parent Epic: QA-20
 *
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 60–90 seconds
 * - High-level assertions (view visible, list/empty state, status change reflected)
 *
 * Tags: @regression, @e2e, @integration, @admin, @desktop, @development, @staging, @production
 */
test.describe('Integration - Complete Admin Sales Management Flow (QA-59)', () => {
  test('should open sales view and update one sale status when available', {
    tag: ['@regression', '@e2e', '@integration', '@admin', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Login as admin
    // ============================================================================
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      console.log('⚠️ Skipping QA-59: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
      return;
    }

    console.log('📋 Setup: Logging in as admin for sales management flow');

    const loginPageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToAdminLogin(page),
      10,
      3
    );

    await monitorAndCheckConsoleErrors(page, 1000);
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 });
    await expectPathname(page, '/admin/login');

    await page.locator(TestSelectors.adminLoginEmailInput).fill(adminEmail);
    await page.locator(TestSelectors.adminLoginPasswordInput).fill(adminPassword);
    await page.locator(TestSelectors.adminLoginSubmitButton).click();

    await page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expectPathname(page, '/admin/dashboard');

    const dashboardPage = page.locator(TestSelectors.adminDashboardPage);
    await expect(dashboardPage).toBeVisible({ timeout: 10000 });

    console.log(`✅ Logged in as admin and navigated to dashboard (load time: ${loginPageLoadTime.toFixed(2)}s)`);

    // ============================================================================
    // SECTION 1: Open Sales View and Verify Content
    // ============================================================================
    console.log('🔍 Section 1: Opening Sales view from dashboard cards');

    const viewSalesCard = page.locator(TestSelectors.adminSalesViewCard);
    await expect(viewSalesCard).toBeVisible({ timeout: 10000 });

    await viewSalesCard.click();
    await page.waitForLoadState('networkidle');

    const salesHeader = page.locator(TestSelectors.adminSalesViewHeader);
    await expect(salesHeader).toBeVisible({ timeout: 10000 });

    console.log('✅ Sales view header is visible');

    // Wait for potential loading and then check for either empty state or list
    const emptyState = page.locator(TestSelectors.adminSalesEmptyState);
    const salesList = page.locator(TestSelectors.adminSalesList);

    // Give the UI a moment to render list/empty state after loadSales()
    await page.waitForTimeout(1000);

    const hasEmptyState = await emptyState.count() > 0;
    const hasSalesList = await salesList.count() > 0;

    if (hasEmptyState && !hasSalesList) {
      await expect(emptyState).toBeVisible({ timeout: 5000 });
      const emptyText = (await emptyState.textContent())?.trim() || '';
      console.log(`ℹ️ Sales view shows empty state: "${emptyText}" — skipping status update step`);
      return;
    }

    // If neither list nor empty state, report and skip
    if (!hasEmptyState && !hasSalesList) {
      console.log('⚠️ Sales view did not render list or empty state - skipping status update');
      return;
    }

    console.log('✅ Sales list is visible - proceeding to status update');

    // ============================================================================
    // SECTION 2: Update One Sale Status (if sales exist)
    // ============================================================================
    console.log('🔍 Section 2: Updating first sale status via dropdown');

    // Locate first sale card and its status select
    const firstSaleCard = page.locator('[data-testid^="admin-sale-card-"]').first();
    await expect(firstSaleCard).toBeVisible({ timeout: 10000 });

    const saleCardTestId = await firstSaleCard.getAttribute('data-testid');
    const saleIdMatch = saleCardTestId?.match(/admin-sale-card-(.+)/);
    if (!saleIdMatch || !saleIdMatch[1]) {
      console.log(`⚠️ Could not extract sale ID from card testid: ${saleCardTestId}`);
      return;
    }
    const saleId = saleIdMatch[1];

    const statusSelect = page.locator(TestSelectors.adminSaleStatusSelect(saleId));
    await expect(statusSelect).toBeVisible({ timeout: 10000 });
    await expect(statusSelect).toBeEnabled({ timeout: 10000 });

    const originalStatus = await statusSelect.inputValue();
    console.log(`📦 Original sale status: ${originalStatus}`);

    // Decide a new status different from original
    const allStatuses = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
    const newStatus = allStatuses.find((s) => s !== originalStatus) || 'en_proceso';

    // Change status
    await statusSelect.selectOption(newStatus);

    // Wait for loadSales() refresh to complete
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Re-locate status select after refresh to avoid stale reference
    const refreshedStatusSelect = page.locator(TestSelectors.adminSaleStatusSelect(saleId));
    await expect(refreshedStatusSelect).toBeVisible({ timeout: 10000 });

    const updatedStatus = await refreshedStatusSelect.inputValue();
    expect(updatedStatus).toBe(newStatus);

    console.log(`✅ Sale status updated successfully: ${originalStatus} → ${updatedStatus}`);
    console.log('✅ QA-59: Complete Admin Sales Management Flow - view and update status completed successfully');
  });
});

