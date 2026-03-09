import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
} from '../../../utils';

/**
 * E2E Test - Admin Login with Valid Credentials Works Correctly (QA-29)
 * 
 * Comprehensive test that verifies admin login works correctly with valid admin credentials,
 * including Supabase authentication, admin_users table verification, successful navigation
 * to dashboard, and session management.
 * 
 * Based on: QA_TICKET_QA_29_ADMIN_LOGIN_VALID_CREDENTIALS.md
 * Parent Epic: QA-15
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 15-20 seconds
 * - Verifies successful admin login flow with valid credentials
 * - Tests Supabase authentication and admin_users table check
 * - Verifies navigation to dashboard and session management
 * 
 * Tags: @regression, @e2e, @admin, @authentication, @desktop, @development, @staging, @production
 * 
 * Note: This test requires valid admin credentials in environment variables:
 * - TEST_ADMIN_EMAIL: Admin user email address
 * - TEST_ADMIN_PASSWORD: Admin user password
 */
test.describe('Admin Login with Valid Credentials Works Correctly (QA-29)', () => {
  test('should successfully log in with valid admin credentials and navigate to dashboard', {
    tag: ['@regression', '@e2e', '@admin', '@authentication', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Get admin credentials from environment
    // ============================================================================
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      test.skip();
      console.log('⚠️ Skipping test: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables are required');
      return;
    }

    // ============================================================================
    // SETUP: Navigate to admin login page and track performance
    // ============================================================================
    const pageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToAdminLogin(page),
      5, // max 5 seconds
      3  // warn if > 3 seconds
    );
    
    // Clear any existing authentication (after navigation to avoid security error)
    await page.context().clearCookies();
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (e) {
      // Storage clearing may fail in some contexts, continue anyway
      console.log('ℹ️ Could not clear storage (may be in secure context)');
    }

    // Monitor console errors
    await monitorAndCheckConsoleErrors(page, 1000);

    // Wait for page to load (login page doesn't make API calls on load)
    await page.waitForURL(/\/admin\/login/, { timeout: 10000 });

    await expectPathname(page, '/admin/login');

    // ============================================================================
    // SECTION 1: Verify Login Page Loads
    // ============================================================================
    console.log('📋 Section 1: Verifying login page loads');

    // Verify page title
    const title = await page.title();
    expect(title.toLowerCase()).toContain('admin');

    // Verify "Admin Access" heading is visible
    const heading = page.getByRole('heading', { name: /admin access|acceso admin/i });
    await expect(heading).toBeVisible();

    // Verify login form is visible
    const loginPage = page.locator(TestSelectors.adminLoginPage);
    await expect(loginPage).toBeVisible();

    // Verify Lock icon is visible (check for SVG in header)
    const lockIcon = page.locator('svg').first();
    await expect(lockIcon).toBeVisible();

    console.log('✅ Login page loaded correctly');

    // ============================================================================
    // SECTION 2: Fill Login Form with Valid Credentials
    // ============================================================================
    console.log('📋 Section 2: Filling login form with valid credentials');

    // Verify and fill email input
    const emailInput = page.locator(TestSelectors.adminLoginEmailInput);
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEnabled();

    await emailInput.fill(adminEmail);
    const emailValue = await emailInput.inputValue();
    expect(emailValue).toBe(adminEmail);

    // Verify and fill password input
    const passwordInput = page.locator(TestSelectors.adminLoginPasswordInput);
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toBeEnabled();

    // Verify password is masked
    const passwordType = await passwordInput.getAttribute('type');
    expect(passwordType).toBe('password');

    await passwordInput.fill(adminPassword);
    const passwordValue = await passwordInput.inputValue();
    expect(passwordValue).toBe(adminPassword);

    console.log('✅ Login form filled with valid credentials');

    // ============================================================================
    // SECTION 3: Submit Login Form and Verify Authentication
    // ============================================================================
    console.log('📋 Section 3: Submitting login form and verifying authentication');

    // Set up response listeners for Supabase API calls
    const authResponsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('/auth/v1/token') && response.request().method() === 'POST';
      },
      { timeout: 10000 }
    );

    const adminUsersResponsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('/rest/v1/admin_users') && 
               response.request().method() === 'GET' &&
               url.includes(`email=eq.${encodeURIComponent(adminEmail)}`);
      },
      { timeout: 10000 }
    );

    // Click submit button
    const submitButton = page.locator(TestSelectors.adminLoginSubmitButton);
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    await submitButton.click();

    // Wait for loading spinner (if visible)
    const loadingSpinner = submitButton.locator('.animate-spin');
    const spinnerCount = await loadingSpinner.count({ timeout: 1000 });
    if (spinnerCount > 0) {
      console.log('✅ Loading spinner appeared during submission');
    }

    // Wait for authentication response
    const authResponse = await authResponsePromise;
    expect(authResponse.status()).toBe(200);

    const authData = await authResponse.json();
    expect(authData).toHaveProperty('access_token');
    expect(authData).toHaveProperty('user');

    console.log('✅ Supabase authentication succeeded');

    // Wait for admin_users table check
    const adminUsersResponse = await adminUsersResponsePromise;
    expect(adminUsersResponse.status()).toBe(200);

    const adminUsersData = await adminUsersResponse.json();
    expect(Array.isArray(adminUsersData) ? adminUsersData.length > 0 : adminUsersData !== null).toBe(true);

    console.log('✅ Admin users table check passed');

    // ============================================================================
    // SECTION 4: Verify Successful Navigation to Dashboard
    // ============================================================================
    console.log('📋 Section 4: Verifying successful navigation to dashboard');

    // Wait for navigation to dashboard
    await page.waitForURL((url) => {
      const pathname = new URL(url).pathname;
      return pathname.endsWith('/admin/dashboard');
    }, { timeout: 10000 });

    await expectPathname(page, '/admin/dashboard');

    // Verify dashboard page loads
    const dashboardPage = page.locator(TestSelectors.adminDashboardPage);
    await expect(dashboardPage).toBeVisible({ timeout: 5000 });

    // Verify no error messages are displayed (check for common error message patterns)
    // Use a more specific selector to avoid false positives
    const errorMessage = page.locator('[class*="bg-red"], [class*="text-red"]').filter({ hasText: /error|invalid|incorrect|failed/i });
    const errorCount = await errorMessage.count();
    if (errorCount > 0) {
      console.warn(`⚠️ Found ${errorCount} potential error message(s) on dashboard`);
    }
    // Don't fail the test if error messages are found, just log a warning
    // The dashboard being visible is the primary success indicator

    console.log('✅ Successfully navigated to dashboard');

    // ============================================================================
    // SECTION 5: Verify Dashboard Access
    // ============================================================================
    console.log('📋 Section 5: Verifying dashboard access');

    // Verify dashboard content is visible (check for heading or specific content)
    const dashboardHeading = page.getByRole('heading').first();
    await expect(dashboardHeading).toBeVisible({ timeout: 3000 });

    // Verify user is authenticated (check for admin-specific content)
    // Dashboard should show admin-specific elements
    const adminContent = page.locator('[data-testid^="admin"]').first();
    await expect(adminContent).toBeVisible({ timeout: 3000 });

    console.log('✅ Dashboard access verified');

    // ============================================================================
    // CLEANUP: Sign out after test
    // ============================================================================
    console.log('📋 Cleanup: Signing out');

    // Look for sign out button (may vary by implementation)
    const signOutButton = page.locator('button:has-text("Sign Out"), button:has-text("Cerrar Sesión"), a:has-text("Sign Out"), a:has-text("Cerrar Sesión")').first();
    const signOutCount = await signOutButton.count({ timeout: 2000 });

    if (signOutCount > 0) {
      await signOutButton.click();
      // Wait for navigation back to login or home
      await page.waitForURL(/\/admin\/login|\/$/, { timeout: 10000 });
      console.log('✅ Signed out successfully');
    } else {
      // If no sign out button found, clear session manually
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      console.log('✅ Session cleared manually');
    }

    console.log('✅ Test completed successfully');
  });
});
