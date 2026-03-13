import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
} from '../../../utils';

/**
 * E2E Test - Admin Dashboard Update Sale Status to Cancelado Works Correctly (QA-65)
 *
 * Verifies that an admin can change the status of a sale to "Cancelado" using the
 * status dropdown in the sales list, and that the UI reflects the change.
 *
 * Based on: QA-65 Admin Dashboard Update Sale Status to Cancelado Works Correctly
 * Parent Epic: QA-18
 *
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Uses existing sales data (does not create new sales)
 * - Changes one sale's status to "cancelado" and then restores original status
 *   to avoid leaving persistent side effects in the database.
 *
 * Tags: @regression, @e2e, @admin, @desktop, @development, @staging, @production
 */
test.describe('Admin Dashboard Update Sale Status to Cancelado Works Correctly (QA-65)', () => {
  test('should update sale status to Cancelado and reflect change in UI', {
    tag: ['@regression', '@e2e', '@admin', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Get admin credentials from environment
    // ============================================================================
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      console.log('⚠️ Skipping QA-65: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
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
      console.log('ℹ️ No sales available - skipping QA-65 status update test');
      test.skip(true, 'No sales available to test status update to Cancelado');
      return;
    }

    // ============================================================================
    // SECTION 2: Pick a Sale and Change Status to "cancelado"
    // ============================================================================
    console.log('🔍 Section 2: Updating first sale status to "cancelado" and restoring original');

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

    // If already "cancelado", temporarily change to another status then back to "cancelado"
    if (originalStatus !== 'cancelado') {
      // Set to cancelado directly
      await statusSelect.selectOption('cancelado');
      // Wait for the select value to actually change (React state update + re-render)
      await expect(statusSelect).toHaveValue('cancelado', { timeout: 10000 });
      console.log('✅ Sale status updated to "cancelado"');
    } else {
      // Change to pendiente then back to cancelado to exercise control
      await statusSelect.selectOption('pendiente');
      // Wait for the select value to actually change
      await expect(statusSelect).toHaveValue('pendiente', { timeout: 10000 });
      console.log('✅ Sale status temporarily changed to "pendiente"');

      await statusSelect.selectOption('cancelado');
      // Wait for the select value to actually change back
      await expect(statusSelect).toHaveValue('cancelado', { timeout: 10000 });
      console.log('✅ Sale status changed back to "cancelado"');
    }

    // Restore original status if it was not "cancelado" to avoid persistent changes
    if (originalStatus !== 'cancelado') {
      await statusSelect.selectOption(originalStatus);
      // Wait for the select value to actually change back to original
      await expect(statusSelect).toHaveValue(originalStatus, { timeout: 10000 });
      console.log(`✅ Sale status restored to original value "${originalStatus}"`);
    }

    console.log('✅ QA-65 status update to "cancelado" verified and original status restored when needed');
  });
});
