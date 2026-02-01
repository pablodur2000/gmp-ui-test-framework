# QA Ticket: Admin Login with Valid Credentials Works Correctly (QA-29)

## Project
QA (QA)

## Issue Type
Story

UI Test - Admin Login with Valid Credentials Works Correctly (QA-29)

**Parent Epic:** QA-15

**Links to GMP Epics:** GMP-10

---

## 📋 Description

Comprehensive test that verifies admin login works correctly with valid admin credentials, including Supabase authentication, admin_users table verification, successful navigation to dashboard, and session management.

**Context:**
- AdminLoginPage uses Supabase authentication (`signInWithPassword`)
- After successful auth, checks `admin_users` table to verify admin privileges
- Redirects to `/admin/dashboard` on successful login
- Requires valid admin credentials (email and password)
- Desktop viewport only (1920x1080) - Mobile testing in separate phase
- **Status:** ⏳ **NOT IMPLEMENTED** - Test file needs to be created

---

## 🎯 Test Strategy

**Focus:** Verify successful admin login flow with valid credentials, authentication, and navigation

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 15-20 seconds

**Tags:** @e2e, @admin, @authentication, @desktop, @development, @staging, @production

**Note:** Create test file in `tests/e2e/admin/authentication/` folder. This test requires valid admin credentials from environment variables or test data setup.

### Workflow to Test:
1. Navigate to `/admin/login`
2. Fill in valid admin email and password
3. Submit login form
4. Verify Supabase authentication succeeds
5. Verify admin_users table check passes
6. Verify redirect to `/admin/dashboard`
7. Verify dashboard loads correctly
8. Cleanup: Sign out after test

---

## UI Test

**File:** `tests/e2e/admin/authentication/admin-login-with-valid-credentials-works-correctly.spec.ts` (new test)

**Test Structure:** Single comprehensive test with multiple verification steps

### Required Data-TestIds

Request the following `data-testid` attributes to be added (dev will define exact naming):

1. **Admin Login Page Container** - Main page container (`data-testid="admin-login-page"`)
2. **Email Input Field** - Email input field (`data-testid="admin-login-email-input"`)
3. **Password Input Field** - Password input field (`data-testid="admin-login-password-input"`)
4. **Password Visibility Toggle Button** - Eye/EyeOff toggle button (`data-testid="admin-login-password-toggle"`)
5. **Submit Button** - Login submit button (`data-testid="admin-login-submit-button"`)
6. **Error Message Container** - Error message display area (`data-testid="admin-login-error-message"`)
7. **Loading Spinner** - Loading indicator during login (`data-testid="admin-login-loading"`)

**Note:** If there are any flaky locators identified in the flow of the test, please add `data-testid` attributes as needed to ensure stable test automation.

---

### Test Steps

**Setup:**
- Clear any existing authentication (localStorage, cookies, sessionStorage)
- Navigate to `/admin/login` using `navigateToAdminLogin(page)`
- Wait for `networkidle` state
- Get admin credentials from environment variables or test config

**Step 1: Verify Login Page Loads**
- Verify page title contains "Admin Login" or "admin"
- Verify URL matches `/admin/login` pattern
- Verify "Admin Access" heading is visible
- Verify login form is visible
- Verify Lock icon is visible in header
- Capture console errors (log all, fail on critical errors only)

**Step 2: Fill Login Form with Valid Credentials**
- Verify email input field is visible and enabled
- Fill email input with valid admin email (from test config)
- Verify email value is set correctly
- Verify password input field is visible and enabled
- Fill password input with valid admin password (from test config)
- Verify password is masked (type="password")

**Step 3: Submit Login Form and Verify Authentication**
- Set up response listener BEFORE clicking submit
- Click submit button
- Wait for Supabase auth API call
- **Supabase Verification:** Intercept POST request to `/auth/v1/token`
  - Verify request includes email and password
  - Verify response status is `200`
  - Verify response contains `access_token` and `user` data
- Verify loading spinner appears during submission
- Wait for navigation or error message

**Step 4: Verify Admin Users Table Check**
- **Supabase Verification:** Intercept GET request to `/rest/v1/admin_users?email=eq.{email}`
  - Verify request is made after successful auth
  - Verify response status is `200`
  - Verify response contains admin user record
  - Log admin user data if available

**Step 5: Verify Successful Navigation**
- Wait for URL to change to `/admin/dashboard`
- Verify redirect happens (URL matches `/admin/dashboard` pattern)
- Verify redirect time is acceptable (< 2 seconds)
- Verify dashboard page loads (check for dashboard content)
- Verify no error messages are displayed
- Verify user is authenticated (check session)

**Step 6: Verify Dashboard Access**
- Verify dashboard heading or content is visible
- Verify user is logged in (check for admin-specific content)
- Log success message

**Cleanup:**
- Sign out from admin dashboard
- Clear authentication state
- Verify redirect back to login page or home page

---

## Expected Behavior

**Login Flow:**
- Login form loads correctly with all elements visible
- Form accepts valid credentials
- Supabase authentication succeeds (API verified)
- Admin_users table check passes (API verified)
- User is redirected to dashboard successfully
- Dashboard loads with admin content
- No error messages displayed
- Session is established correctly

**API Calls:**
- Supabase auth API call succeeds with status 200
- Admin_users table query succeeds with status 200
- Admin user record is found and verified

**Navigation:**
- Redirect to dashboard happens automatically
- Redirect time is acceptable (< 2 seconds)
- Dashboard page loads correctly
- User session is maintained

---

## Acceptance Criteria

- [ ] Login page loads successfully with all form elements
- [ ] Email and password fields accept input correctly
- [ ] Submit button is clickable and triggers form submission
- [ ] Supabase authentication API call succeeds (status 200)
- [ ] Admin_users table check API call succeeds (status 200)
- [ ] Admin user record is found in admin_users table
- [ ] User is redirected to `/admin/dashboard` after successful login
- [ ] Dashboard page loads correctly
- [ ] No error messages are displayed
- [ ] User session is established
- [ ] Test completes in < 20 seconds
- [ ] Cleanup: User is signed out after test

---

**Note:** 
- This test requires valid admin credentials (email and password)
- Credentials should be stored in environment variables or test configuration
- Test should handle credential setup/teardown if needed
- Supabase API calls are verified to ensure authentication flow works correctly
- Desktop viewport only (1920x1080)
- Mobile testing is in a separate phase

