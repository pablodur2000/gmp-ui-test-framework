import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, navigateToAdminDashboard, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
} from '../../../utils';

/**
 * E2E Test - Admin Dashboard View Sales List Works Correctly (QA-52)
 *
 * Verifies that the admin can open the Sales view from the dashboard and see either:
 * - A proper empty state when there are no sales, or
 * - A list of sales with basic customer and status information.
 *
 * Based on: QA-52 Admin Dashboard View Sales List Works Correctly
 * Parent Epic: QA-18
 *
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Uses admin credentials from environment variables
 * - Does NOT create test sales data (relies on existing data or empty state)
 * - Uses text-based selectors for Sales view (no data-testids yet)
 *
 * Tags: @regression, @e2e, @admin, @desktop, @development, @staging, @production
 */
test.describe('Admin Dashboard View Sales List Works Correctly (QA-52)', () => {
  test('should open sales view and display either sales list or empty state', {
    tag: ['@regression', '@e2e', '@admin', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Get admin credentials from environment
    // ============================================================================
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      console.log('⚠️ Skipping QA-52: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
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
    // SECTION 1: Open Sales View from Dashboard
    // ============================================================================
    console.log('🔍 Section 1: Opening Sales view from dashboard cards');

    // Use the "Ver Ventas" / "Ocultar Ventas" card
    const viewSalesCard = page.locator(TestSelectors.adminSalesViewCard);
    await expect(viewSalesCard).toBeVisible({ timeout: 10000 });

    await viewSalesCard.click();

    // Header should change to "Ventas"
    const salesHeader = page.locator(TestSelectors.adminSalesViewHeader);
    await expect(salesHeader).toBeVisible({ timeout: 10000 });

    console.log('✅ Sales view header is visible');

    // ============================================================================
    // SECTION 2: Verify Sales List or Empty State
    // ============================================================================
    console.log('🔍 Section 2: Verifying sales list or empty state');

    // Wait for potential loading spinner to disappear (no data-testid, use generic)
    await page.waitForLoadState('networkidle');

    // Empty state
    const emptyState = page.locator(TestSelectors.adminSalesEmptyState);
    const hasEmptyState = (await emptyState.count()) > 0 && (await emptyState.isVisible());

    if (hasEmptyState) {
      await expect(emptyState).toBeVisible();
      const emptyText = await emptyState.textContent();
      console.log(`ℹ️ Sales view shows empty state: "${emptyText?.trim()}"`);
      // No further assertions if there are no sales
      return;
    }

    // Otherwise, we consider the presence of the "Leyenda de Estados" block
    // as evidence that the sales list is rendered (since it appears only when sales exist)
    const legend = page.locator(TestSelectors.adminSalesLegend);
    await expect(legend).toBeVisible({ timeout: 10000 });

    console.log('✅ Sales list is visible (legend of states found)');
  });
});

