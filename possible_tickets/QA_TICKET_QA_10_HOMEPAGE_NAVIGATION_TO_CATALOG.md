# QA Ticket: HomePage Navigation to Catalog Works Correctly (QA-10)

## Project
QA (QA)

## Issue Type
Story

UI Test - HomePage Navigation to Catalog Works Correctly (QA-10)

**Parent Epic:** QA-3

**Links to GMP Epics:** GMP-4

---

## 📋 Description

Comprehensive test that verifies all CTA buttons on HomePage navigate to catalog correctly, including hero section CTA, CTA section button, and header CTA button.

**Context:**
- Tests verify all three CTA buttons on HomePage
- Includes hover effects and button interactions
- Verifies browser history management
- Tests navigation from different page states
- Desktop viewport only (1920x1080) - Mobile testing in separate phase
- **Status:** ✅ **IMPLEMENTED** - Test file exists and is comprehensive

---

## 🎯 Test Strategy

**Focus:** Comprehensive CTA button testing with interactions, hover effects, and navigation verification

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 30-45 seconds

**Tags:** @e2e, @public, @homepage, @navigation, @desktop, @development, @staging, @production

**Note:** Test file exists at `tests/e2e/public/home-page/home-page-navigation-to-catalog-works-correctly.spec.ts`. This test verifies all navigation paths to catalog.

### Workflow to Test:
1. Hero section CTA button works
2. CTA section button works
3. Header CTA button works
4. Navigation from different states works
5. Browser history is managed correctly
6. No cleanup needed (read-only test)

---

## UI Test

**File:** `tests/e2e/public/home-page/home-page-navigation-to-catalog-works-correctly.spec.ts` ✅ **IMPLEMENTED**

**Test Structure:** Single test with sequential sections

### Required Data-TestIds

The following `data-testid` attributes are used (some with fallback selectors):

1. **Home Hero CTA Button** - `data-testid="home-hero-cta-button"` (with fallback to button role)
2. **Home CTA Section** - `data-testid="home-cta-section"` (with fallback to section filter)
3. **Home CTA Catalog Link** - `data-testid="home-cta-catalog-link"` (with fallback to button role)

**Note:** The test uses fallback selectors when data-testid attributes are not available, ensuring robustness.

---

### Test Steps

**Setup:**
- Navigate to `/` using `navigateToHome(page)`
- Wait for `networkidle` state
- Wait 2.5 seconds for first visit animation

**Step 1: Test Hero Section CTA**
- Verify hero CTA button is visible (data-testid or button role)
- Test hover effects:
  - Get button background color before hover
  - Hover over button
  - Wait 300ms
  - Get button background color after hover
  - If colors differ, log success (hover effect detected)
- Test transform effects:
  - Get button transform before hover
  - Hover over button
  - Wait 300ms
  - Get button transform after hover
  - If transforms differ, log success (scale effect detected)
- Test navigation:
  - Click button
  - Wait for URL to match `/catalogo` pattern (timeout: 5s)
  - Verify URL matches `/catalogo` pattern
  - Log success message
- Navigate back using browser back button
- Wait 1 second

**Step 2: Test CTA Section Button**
- Navigate to home
- Wait 1 second
- Locate CTA section (data-testid or section filter)
- Scroll to CTA section (scrollIntoViewIfNeeded)
- Wait 500ms
- Verify section is visible
- Verify CTA button is visible (data-testid or button role)
- Test hover effects:
  - Get button background color before hover
  - Hover over button
  - Wait 300ms
  - Get button background color after hover
  - If colors differ, log success (hover effect detected)
- Test navigation:
  - Click button
  - Wait for URL to match `/catalogo` pattern (timeout: 5s)
  - Verify URL matches `/catalogo` pattern
  - Log success message
- Navigate back using browser back button
- Wait 1 second

**Step 3: Test Header CTA Button**
- Navigate to home
- Wait 500ms
- Locate header CTA button (button role with name matching "ver catálogo")
- If button exists:
  - Verify button is visible
  - Hover over button
  - Wait 300ms
  - Test navigation:
    - Click button
    - Wait for URL to match `/catalogo` pattern (timeout: 5s)
    - Verify URL matches `/catalogo` pattern
    - Log success message

**Step 4: Test Navigation from Different States**
- Navigate to home
- Wait 500ms
- Scroll down page: `window.scrollTo(0, 1000)`
- Wait 500ms
- If header CTA button exists:
  - Click header CTA button
  - Wait for URL to match `/catalogo` pattern (timeout: 5s)
  - Verify URL matches `/catalogo` pattern
  - Log success message (header CTA works from scrolled position)
- If button doesn't exist:
  - Log info message (header CTA may not be implemented yet)

**Step 5: Test Browser History**
- Navigate to home
- Wait 500ms
- Verify hero CTA button is visible
- Click hero CTA button
- Wait for URL to match `/catalogo` pattern (timeout: 5s)
- Click browser back button
- Wait 1 second
- Verify URL matches `/gmp-web-app/?$` pattern
- Log success message (browser history management works)

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**Hero Section CTA:**
- Button is visible and clickable
- Hover effects work correctly (background color and transform changes)
- Navigation to catalog works smoothly
- Navigation uses React Router (no page reload)

**CTA Section Button:**
- Button is visible after scrolling
- Hover effects work correctly
- Navigation to catalog works smoothly

**Header CTA Button:**
- Button is always visible (sticky header)
- Navigation works from any scroll position
- Navigation to catalog works smoothly

**Browser History:**
- Browser history is updated correctly
- Back button works correctly
- Navigation state is preserved

---

## Acceptance Criteria

- [ ] All three CTA buttons navigate to catalog page correctly
- [ ] All buttons have correct styling and hover effects
- [ ] Navigation is smooth (React Router, no page reload)
- [ ] Buttons are visible and accessible
- [ ] Buttons work from any page state (scrolled or not)
- [ ] Browser history is managed correctly
- [ ] All buttons work on desktop viewport
- [ ] No test data cleanup needed

---

**Note:** 
- This is a read-only test - no data creation or modification
- Tests verify navigation functionality, not catalog page content
- Mobile viewport testing is in a separate phase
- Test gracefully handles missing elements (header CTA button) with info messages
- Test uses fallback selectors when data-testid attributes are not available
- Hover effects are detected but not required (may vary based on implementation)
