# QA Ticket: Header Logo Navigation Works Correctly (QA-12)

## Project
QA (QA)

## Issue Type
Story

UI Test - Header Logo Navigation Works Correctly (QA-12)

**Parent Epic:** QA-4

**Links to GMP Epics:** GMP-4

---

## 📋 Description

Comprehensive test that verifies logo navigation from all pages, URL changes, browser history management, and page state preservation. Logo is always accessible in sticky header.

**Context:**
- Tests verify logo navigation from multiple pages
- Includes browser history verification
- Tests sticky header behavior
- Verifies logo is always accessible
- Logo uses React Router Link component
- Desktop viewport only (1920x1080) - Mobile testing in separate phase
- **Status:** 📝 **TO BE IMPLEMENTED** - Test file needs to be created

---

## 🎯 Test Strategy

**Focus:** Comprehensive logo navigation testing with browser history and state management

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 20-30 seconds

**Tags:** @e2e, @public, @navigation, @desktop, @development, @staging, @production

**Note:** Create test file in `tests/e2e/public/navigation/` folder. This test verifies logo navigation functionality.

### Workflow to Test:
1. Logo visibility and styling
2. Logo navigation from home page
3. Logo navigation from catalog page
4. Logo navigation from product detail page
5. Logo navigation from scrolled position
6. Browser history management
7. No cleanup needed (read-only test)

---

## UI Test

**File:** `tests/e2e/public/navigation/header-logo-navigation-works-correctly.spec.ts` (new test)

**Test Structure:** Single test with sequential steps

### Required Data-TestIds

Request the following `data-testid` attributes to be added (dev will define exact naming):

1. **Header Logo** - `data-testid="header-logo"` (already exists)
2. **Header** - `data-testid="header"` (already exists)

**Note:** If there are any flaky locators identified in the flow of the test, please add `data-testid` attributes as needed to ensure stable test automation.

---

### Test Steps

**Setup:**
- Navigate to `/` using `navigateToHome(page)`
- Wait for `networkidle` state

**Step 1: Verify Logo Visibility and Styling**
- Verify header is visible (data-testid or header element)
- Verify logo is visible (data-testid or img with alt="Logo")
- Verify logo image is loaded:
  - Check image src attribute
  - Verify image loads successfully (status < 400)
- Verify logo has alt text "Logo"
- Verify logo dimensions:
  - Height: `h-14` (56px)
  - Width: auto (maintains aspect ratio)
- Verify logo is properly positioned (left side of header)
- Verify logo maintains aspect ratio on all pages

**Step 2: Test Logo Navigation from Home**
- Navigate to `/`
- Verify logo is visible
- Hover over logo, verify cursor changes to pointer
- Click logo
- Verify URL is `/` or `/gmp-web-app/` (stays on home if already there)
- Verify page is home page
- Verify no unnecessary reload (React Router navigation)

**Step 3: Test Logo Navigation from Catalog**
- Navigate to `/catalogo` using `navigateToCatalog(page)`
- Wait for `networkidle` state
- Verify logo is visible in header
- Click logo
- Verify URL changes to `/` or `/gmp-web-app/`
- Verify home page loads correctly
- Verify navigation is smooth (React Router, no page reload)
- Verify page scrolls to top (or maintains position, depending on implementation)

**Step 4: Test Logo Navigation from Product Detail**
- Get a valid product ID from catalog (or use known test product)
- Navigate to `/producto/{productId}` using `navigateToProduct(page, productId)`
- Wait for `networkidle` state
- Verify logo is visible in header
- Click logo
- Verify URL changes to `/` or `/gmp-web-app/`
- Verify home page loads correctly
- Verify navigation is smooth

**Step 5: Test Logo Navigation from Scrolled Position**
- Navigate to `/`
- Scroll down page: `window.scrollTo(0, 1000)`
- Wait 500ms
- Verify header is sticky (y position <= 10)
- Verify logo is still visible in sticky header
- Click logo
- Verify navigation to home works
- Verify page scrolls to top (or maintains scroll position, depending on implementation)

**Step 6: Test Browser History**
- Navigate to `/catalogo`
- Click logo to go to `/`
- Verify browser back button works:
  - Click browser back button
  - Verify navigation back to `/catalogo`
  - Verify catalog page loads correctly
- Test multiple navigations:
  - Navigate to home
  - Navigate to catalog
  - Navigate to product detail
  - Click logo to go to home
  - Click browser back button
  - Verify navigation back to product detail
  - Click browser back button again
  - Verify navigation back to catalog

**Step 7: Test Logo Accessibility**
- Verify logo is always visible (not hidden by other elements)
- Verify logo is clickable from any scroll position
- Verify logo works in sticky header state
- Navigate to multiple pages, verify logo is always accessible:
  - Home page
  - Catalog page
  - Product detail page
- Verify logo maintains consistent appearance across all pages

**Step 8: Verify Logo Link Component**
- Verify logo is wrapped in React Router Link component
- Verify link has `to="/"` prop
- Verify navigation uses React Router (smooth, no page reload)
- Verify no full page refresh occurs

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**Logo Visibility:**
- Logo is visible on all pages
- Logo maintains aspect ratio (h-14, w-auto)
- Logo is always accessible in sticky header
- Logo image loads successfully

**Logo Navigation:**
- Logo navigates to home page from any page
- Navigation is smooth (React Router, no page reload)
- URL changes correctly
- Page state is preserved (or scrolls to top, depending on implementation)

**Browser History:**
- Browser history is updated correctly
- Back button works correctly
- Multiple navigations are tracked in history

**Sticky Header:**
- Logo remains accessible when header is sticky
- Logo navigation works from scrolled position

---

## Acceptance Criteria

- [ ] Logo is visible and clickable on all pages
- [ ] Logo navigates to home page from any page correctly
- [ ] Navigation is smooth and uses React Router (no page reload)
- [ ] Browser history is managed correctly
- [ ] Logo displays correctly on desktop viewport
- [ ] Logo is always accessible in sticky header
- [ ] Logo works from scrolled positions
- [ ] Logo maintains aspect ratio across all pages
- [ ] Logo image loads successfully
- [ ] No test data cleanup needed

---

**Note:** 
- This is a read-only test - no data creation or modification
- Tests verify navigation functionality, not page content
- Mobile viewport testing is in a separate phase
- Logo uses React Router Link component with `to="/"`
- Navigation is smooth (no full page reload)
- Page scroll behavior may vary (scrolls to top or maintains position)
