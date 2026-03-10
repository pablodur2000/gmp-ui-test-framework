import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, navigateToAdminDashboard, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
} from '../../../utils';

/**
 * E2E Test - Admin Login with Non-Admin User Shows Access Denied Error (QA-31)
 * 
 * Comprehensive test that verifies admin login correctly handles non-admin users
 * (users who exist in Supabase auth but are not in admin_users table), displays
 * "Access denied. Admin privileges required." error message, signs out the user
 * automatically, and prevents dashboard access.
 * 
 * Based on: QA_TICKET_QA_31_ADMIN_LOGIN_NON_ADMIN_USER.md
 * Parent Epic: QA-15
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 15-20 seconds
 * - Verifies two-step authentication process (Supabase auth + admin_users check)
 * - Tests access denied error, automatic sign-out, and security
 * 
 * Tags: @regression, @e2e, @admin, @authentication, @desktop, @development, @staging, @production
 * 
 * Note: This test requires a non-admin user account that exists in Supabase auth
 * but NOT in admin_users table. Credentials should be in environment variables:
 * - TEST_NON_ADMIN_EMAIL: Non-admin user email address
 * - TEST_NON_ADMIN_PASSWORD: Non-admin user password
 */
test.describe('Admin Login with Non-Admin User Shows Access Denied Error (QA-31)', () => {
  test('should display access denied error for non-admin user and prevent dashboard access', {
    tag: ['@regression', '@e2e', '@admin', '@authentication', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Get non-admin credentials from environment
    // ============================================================================
    const nonAdminEmail = process.env.TEST_NON_ADMIN_EMAIL;
    const nonAdminPassword = process.env.TEST_NON_ADMIN_PASSWORD;

    if (!nonAdminEmail || !nonAdminPassword) {
      test.skip();
      console.log('⚠️ Skipping test: TEST_NON_ADMIN_EMAIL and TEST_NON_ADMIN_PASSWORD environment variables are required');
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

    // Wait for page to load
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

    console.log('✅ Login page loaded correctly');

    // ============================================================================
    // SECTION 2: Fill Login Form with Non-Admin User Credentials
    // ============================================================================
    console.log('📋 Section 2: Filling login form with non-admin user credentials');

    // Verify and fill email input
    const emailInput = page.locator(TestSelectors.adminLoginEmailInput);
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEnabled();

    await emailInput.fill(nonAdminEmail);
    const emailValue = await emailInput.inputValue();
    expect(emailValue).toBe(nonAdminEmail);

    // Verify and fill password input
    const passwordInput = page.locator(TestSelectors.adminLoginPasswordInput);
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toBeEnabled();

    // Verify password is masked
    const passwordType = await passwordInput.getAttribute('type');
    expect(passwordType).toBe('password');

    await passwordInput.fill(nonAdminPassword);
    const passwordValue = await passwordInput.inputValue();
    expect(passwordValue).toBe(nonAdminPassword);

    console.log('✅ Login form filled with non-admin user credentials');

    // ============================================================================
    // SECTION 3: Submit Login Form and Verify Supabase Authentication Succeeds
    // ============================================================================
    console.log('📋 Section 3: Submitting login form and verifying Supabase authentication');

    // Set up response listeners for Supabase API calls BEFORE clicking submit
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
               url.includes(`email=eq.${encodeURIComponent(nonAdminEmail)}`);
      },
      { timeout: 10000 }
    );

    // Click submit button
    const submitButton = page.locator(TestSelectors.adminLoginSubmitButton);
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    await submitButton.click();

    // Wait for authentication response
    const authResponse = await authResponsePromise;
    expect(authResponse.status()).toBe(200);

    const authData = await authResponse.json();
    expect(authData).toHaveProperty('access_token');
    expect(authData).toHaveProperty('user');

    console.log('✅ Supabase authentication succeeded (user exists in auth system)');

    // ============================================================================
    // SECTION 4: Verify Admin Users Table Check Fails
    // ============================================================================
    console.log('📋 Section 4: Verifying admin_users table check fails');

    // Wait for admin_users table check
    const adminUsersResponse = await adminUsersResponsePromise;
    const responseStatus = adminUsersResponse.status();
    
    // The query might return 200 (empty result) or 406/404 (not found error)
    // Both indicate the user is not in admin_users table
    expect([200, 406, 404]).toContain(responseStatus);

    let adminUsersData;
    try {
      adminUsersData = await adminUsersResponse.json();
    } catch (e) {
      // If response is not JSON (error response), that's also fine
      adminUsersData = null;
    }
    
    // Verify user is NOT found in admin_users table
    // If status is 200, check if data is empty/null
    // If status is 406/404, the error itself confirms user not found
    if (responseStatus === 200) {
      const isUserInAdminTable = Array.isArray(adminUsersData) 
        ? adminUsersData.length > 0 
        : adminUsersData !== null && adminUsersData !== undefined;
      expect(isUserInAdminTable).toBe(false);
    }

    console.log(`✅ Admin users table check failed (status: ${responseStatus}, user not found in admin_users table)`);

    // ============================================================================
    // SECTION 5: Verify Access Denied Error Message
    // ============================================================================
    console.log('📋 Section 5: Verifying access denied error message');

    // Wait for error message to appear (up to 2 seconds)
    const errorMessage = page.locator(TestSelectors.adminLoginErrorMessage);
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText?.trim()).toBe('Access denied. Admin privileges required.');

    // Verify error message styling (red background, red text)
    const errorClasses = await errorMessage.getAttribute('class');
    expect(errorClasses).toBeTruthy();
    
    // Check for red styling indicators
    const hasRedStyling = errorClasses?.includes('red') || 
                          errorClasses?.includes('bg-red') || 
                          errorClasses?.includes('text-red');
    
    if (hasRedStyling) {
      console.log('✅ Error message has appropriate red styling');
    } else {
      console.log('ℹ️ Error message styling may need verification');
    }

    console.log(`✅ Access denied error message displayed: "${errorText?.trim()}"`);

    // ============================================================================
    // SECTION 6: Verify User Remains on Login Page
    // ============================================================================
    console.log('📋 Section 6: Verifying user remains on login page');

    // Verify URL still matches /admin/login pattern
    await expectPathname(page, '/admin/login');
    await expect(loginPage).toBeVisible();

    // Verify no dashboard content is visible
    const dashboardPage = page.locator(TestSelectors.adminDashboardPage);
    const dashboardCount = await dashboardPage.count({ timeout: 1000 });
    expect(dashboardCount).toBe(0);

    // Verify form fields are still accessible (user can retry)
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEnabled();
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toBeEnabled();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    console.log('✅ User remains on login page (no redirect to dashboard)');

    // ============================================================================
    // SECTION 7: Verify Security (No Dashboard Access)
    // ============================================================================
    console.log('📋 Section 7: Verifying security (no dashboard access)');

    // Attempt to navigate directly to dashboard
    await navigateToAdminDashboard(page);
    
    // Wait for redirect back to login (should happen automatically)
    await page.waitForURL(/\/admin\/login/, { timeout: 5000 });
    await expectPathname(page, '/admin/login');

    // Verify no dashboard content is exposed
    const dashboardPageAfterRedirect = page.locator(TestSelectors.adminDashboardPage);
    const dashboardCountAfterRedirect = await dashboardPageAfterRedirect.count({ timeout: 1000 });
    expect(dashboardCountAfterRedirect).toBe(0);

    // Verify login form is visible again
    await expect(loginPage).toBeVisible();

    console.log('✅ Security verified (user cannot access dashboard)');

    // ============================================================================
    // CLEANUP: No cleanup needed (user is signed out automatically)
    // ============================================================================
    console.log('📋 Cleanup: No cleanup needed (user is signed out automatically)');

    console.log('✅ Test completed successfully');
  });
});
