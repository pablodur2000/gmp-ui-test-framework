# QA Ticket: Admin Login Password Visibility Toggle Works Correctly (QA-32)

## Project
QA (QA)

## Issue Type
Story

UI Test - Admin Login Password Visibility Toggle Works Correctly (QA-32)

**Parent Epic:** QA-15

**Links to GMP Epics:** GMP-10

---

## 📋 Description

Comprehensive test that verifies password visibility toggle functionality works correctly, including Eye/EyeOff icon switching, password field type changes (password/text), visual feedback, and accessibility.

**Context:**
- AdminLoginPage has password visibility toggle button (Eye/EyeOff icon)
- Toggle switches between showing and hiding password
- Uses Lucide React icons (Eye when hidden, EyeOff when visible)
- Toggle is positioned on the right side of password input field
- Desktop viewport only (1920x1080) - Mobile testing in separate phase
- **Status:** ⏳ **NOT IMPLEMENTED** - Test file needs to be created

---

## 🎯 Test Strategy

**Focus:** Verify password visibility toggle functionality, icon switching, and user experience

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 10-15 seconds

**Tags:** @e2e, @admin, @authentication, @desktop, @development, @staging, @production

**Note:** Create test file in `tests/e2e/admin/authentication/` folder. This test focuses on UI interaction and does not require authentication.

### Workflow to Test:
1. Navigate to `/admin/login`
2. Locate password input field and visibility toggle button
3. Enter password text
4. Click toggle to show password (Eye → EyeOff)
5. Verify password is visible
6. Click toggle to hide password (EyeOff → Eye)
7. Verify password is hidden
8. Verify icon changes correctly
9. No cleanup needed (no authentication)

---

## UI Test

**File:** `tests/e2e/admin/authentication/admin-login-password-visibility-toggle-works-correctly.spec.ts` (new test)

**Test Structure:** Single comprehensive test with multiple toggle interactions

### Required Data-TestIds

Request the following `data-testid` attributes to be added (dev will define exact naming):

1. **Password Input Field** - Password input field (`data-testid="admin-login-password-input"`)
2. **Password Visibility Toggle Button** - Eye/EyeOff toggle button (`data-testid="admin-login-password-toggle"`)

**Note:** If there are any flaky locators identified in the flow of the test, please add `data-testid` attributes as needed to ensure stable test automation.

---

### Test Steps

**Setup:**
- Navigate to `/admin/login` using `navigateToAdminLogin(page)`
- Wait for `networkidle` state
- Verify login page loads correctly

**Step 1: Verify Password Field and Toggle Button Initial State**
- Verify password input field is visible
- Verify password input field is enabled
- Verify password input field type is "password" (password is hidden by default)
- Locate password visibility toggle button
- Verify toggle button is visible
- Verify toggle button is enabled
- Verify toggle button shows Eye icon (password is hidden)
- Verify toggle button is positioned on the right side of password input
- Verify toggle button is clickable

**Step 2: Enter Password Text**
- Click on password input field
- Type password text (e.g., "testpassword123")
- Verify password text is entered (check input value)
- Verify password is masked (shows dots/asterisks, not actual text)
- Verify password input type is still "password"

**Step 3: Toggle to Show Password (Eye → EyeOff)**
- Click password visibility toggle button
- Wait 300ms for state change
- Verify password input type changes to "text"
- Verify password text is now visible (not masked)
- Verify actual password text is displayed (e.g., "testpassword123")
- Verify toggle button icon changes to EyeOff
- Verify EyeOff icon is visible
- Verify toggle button is still clickable

**Step 4: Toggle to Hide Password (EyeOff → Eye)**
- Click password visibility toggle button again
- Wait 300ms for state change
- Verify password input type changes back to "password"
- Verify password text is now masked again (shows dots/asterisks)
- Verify actual password text is NOT visible
- Verify toggle button icon changes back to Eye
- Verify Eye icon is visible
- Verify toggle button is still clickable

**Step 5: Verify Multiple Toggle Cycles**
- Toggle to show password (Eye → EyeOff)
- Verify password is visible
- Toggle to hide password (EyeOff → Eye)
- Verify password is hidden
- Toggle to show password again (Eye → EyeOff)
- Verify password is visible again
- Verify toggle works consistently across multiple cycles

**Step 6: Verify Toggle with Different Password Lengths**
- Clear password field
- Enter short password (e.g., "123")
- Toggle to show password
- Verify short password is visible
- Toggle to hide password
- Verify short password is hidden
- Clear password field
- Enter long password (e.g., "verylongpassword123456789")
- Toggle to show password
- Verify long password is visible
- Toggle to hide password
- Verify long password is hidden

**Step 7: Verify Toggle Accessibility**
- Verify toggle button has appropriate aria-label or title (if implemented)
- Verify toggle button is keyboard accessible (Tab key navigation)
- Verify toggle button can be activated with Enter key (if implemented)
- Verify toggle button has focus indicator when focused

**Step 8: Verify Visual Feedback**
- Verify toggle button has hover state (if implemented)
- Verify toggle button has active state (if implemented)
- Verify icon changes are smooth (no flickering)
- Verify password visibility changes are immediate (< 300ms)

**Cleanup:**
- No cleanup needed (no authentication established)
- Clear password field if needed

---

## Expected Behavior

**Initial State:**
- Password field is hidden by default (type="password")
- Toggle button shows Eye icon
- Password text is masked when typed

**Show Password (Eye → EyeOff):**
- Clicking toggle changes password type to "text"
- Password text becomes visible
- Toggle button icon changes to EyeOff
- Password value remains the same (only visibility changes)

**Hide Password (EyeOff → Eye):**
- Clicking toggle changes password type back to "password"
- Password text becomes masked again
- Toggle button icon changes back to Eye
- Password value remains the same (only visibility changes)

**Toggle Functionality:**
- Toggle works consistently across multiple cycles
- Toggle works with passwords of different lengths
- Icon changes are immediate and smooth
- Password value is preserved during toggle

**Accessibility:**
- Toggle button is keyboard accessible
- Toggle button has appropriate labels/aria attributes
- Visual feedback is clear and immediate

---

## Acceptance Criteria

- [ ] Password field is hidden by default (type="password")
- [ ] Toggle button shows Eye icon initially
- [ ] Toggle button is visible and clickable
- [ ] Clicking toggle shows password (type changes to "text")
- [ ] Toggle button icon changes to EyeOff when password is visible
- [ ] Clicking toggle again hides password (type changes back to "password")
- [ ] Toggle button icon changes back to Eye when password is hidden
- [ ] Password value is preserved during toggle
- [ ] Toggle works consistently across multiple cycles
- [ ] Toggle works with passwords of different lengths
- [ ] Toggle button is keyboard accessible
- [ ] Visual feedback is clear and immediate
- [ ] Test completes in < 15 seconds
- [ ] No cleanup needed (no authentication)

---

**Note:** 
- This test focuses on UI interaction and does not require authentication
- Password visibility toggle uses Lucide React icons (Eye/EyeOff)
- Toggle is positioned on the right side of password input field
- Desktop viewport only (1920x1080)
- Mobile testing is in a separate phase

