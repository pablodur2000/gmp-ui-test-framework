import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
} from '../../../utils';
import { createTestSale, cleanupTestSale } from '../../../utils/supabase-cleanup';

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
 * - Creates isolated test sale for status update
 * - Changes test sale's status to "en_proceso" and then cleans up
 *
 * Tags: @regression, @e2e, @admin, @desktop, @development, @staging, @production
 */
test.describe('Admin Dashboard Update Sale Status to En Proceso Works Correctly (QA-63)', () => {
  // Store test sale ID for cleanup
  let testSaleId: string | null = null;

  // Cleanup after each test - CRITICAL: Always clean up test sale, even if test fails
  test.afterEach(async () => {
    if (testSaleId) {
      console.log(`🧹 Cleanup: Removing test sale ${testSaleId}`);
      const result = await cleanupTestSale(testSaleId);
      if (result.success) {
        console.log(`✅ Cleanup: Test sale ${testSaleId} removed successfully`);
      } else {
        console.log(`ℹ️ Sale ${testSaleId} not found (may have been already deleted)`);
      }
      testSaleId = null;
    }
  });

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
    // SETUP: Create isolated test sale for status update
    // ============================================================================
    console.log('📦 Creating isolated test sale for status update...');
    const timestamp = Date.now();
    const testSale = await createTestSale({
      customer_name: `QA-63 Test Customer ${timestamp}`,
      customer_email: `test-qa63-${timestamp}@example.com`,
      total_amount: 5000,
      status: 'pendiente', // Start with different status to test update
      notes: 'Test sale for QA-63 status update test'
    });

    if (!testSale.success || !testSale.saleId) {
      test.skip();
      console.log(`⚠️ Skipping QA-63: Failed to create test sale: ${testSale.error}`);
      return;
    }

    testSaleId = testSale.saleId;
    console.log(`✅ Created test sale: ${testSaleId}`);

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

    // Wait for the test sale to appear in the list (with retries)
    let testSaleCard = page.locator(TestSelectors.adminSaleCard(testSaleId));
    let attempts = 0;
    const maxAttempts = 5;
    
    while (attempts < maxAttempts && (await testSaleCard.count()) === 0) {
      await page.waitForTimeout(2000);
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      testSaleCard = page.locator(TestSelectors.adminSaleCard(testSaleId));
      attempts++;
    }

    // ============================================================================
    // SECTION 2: Find Test Sale and Change Status to "en_proceso"
    // ============================================================================
    console.log('🔍 Section 2: Finding test sale and updating status to "en_proceso"');

    // Find our test sale by ID
    await expect(testSaleCard).toBeVisible({ timeout: 10000 });

    const statusSelect = page.locator(TestSelectors.adminSaleStatusSelect(testSaleId));
    await expect(statusSelect).toBeVisible({ timeout: 10000 });

    const originalStatus = await statusSelect.inputValue();
    console.log(`📦 Test sale status: ${originalStatus} (expected: pendiente)`);

    // Update to "en_proceso"
    await statusSelect.selectOption('en_proceso');
    // Wait for the select value to actually change (React state update + re-render)
    await expect(statusSelect).toHaveValue('en_proceso', { timeout: 10000 });
    console.log('✅ Test sale status updated to "en_proceso"');

    console.log('✅ QA-63 status update to "en_proceso" verified');
  });
});

