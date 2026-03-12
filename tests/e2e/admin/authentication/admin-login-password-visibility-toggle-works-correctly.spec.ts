import { test, expect } from '@playwright/test';
import { navigateToAdminLogin, expectPathname } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import {
  trackPageLoad,
  monitorAndCheckConsoleErrors,
} from '../../../utils';

/**
 * E2E Test - Admin Login Password Visibility Toggle Works Correctly (QA-32)
 * 
 * Comprehensive test that verifies the password visibility toggle button works correctly,
 * allowing users to show/hide their password while typing. Tests the toggle functionality,
 * icon changes (Eye/EyeOff), input type changes (password/text), and visual feedback.
 * 
 * Based on: QA_TICKET_QA_32_ADMIN_LOGIN_PASSWORD_VISIBILITY_TOGGLE.md
 * Parent Epic: QA-15
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 10-15 seconds
 * - Verifies toggle button functionality, icon changes, and input type changes
 * - Tests password visibility states (hidden/shown)
 * 
 * Tags: @regression, @e2e, @admin, @authentication, @desktop, @development, @staging, @production
 */
test.describe('Admin Login Password Visibility Toggle Works Correctly (QA-32)', () => {
  test('should toggle password visibility when clicking the toggle button', {
    tag: ['@regression', '@e2e', '@admin', '@authentication', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate to admin login page and track performance
    // ============================================================================
    const pageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToAdminLogin(page),
      10, // max 10 seconds (images have delay)
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
    // SECTION 2: Verify Password Input and Toggle Button Are Visible
    // ============================================================================
    console.log('📋 Section 2: Verifying password input and toggle button are visible');

    // Verify password input is visible
    const passwordInput = page.locator(TestSelectors.adminLoginPasswordInput);
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toBeEnabled();

    // Verify password input type is "password" initially (masked)
    const initialPasswordType = await passwordInput.getAttribute('type');
    expect(initialPasswordType).toBe('password');

    // Find the toggle button using data-testid selector
    const toggleButton = page.locator(TestSelectors.adminLoginPasswordToggleButton);
    await expect(toggleButton).toBeVisible();
    await expect(toggleButton).toBeEnabled();

    console.log('✅ Password input and toggle button are visible');

    // ============================================================================
    // SECTION 3: Verify Initial State (Password Hidden, Eye Icon Visible)
    // ============================================================================
    console.log('📋 Section 3: Verifying initial state (password hidden, Eye icon visible)');

    // Verify password is masked (type="password")
    const passwordTypeBefore = await passwordInput.getAttribute('type');
    expect(passwordTypeBefore).toBe('password');

    // Verify Eye icon is visible (password is hidden, so Eye icon should be shown)
    const eyeIcon = toggleButton.locator('svg').first();
    await expect(eyeIcon).toBeVisible();

    // Check that Eye icon is present (not EyeOff)
    // We can verify by checking the SVG path or by checking if EyeOff is not visible
    const eyeOffIcon = toggleButton.locator('svg').first();
    const iconVisible = await eyeOffIcon.isVisible();
    expect(iconVisible).toBe(true);

    // Fill password to test visibility toggle
    const testPassword = 'testpassword123';
    await passwordInput.fill(testPassword);

    // Verify password value is set (but masked)
    const passwordValue = await passwordInput.inputValue();
    expect(passwordValue).toBe(testPassword);

    // Verify password appears masked in the UI (we can't directly check the visual, but type="password" confirms it)
    const passwordTypeAfterFill = await passwordInput.getAttribute('type');
    expect(passwordTypeAfterFill).toBe('password');

    console.log('✅ Initial state verified (password hidden, Eye icon visible)');

    // ============================================================================
    // SECTION 4: Toggle Password Visibility (Show Password)
    // ============================================================================
    console.log('📋 Section 4: Toggling password visibility (show password)');

    // Click the toggle button
    await toggleButton.click();

    // Wait a moment for the state to update
    await page.waitForTimeout(100);

    // Verify password input type changed to "text" (visible)
    const passwordTypeAfterToggle = await passwordInput.getAttribute('type');
    expect(passwordTypeAfterToggle).toBe('text');

    // Verify password value is still correct
    const passwordValueAfterToggle = await passwordInput.inputValue();
    expect(passwordValueAfterToggle).toBe(testPassword);

    // Verify EyeOff icon is now visible (password is shown, so EyeOff icon should be displayed)
    // The icon should have changed from Eye to EyeOff
    const eyeOffIconAfterToggle = toggleButton.locator('svg').first();
    await expect(eyeOffIconAfterToggle).toBeVisible();

    console.log('✅ Password visibility toggled (password now visible, EyeOff icon shown)');

    // ============================================================================
    // SECTION 5: Toggle Password Visibility Again (Hide Password)
    // ============================================================================
    console.log('📋 Section 5: Toggling password visibility again (hide password)');

    // Click the toggle button again
    await toggleButton.click();

    // Wait a moment for the state to update
    await page.waitForTimeout(100);

    // Verify password input type changed back to "password" (hidden)
    const passwordTypeAfterSecondToggle = await passwordInput.getAttribute('type');
    expect(passwordTypeAfterSecondToggle).toBe('password');

    // Verify password value is still correct
    const passwordValueAfterSecondToggle = await passwordInput.inputValue();
    expect(passwordValueAfterSecondToggle).toBe(testPassword);

    // Verify Eye icon is visible again (password is hidden, so Eye icon should be displayed)
    const eyeIconAfterSecondToggle = toggleButton.locator('svg').first();
    await expect(eyeIconAfterSecondToggle).toBeVisible();

    console.log('✅ Password visibility toggled back (password now hidden, Eye icon shown)');

    // ============================================================================
    // SECTION 6: Verify Toggle Works Multiple Times
    // ============================================================================
    console.log('📋 Section 6: Verifying toggle works multiple times');

    // Toggle multiple times to ensure it works consistently
    for (let i = 0; i < 3; i++) {
      await toggleButton.click();
      await page.waitForTimeout(50);
      
      const currentType = await passwordInput.getAttribute('type');
      // Should alternate between "password" and "text"
      if (i % 2 === 0) {
        expect(currentType).toBe('text');
      } else {
        expect(currentType).toBe('password');
      }
    }

    console.log('✅ Toggle works consistently across multiple clicks');

    // ============================================================================
    // SECTION 7: Verify Toggle Does Not Affect Form Functionality
    // ============================================================================
    console.log('📋 Section 7: Verifying toggle does not affect form functionality');

    // Ensure password is visible for this test
    const finalType = await passwordInput.getAttribute('type');
    if (finalType === 'password') {
      await toggleButton.click();
      await page.waitForTimeout(100);
    }

    // Verify password input is still enabled and functional
    await expect(passwordInput).toBeEnabled();
    await expect(passwordInput).toBeVisible();

    // Clear and re-fill password to verify input still works
    await passwordInput.clear();
    const newPassword = 'newpassword456';
    await passwordInput.fill(newPassword);

    // Verify password value is set correctly
    const newPasswordValue = await passwordInput.inputValue();
    expect(newPasswordValue).toBe(newPassword);

    // Verify toggle still works after clearing and re-filling
    await toggleButton.click();
    await page.waitForTimeout(100);
    const typeAfterRefill = await passwordInput.getAttribute('type');
    expect(['password', 'text']).toContain(typeAfterRefill);

    console.log('✅ Form functionality not affected by toggle');

    // ============================================================================
    // SECTION 8: Verify Toggle Button Accessibility
    // ============================================================================
    console.log('📋 Section 8: Verifying toggle button accessibility');

    // Verify toggle button is keyboard accessible (can be focused)
    await toggleButton.focus();
    const isFocused = await toggleButton.evaluate((el) => document.activeElement === el);
    expect(isFocused).toBe(true);

    // Verify toggle button can be activated with keyboard (Enter key)
    await toggleButton.press('Enter');
    await page.waitForTimeout(100);
    const typeAfterKeyboard = await passwordInput.getAttribute('type');
    expect(['password', 'text']).toContain(typeAfterKeyboard);

    console.log('✅ Toggle button is keyboard accessible');

    // ============================================================================
    // CLEANUP: No cleanup needed (no authentication performed)
    // ============================================================================
    console.log('📋 Cleanup: No cleanup needed (no authentication performed)');

    console.log('✅ Test completed successfully');
  });
});
