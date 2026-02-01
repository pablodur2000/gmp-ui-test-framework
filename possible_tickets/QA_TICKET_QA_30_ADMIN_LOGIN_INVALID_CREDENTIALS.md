# QA Ticket: Admin Login with Invalid Credentials Shows Error (QA-30)

## Project
QA (QA)

## Issue Type
Story

UI Test - Admin Login with Invalid Credentials Shows Error (QA-30)

**Parent Epic:** QA-15

**Links to GMP Epics:** GMP-10

---

## 📋 Description

Comprehensive test that verifies admin login correctly handles invalid credentials (wrong email or password), displays appropriate error messages, prevents navigation, and maintains security by not exposing sensitive information.

**Context:**
- AdminLoginPage validates credentials via Supabase authentication
- Invalid credentials should show error message without exposing details
- User should remain on login page (no redirect)
- Error message should be clear and actionable
- Desktop viewport only (1920x1080) - Mobile testing in separate phase
- **Status:** ⏳ **NOT IMPLEMENTED** - Test file needs to be created

---

## 🎯 Test Strategy

**Focus:** Verify error handling for invalid credentials, error message display, and security

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 10-15 seconds

**Tags:** @e2e, @admin, @authentication, @desktop, @development, @staging, @production

**Note:** Create test file in `tests/e2e/admin/authentication/` folder. This test uses invalid credentials to verify error handling.

### Workflow to Test:
1. Navigate to `/admin/login`
2. Fill in invalid email or password
3. Submit login form
4. Verify Supabase authentication fails
5. Verify error message is displayed
6. Verify user remains on login page
7. Verify form fields are cleared or preserved appropriately
8. No cleanup needed (no authentication established)

---

## UI Test

**File:** `tests/e2e/admin/authentication/admin-login-with-invalid-credentials-shows-error.spec.ts` (new test)

**Test Structure:** Single comprehensive test with multiple error scenarios

### Required Data-TestIds

Request the following `data-testid` attributes to be added (dev will define exact naming):

1. **Admin Login Page Container** - Main page container (`data-testid="admin-login-page"`)
2. **Email Input Field** - Email input field (`data-testid="admin-login-email-input"`)
3. **Password Input Field** - Password input field (`data-testid="admin-login-password-input"`)
4. **Submit Button** - Login submit button (`data-testid="admin-login-submit-button"`)
5. **Error Message Container** - Error message display area (`data-testid="admin-login-error-message"`)
6. **Loading Spinner** - Loading indicator during login (`data-testid="admin-login-loading"`)

**Note:** If there are any flaky locators identified in the flow of the test, please add `data-testid` attributes as needed to ensure stable test automation.

---

### Test Steps

**Setup:**
- Clear any existing authentication (localStorage, cookies, sessionStorage)
- Navigate to `/admin/login` using `navigateToAdminLogin(page)`
- Wait for `networkidle` state

**Test Case 1: Invalid Email (Non-existent User)**

**Step 1: Fill Form with Invalid Email**
- Verify email input field is visible and enabled
- Fill email input with invalid email (e.g., "nonexistent@example.com")
- Verify password input field is visible and enabled
- Fill password input with any password (e.g., "wrongpassword123")
- Verify form is ready to submit

**Step 2: Submit and Verify Authentication Failure**
- Set up response listener BEFORE clicking submit
- Click submit button
- Wait for Supabase auth API call
- **Supabase Verification:** Intercept POST request to `/auth/v1/token`
  - Verify request includes invalid email and password
  - Verify response status is `400` or `401` (authentication error)
  - Verify response contains error message
  - Log error details if available
- Verify loading spinner appears and then disappears

**Step 3: Verify Error Message Display**
- Wait for error message to appear (wait up to 2 seconds)
- Verify error message container is visible
- Verify error message text is displayed
- Verify error message contains appropriate text (e.g., "Invalid login credentials" or similar)
- Verify error message styling (red background, red text, border)
- Verify error message is clear and actionable

**Step 4: Verify User Remains on Login Page**
- Verify URL still matches `/admin/login` pattern
- Verify user is NOT redirected to dashboard
- Verify login form is still visible
- Verify "Admin Access" heading is still visible
- Verify no dashboard content is visible

**Test Case 2: Invalid Password (Wrong Password for Valid Email)**

**Step 1: Fill Form with Valid Email but Wrong Password**
- Clear form fields
- Fill email input with valid admin email (if available in test config)
- Fill password input with wrong password (e.g., "wrongpassword123")
- Verify form is ready to submit

**Step 2: Submit and Verify Authentication Failure**
- Set up response listener BEFORE clicking submit
- Click submit button
- Wait for Supabase auth API call
- **Supabase Verification:** Intercept POST request to `/auth/v1/token`
  - Verify request includes valid email but wrong password
  - Verify response status is `400` or `401` (authentication error)
  - Verify response contains error message
- Verify loading spinner appears and then disappears

**Step 3: Verify Error Message Display**
- Wait for error message to appear
- Verify error message container is visible
- Verify error message text is displayed
- Verify error message contains appropriate text
- Verify error message does NOT expose which field is wrong (email vs password)

**Step 4: Verify Security (No Information Leakage)**
- Verify error message does NOT reveal if email exists or not
- Verify error message does NOT reveal password requirements
- Verify error message is generic enough to prevent user enumeration
- Verify form fields are still accessible (user can retry)

**Test Case 3: Empty Fields (Form Validation)**

**Step 1: Attempt Submit with Empty Fields**
- Clear all form fields
- Click submit button without filling any fields
- Verify HTML5 validation prevents submission (if implemented)
- OR verify error message appears for empty fields

**Step 2: Verify Form Validation**
- If HTML5 validation: Verify browser validation message appears
- If custom validation: Verify error message is displayed
- Verify user cannot submit empty form

**Cleanup:**
- No cleanup needed (no authentication established)
- Clear form fields if needed

---

## Expected Behavior

**Invalid Credentials:**
- Login form accepts invalid credentials
- Supabase authentication API call fails (status 400/401)
- Error message is displayed clearly
- Error message does not expose sensitive information
- User remains on login page
- Form is still functional (user can retry)

**Error Message:**
- Error message appears within 2 seconds
- Error message is visible and readable
- Error message has appropriate styling (red background, red text)
- Error message text is clear and actionable
- Error message does not leak information about which field is wrong

**Security:**
- No information leakage (doesn't reveal if email exists)
- User cannot access dashboard with invalid credentials
- Form remains secure and functional

**Form Validation:**
- Empty fields are validated (HTML5 or custom)
- User cannot submit empty form
- Validation messages are clear

---

## Acceptance Criteria

- [ ] Login form accepts invalid credentials
- [ ] Supabase authentication API call fails with status 400/401
- [ ] Error message is displayed when credentials are invalid
- [ ] Error message is visible and readable
- [ ] Error message has appropriate styling (red background, red text)
- [ ] Error message does not expose sensitive information
- [ ] User remains on login page (no redirect)
- [ ] Login form is still functional after error
- [ ] Form validation works for empty fields
- [ ] Test completes in < 15 seconds
- [ ] No cleanup needed (no authentication established)

---

**Note:** 
- This test uses invalid credentials to verify error handling
- Error messages should be generic to prevent user enumeration
- Supabase API calls are verified to ensure authentication fails correctly
- Desktop viewport only (1920x1080)
- Mobile testing is in a separate phase

