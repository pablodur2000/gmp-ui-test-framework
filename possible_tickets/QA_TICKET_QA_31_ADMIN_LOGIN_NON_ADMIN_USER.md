# QA Ticket: Admin Login with Non-Admin User Shows Access Denied Error (QA-31)

## Project
QA (QA)

## Issue Type
Story

UI Test - Admin Login with Non-Admin User Shows Access Denied Error (QA-31)

**Parent Epic:** QA-15

**Links to GMP Epics:** GMP-10

---

## 📋 Description

Comprehensive test that verifies admin login correctly handles non-admin users (users who exist in Supabase auth but are not in admin_users table), displays "Access denied. Admin privileges required." error message, signs out the user automatically, and prevents dashboard access.

**Context:**
- AdminLoginPage uses two-step verification: Supabase auth + admin_users table check
- Even if Supabase authentication succeeds, user must be in admin_users table
- Non-admin users should see specific error: "Access denied. Admin privileges required."
- User is automatically signed out if not in admin_users table
- Desktop viewport only (1920x1080) - Mobile testing in separate phase
- **Status:** ⏳ **NOT IMPLEMENTED** - Test file needs to be created

---

## 🎯 Test Strategy

**Focus:** Verify admin_users table check, access denied error, automatic sign-out, and security

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 15-20 seconds

**Tags:** @e2e, @admin, @authentication, @desktop, @development, @staging, @production

**Note:** Create test file in `tests/e2e/admin/authentication/` folder. This test requires a non-admin user account that exists in Supabase auth but not in admin_users table.

### Workflow to Test:
1. Navigate to `/admin/login`
2. Fill in valid non-admin user credentials (exists in Supabase auth, not in admin_users)
3. Submit login form
4. Verify Supabase authentication succeeds
5. Verify admin_users table check fails (user not found)
6. Verify "Access denied. Admin privileges required." error is displayed
7. Verify user is automatically signed out
8. Verify user remains on login page
9. No cleanup needed (user is signed out automatically)

---

## UI Test

**File:** `tests/e2e/admin/authentication/admin-login-with-non-admin-user-shows-access-denied-error.spec.ts` (new test)

**Test Structure:** Single comprehensive test with multiple verification steps

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
- Get non-admin user credentials from test config (user exists in Supabase auth but NOT in admin_users table)

**Step 1: Verify Login Page Loads**
- Verify page title contains "Admin Login" or "admin"
- Verify URL matches `/admin/login` pattern
- Verify "Admin Access" heading is visible
- Verify login form is visible
- Capture console errors (log all, fail on critical errors only)

**Step 2: Fill Login Form with Non-Admin User Credentials**
- Verify email input field is visible and enabled
- Fill email input with non-admin user email (from test config)
- Verify email value is set correctly
- Verify password input field is visible and enabled
- Fill password input with non-admin user password (from test config)
- Verify password is masked (type="password")

**Step 3: Submit and Verify Supabase Authentication Succeeds**
- Set up response listener BEFORE clicking submit
- Click submit button
- Wait for Supabase auth API call
- **Supabase Verification:** Intercept POST request to `/auth/v1/token`
  - Verify request includes non-admin user email and password
  - Verify response status is `200` (authentication succeeds)
  - Verify response contains `access_token` and `user` data
  - Log authentication success
- Verify loading spinner appears during submission

**Step 4: Verify Admin Users Table Check Fails**
- Wait for admin_users table check API call
- **Supabase Verification:** Intercept GET request to `/rest/v1/admin_users?email=eq.{email}`
  - Verify request is made after successful auth
  - Verify response status is `200` (query succeeds)
  - Verify response is empty array OR contains no matching records
  - Log that user is not found in admin_users table

**Step 5: Verify Automatic Sign-Out**
- **Supabase Verification:** Intercept POST request to `/auth/v1/logout` (if called)
  - Verify sign-out API call is made (if implemented)
  - OR verify session is cleared (check localStorage/sessionStorage)
- Verify user session is cleared
- Verify user is no longer authenticated

**Step 6: Verify Access Denied Error Message**
- Wait for error message to appear (wait up to 2 seconds)
- Verify error message container is visible
- Verify error message text is displayed
- Verify error message contains exact text: "Access denied. Admin privileges required."
- Verify error message styling (red background, red text, border)
- Verify error message is clear and specific

**Step 7: Verify User Remains on Login Page**
- Verify URL still matches `/admin/login` pattern
- Verify user is NOT redirected to dashboard
- Verify login form is still visible
- Verify "Admin Access" heading is still visible
- Verify no dashboard content is visible
- Verify form fields are still accessible (user can retry)

**Step 8: Verify Security (No Dashboard Access)**
- Attempt to navigate directly to `/admin/dashboard`
- Verify redirect back to `/admin/login` happens
- Verify no dashboard content is exposed
- Verify user cannot access admin features

**Cleanup:**
- No cleanup needed (user is signed out automatically)
- Clear form fields if needed

---

## Expected Behavior

**Authentication Flow:**
- Supabase authentication succeeds (user exists in auth system)
- Admin_users table check fails (user not found in admin_users table)
- User is automatically signed out
- Access denied error is displayed
- User remains on login page

**Error Message:**
- Error message appears within 2 seconds
- Error message contains exact text: "Access denied. Admin privileges required."
- Error message is visible and readable
- Error message has appropriate styling (red background, red text)

**Security:**
- User cannot access dashboard even though Supabase auth succeeded
- User is automatically signed out
- Session is cleared
- No dashboard content is exposed
- User cannot bypass admin_users check

**API Calls:**
- Supabase auth API call succeeds (status 200)
- Admin_users table query succeeds but returns no records (status 200, empty array)
- Sign-out API call is made (if implemented)

---

## Acceptance Criteria

- [ ] Login form accepts non-admin user credentials
- [ ] Supabase authentication API call succeeds (status 200)
- [ ] Admin_users table check API call succeeds but returns no records
- [ ] "Access denied. Admin privileges required." error message is displayed
- [ ] Error message is visible and readable
- [ ] Error message has appropriate styling
- [ ] User is automatically signed out
- [ ] User session is cleared
- [ ] User remains on login page (no redirect)
- [ ] User cannot access dashboard
- [ ] Test completes in < 20 seconds
- [ ] No cleanup needed (user is signed out automatically)

---

**Note:** 
- This test requires a non-admin user account that exists in Supabase auth but NOT in admin_users table
- User credentials should be stored in environment variables or test configuration
- This test verifies the two-step authentication process (auth + admin check)
- Desktop viewport only (1920x1080)
- Mobile testing is in a separate phase

