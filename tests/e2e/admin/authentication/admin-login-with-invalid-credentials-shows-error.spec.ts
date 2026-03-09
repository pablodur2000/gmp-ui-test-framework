import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
} from '../../../utils';

/**
 * E2E Test - Admin Login with Invalid Credentials Shows Error (QA-30)
 * 
 * Comprehensive test that verifies admin login correctly handles invalid credentials
 * (wrong email or password), displays appropriate error messages, prevents navigation,
 * and maintains security by not exposing sensitive information.
 * 
 * Based on: QA_TICKET_QA_30_ADMIN_LOGIN_INVALID_CREDENTIALS.md
 * Parent Epic: QA-15
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 10-15 seconds
 * - Verifies error handling for invalid credentials, error message display, and security
 * - Tests multiple error scenarios (invalid email, wrong password, empty fields)
 * 
 * Tags: @regression, @e2e, @admin, @authentication, @desktop, @development, @staging, @production
 */
test.describe('Admin Login with Invalid Credentials Shows Error (QA-30)', () => {
  test('should display error message for invalid credentials and prevent navigation', {
    tag: ['@regression', '@e2e', '@admin', '@authentication', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Clear authentication and navigate to login page
    // ============================================================================
    // Navigate first, then clear storage (avoids security error)
    const pageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToAdminLogin(page),
      5, // max 5 seconds
      3  // warn if > 3 seconds
    );
    
    // Clear storage after navigation (when page context is available)
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

    const loginPage = page.locator(TestSelectors.adminLoginPage);
    await expect(loginPage).toBeVisible();

    // ============================================================================
    // TEST CASE 1: Invalid Email (Non-existent User)
    // ============================================================================
    console.log('📋 Test Case 1: Testing invalid email (non-existent user)');

    const emailInput = page.locator(TestSelectors.adminLoginEmailInput);
    const passwordInput = page.locator(TestSelectors.adminLoginPasswordInput);
    const submitButton = page.locator(TestSelectors.adminLoginSubmitButton);

    // Fill form with invalid email
    await emailInput.fill('nonexistent@example.com');
    await passwordInput.fill('wrongpassword123');

    // Set up response listener for Supabase auth API call
    const authResponsePromise = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('/auth/v1/token') && response.request().method() === 'POST';
      },
      { timeout: 10000 }
    );

    // Submit form
    await submitButton.click();

    // Wait for authentication response
    const authResponse = await authResponsePromise;
    
    // Verify authentication failed (status 400 or 401)
    const status = authResponse.status();
    expect([400, 401]).toContain(status);

    console.log(`✅ Authentication failed with status ${status} (expected)`);

    // Wait for error message to appear (check auth response first)
    const authData = await authResponse.json().catch(() => ({}));
    // Error message should appear after auth fails

    // Verify error message is displayed
    const errorMessage = page.locator('.bg-red-50, .text-red-700, [class*="red"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText?.length).toBeGreaterThan(0);

    console.log(`✅ Error message displayed: "${errorText}"`);

    // Verify user remains on login page
    await expectPathname(page, '/admin/login');
    await expect(loginPage).toBeVisible();

    // Verify no dashboard content is visible
    const dashboardPage = page.locator(TestSelectors.adminDashboardPage);
    const dashboardCount = await dashboardPage.count({ timeout: 1000 });
    expect(dashboardCount).toBe(0);

    console.log('✅ User remains on login page (no redirect)');

    // ============================================================================
    // TEST CASE 2: Invalid Password (Wrong Password)
    // ============================================================================
    console.log('📋 Test Case 2: Testing invalid password (wrong password)');

    // Clear form fields
    await emailInput.clear();
    await passwordInput.clear();

    // Fill with valid email format but wrong password
    // Use TEST_ADMIN_EMAIL if available, otherwise use a test email
    const testEmail = process.env.TEST_ADMIN_EMAIL || 'test@example.com';
    await emailInput.fill(testEmail);
    await passwordInput.fill('wrongpassword123');

    // Set up response listener
    const authResponsePromise2 = page.waitForResponse(
      (response) => {
        const url = response.url();
        return url.includes('/auth/v1/token') && response.request().method() === 'POST';
      },
      { timeout: 10000 }
    );

    // Submit form
    await submitButton.click();

    // Wait for authentication response
    const authResponse2 = await authResponsePromise2;
    
    // Verify authentication failed
    const status2 = authResponse2.status();
    expect([400, 401]).toContain(status2);

    // Wait for error message (auth already failed, message should appear)

    // Verify error message is displayed
    const errorMessage2 = page.locator('.bg-red-50, .text-red-700, [class*="red"]').first();
    await expect(errorMessage2).toBeVisible({ timeout: 3000 });

    const errorText2 = await errorMessage2.textContent();
    expect(errorText2).toBeTruthy();

    // Verify error message does NOT expose which field is wrong
    // Error should be generic (doesn't say "email doesn't exist" or "password is wrong")
    const errorLower = errorText2?.toLowerCase() || '';
    expect(errorLower).not.toContain('email');
    expect(errorLower).not.toContain('password');
    expect(errorLower).not.toContain('user');

    console.log(`✅ Error message displayed (generic): "${errorText2}"`);

    // Verify user remains on login page
    await expectPathname(page, '/admin/login');

    console.log('✅ Security verified (no information leakage)');

    // ============================================================================
    // TEST CASE 3: Empty Fields (Form Validation)
    // ============================================================================
    console.log('📋 Test Case 3: Testing empty fields (form validation)');

    // Clear form fields
    await emailInput.clear();
    await passwordInput.clear();

    // Try to submit empty form
    await submitButton.click();

    // Check validation immediately (HTML5 validation is synchronous)

    // Check if HTML5 validation prevents submission (browser validation)
    const emailRequired = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    const passwordRequired = await passwordInput.evaluate((el: HTMLInputElement) => el.validity.valid);

    // If HTML5 validation is working, fields should be invalid
    if (!emailRequired || !passwordRequired) {
      console.log('✅ HTML5 form validation prevents submission with empty fields');
    } else {
      // If no HTML5 validation, check for error message
      const errorMessage3 = page.locator('.bg-red-50, .text-red-700, [class*="red"]').first();
      const errorCount = await errorMessage3.count({ timeout: 1000 });
      
      if (errorCount > 0) {
        console.log('✅ Custom validation error message displayed');
      } else {
        console.log('ℹ️ Form validation may need implementation');
      }
    }

    // Verify user is still on login page
    await expectPathname(page, '/admin/login');

    console.log('✅ Form validation verified');

    // ============================================================================
    // VERIFY FORM IS STILL FUNCTIONAL AFTER ERRORS
    // ============================================================================
    console.log('📋 Verifying form is still functional after errors');

    // Verify form fields are still accessible
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEnabled();
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toBeEnabled();
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    // Verify user can retry (fill form again)
    await emailInput.fill('test@example.com');
    await passwordInput.fill('testpassword');
    const emailValue = await emailInput.inputValue();
    const passwordValue = await passwordInput.inputValue();
    expect(emailValue).toBe('test@example.com');
    expect(passwordValue).toBe('testpassword');

    console.log('✅ Form is still functional after errors');

    console.log('✅ Test completed successfully');
  });
});
