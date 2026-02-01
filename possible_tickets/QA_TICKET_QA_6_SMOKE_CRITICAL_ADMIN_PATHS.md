# QA Ticket: Smoke Test - Critical Admin Paths Require Authentication (QA-6)

## Project
QA (QA)

## Issue Type
Story

UI Test - Smoke Test - Critical Admin Paths Require Authentication (QA-6)

**Parent Epic:** QA-2

**Links to GMP Epics:** GMP-10, GMP-17

---

## 📋 Description

Comprehensive smoke test that verifies AdminLoginPage loads with functional form elements and AdminDashboardPage requires authentication with secure redirect verification. This test is implemented as two separate test cases in a single file.

**Context:**
- This is a critical smoke test for admin security
- Tests verify form elements are functional, not just visible
- Includes password visibility toggle functionality
- Verifies secure redirect behavior (no content exposure)
- Tests form input acceptance (email and password fields)
- Desktop viewport only (1920x1080) - Mobile testing in separate phase
- **Status:** ✅ **IMPLEMENTED** - Test file exists and is comprehensive

---

## 🎯 Test Strategy

**Focus:** Comprehensive health checks for admin authentication paths with form functionality and security verification

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 10-15 seconds

**Tags:** @smoke, @authentication, @admin, @desktop, @development, @staging

**Note:** Test file exists at `tests/smoke/critical-admin-paths-require-authentication.spec.ts`. This test verifies admin security and form functionality.

### Workflow to Test:
1. AdminLoginPage loads with functional form elements
2. Form input fields accept values correctly
3. Password visibility toggle functions
4. AdminDashboardPage redirects unauthenticated users securely
5. No cleanup needed (read-only tests)

---

## UI Test

**File:** `tests/smoke/critical-admin-paths-require-authentication.spec.ts` ✅ **IMPLEMENTED**

**Test Structure:** Two separate test cases in a single describe block

### Required Data-TestIds

The following `data-testid` attributes are used (some with fallback selectors):

1. **Admin Login Page** - `data-testid="admin-login-page"` (with fallback to form filter)
2. **Email Input** - `data-testid="admin-login-email-input"` (with fallback to label/placeholder)
3. **Password Input** - `data-testid="admin-login-password-input"` (with fallback to label/placeholder)
4. **Submit Button** - `data-testid="admin-login-submit-button"` (with fallback to button role)
5. **Admin Dashboard Page** - `data-testid="admin-dashboard-page"` (with fallback to text filter)

**Note:** The test uses fallback selectors when data-testid attributes are not available, ensuring robustness.

---

### Test Steps

**Test 1: AdminLoginPage Loads Correctly with Functional Form**

**Setup:**
- Navigate to `/admin/login` using `navigateToAdminLogin(page)`
- Wait for `networkidle` state

**Step 1: Verify Page Load and Basic Elements**
- Verify page title contains "admin" or "login" (case-insensitive)
- Verify "Admin Access" or "Acceso Admin" heading is visible (role heading)
- Verify login form container is visible (data-testid or form filter)
- Capture console errors (log all, don't fail on warnings)
- Wait 1 second for page to stabilize

**Step 2: Verify Email Input Field**
- Verify email input field is visible and enabled
- Verify field accepts input:
  - Click field
  - Fill with "test@example.com"
  - Verify input value matches "test@example.com"
- Verify field accepts invalid format:
  - Clear field
  - Fill with "invalid"
  - Verify input value matches "invalid" (field accepts any input)

**Step 3: Verify Password Input Field**
- Verify password input field is visible and enabled
- Verify input type is "password" (masks input by default)

**Step 4: Test Password Visibility Toggle**
- Locate toggle button (parent button or button with eye/ver text)
- If toggle button exists:
  - Fill password field with "testpassword123"
  - Click toggle button
  - Wait 300ms
  - Verify input type changes to "text" (password visible)
  - Verify input value matches "testpassword123"
  - Click toggle button again
  - Wait 300ms
  - Verify input type changes back to "password" (password masked)
  - Log success message if toggle works

**Step 5: Verify Submit Button**
- Verify submit button is visible and enabled
- Verify button text contains "Sign In", "Iniciar Sesión", or "Entrar" (case-insensitive)

**Cleanup:**
- No cleanup needed (read-only test)

---

**Test 2: AdminDashboardPage Requires Authentication and Redirects**

**Setup:**
- Clear authentication state:
  - Clear cookies: `page.context().clearCookies()`
  - Clear localStorage: `localStorage.clear()`
  - Clear sessionStorage: `sessionStorage.clear()`
- Start redirect timer
- Navigate to `/admin/dashboard` using `navigateToAdminDashboard(page)`

**Step 1: Verify Redirect Behavior**
- Wait for URL to match `/admin/login` pattern (timeout: 5 seconds)
- Stop timer, verify redirect time < 1 second
- Verify URL is `/admin/login`
- Log redirect time

**Step 2: Verify Security (No Content Exposure)**
- Verify login page is visible (data-testid or heading)
- Verify dashboard content is NOT visible:
  - Check for dashboard content (data-testid or text filter)
  - Verify count is 0 (no dashboard content exposed)
- Log success message

**Step 3: Verify Redirect Persistence**
- Navigate to dashboard again using `navigateToAdminDashboard(page)`
- Wait for URL to match `/admin/login` pattern (timeout: 5 seconds)
- Verify URL is `/admin/login`
- Log success message

**Step 4: Verify Browser Back Button**
- Click browser back button: `page.goBack()`
- Wait 500ms
- Verify current URL does NOT match `/admin/dashboard` pattern
- Log success message

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**Test 1 (AdminLoginPage Loads Correctly):**
- Page loads with all form elements functional
- Email and password fields are focusable and accept input
- Password visibility toggle works correctly (if implemented)
- Submit button is enabled and clickable
- No critical JavaScript errors

**Test 2 (AdminDashboardPage Requires Authentication):**
- Unauthenticated users are redirected to login immediately
- Redirect is secure (no dashboard content exposed)
- Redirect happens quickly (< 1 second)
- Redirect persists on repeated access attempts
- Browser history is managed correctly

---

## Acceptance Criteria

- [ ] AdminLoginPage loads with all form elements functional
- [ ] Email input field is focusable and accepts input
- [ ] Password input field masks input by default (type="password")
- [ ] Password visibility toggle functions correctly (if implemented)
- [ ] Submit button is enabled and clickable
- [ ] AdminDashboardPage redirects unauthenticated users immediately
- [ ] Redirect is secure (no dashboard content exposed)
- [ ] Redirect happens quickly (< 1 second)
- [ ] Redirect persists on repeated access attempts
- [ ] Browser back button does not access dashboard
- [ ] No critical JavaScript errors
- [ ] No test data cleanup needed

---

**Note:** 
- This is a read-only test - no actual login attempts
- Tests verify form functionality and security, not authentication flow
- Actual login testing is in separate E2E tests
- Mobile viewport testing is in a separate phase
- Test uses fallback selectors when data-testid attributes are not available

