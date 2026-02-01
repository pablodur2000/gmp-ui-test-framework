# QA Ticket: Smoke Test - Critical Navigation Elements Work Correctly (QA-7)

## Project
QA (QA)

## Issue Type
Story

UI Test - Smoke Test - Critical Navigation Elements Work Correctly (QA-7)

**Parent Epic:** QA-2

**Links to GMP Epics:** GMP-4

---

## 📋 Description

Comprehensive smoke test that verifies header, logo, dropdown menus, hover states, smooth scroll to anchor links, and sticky header behavior work correctly on desktop viewport.

**Context:**
- This is a critical smoke test for navigation functionality
- Tests verify interactions, not just visibility
- Includes dropdown menu hover behavior
- Tests smooth scroll to anchor links
- Verifies sticky header behavior
- Desktop viewport only (1920x1080) - Mobile testing in separate phase
- **Status:** ✅ **IMPLEMENTED** - Test file exists and is comprehensive

---

## 🎯 Test Strategy

**Focus:** Comprehensive navigation testing with dropdowns, hover states, smooth scrolling, and sticky header behavior

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 10-15 seconds

**Tags:** @smoke, @navigation, @desktop, @development, @staging, @production

**Note:** Test file exists at `tests/smoke/critical-navigation-elements-work-correctly.spec.ts`. This test verifies core navigation functionality.

### Workflow to Test:
1. Header and logo are visible and functional
2. Navigation links work with hover states
3. Catalog dropdown menu works with hover
4. Smooth scroll to anchor links works
5. Header CTA button works
6. Sticky header behavior works
7. No cleanup needed (read-only test)

---

## UI Test

**File:** `tests/smoke/critical-navigation-elements-work-correctly.spec.ts` ✅ **IMPLEMENTED**

**Test Structure:** Single test with sequential sections

### Required Data-TestIds

The following `data-testid` attributes are used (some with fallback selectors):

1. **Header** - `data-testid="header"` (with fallback to `header` element)
2. **Header Logo** - `data-testid="header-logo"` (with fallback to img with alt containing "logo")
3. **Header Navigation** - `data-testid="header-nav"` (with fallback to nav element)
4. **Navigation Home Link** - `data-testid="header-nav-home-link"` (with fallback to link role)
5. **Navigation Catalog Link** - `data-testid="header-nav-catalog-link"` (with fallback to link role)
6. **Catalog Dropdown** - `data-testid*="dropdown"` or `data-testid*="menu"` (with fallback to class selectors)

**Note:** The test uses fallback selectors when data-testid attributes are not available, ensuring robustness.

---

### Test Steps

**Setup:**
- Navigate to `/` using `navigateToHome(page)`
- Wait for `networkidle` state

**Step 1: Verify Header and Logo**
- Verify header is visible (data-testid or header element)
- Verify header background is not transparent (check backgroundColor)
- Verify logo is visible (data-testid or img with alt containing "logo")
- Test logo navigation from home:
  - Click logo
  - Verify URL matches `/gmp-web-app/?$` pattern
- Test logo navigation from catalog:
  - Navigate to `/catalogo` using `navigateToCatalog(page)`
  - Wait for `networkidle` state
  - Verify logo is visible
  - Click logo
  - Verify URL matches `/gmp-web-app/?$` pattern

**Step 2: Verify Navigation Links**
- Verify "Inicio" link is visible (data-testid or link role)
- Verify "Catálogo" link is visible (data-testid or link role)
- Test "Inicio" link:
  - Click "Inicio" link
  - Verify URL matches `/gmp-web-app/?$` pattern
  - Wait 500ms
- Test "Catálogo" link:
  - Click "Catálogo" link
  - Verify URL matches `/catalogo` pattern
  - Wait 500ms

**Step 3: Verify Hover States**
- Navigate to home
- Wait 500ms
- Get "Inicio" link color before hover
- Hover over "Inicio" link
- Wait 300ms
- Get "Inicio" link color after hover
- If colors differ, log success message (hover effect detected)

**Step 4: Verify Catalog Dropdown Menu**
- Hover over "Catálogo" link
- Wait 500ms for dropdown to appear
- Locate dropdown (data-testid containing "dropdown" or "menu", or class selectors)
- If dropdown exists:
  - Verify dropdown is visible
  - Verify category link is visible (text matching "billeteras", "cinturones", "bolsos", or "accesorios")
  - Log success message
- If dropdown doesn't exist:
  - Log info message (dropdown may not be implemented yet)

**Step 5: Verify Smooth Scroll to Anchor**
- Navigate to home
- Wait 500ms
- Scroll to top: `window.scrollTo(0, 0)`
- Locate "Sobre GMP" link (link role with name matching "sobre gmp")
- If link exists:
  - Click "Sobre GMP" link
  - Wait 1 second for scroll
  - Verify scroll position > 0 (page scrolled)
  - Log success message

**Step 6: Verify Header CTA Button**
- Navigate to home
- Wait 500ms
- Locate header CTA button (button role with name matching "ver catálogo")
- If button exists:
  - Verify button is visible
  - Click button
  - Verify URL matches `/catalogo` pattern
  - Log success message

**Step 7: Verify Sticky Header Behavior**
- Navigate to home
- Wait 500ms
- Get initial header position (boundingBox)
- Scroll down: `window.scrollTo(0, 1000)`
- Wait 500ms
- Get scrolled header position (boundingBox)
- If positions available:
  - Verify scrolled header y position <= 10 (sticky at top)
  - Log success message if sticky
- Verify logo is still visible
- Click logo
- Verify URL matches `/gmp-web-app/?$` pattern

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**Header and Logo:**
- Header is visible and sticky on scroll
- Logo is visible and clickable from all pages
- Logo navigates to home page correctly

**Navigation Links:**
- All navigation links are visible and clickable
- Links navigate to correct pages
- Hover effects work correctly

**Catalog Dropdown:**
- Dropdown menu appears on hover (if implemented)
- Category links are visible (if dropdown exists)

**Smooth Scroll:**
- Smooth scroll works for anchor links
- Page scrolls to correct section

**Header CTA Button:**
- Button is visible and clickable (if implemented)
- Button navigates to catalog correctly

**Sticky Header:**
- Header stays at top when scrolling
- Logo remains accessible in sticky header

---

## Acceptance Criteria

- [ ] Header is visible and sticky on scroll
- [ ] Logo is visible and clickable on all pages
- [ ] Logo navigates to home page from any page correctly
- [ ] All navigation links work and navigate correctly
- [ ] Hover effects work on navigation links
- [ ] Catalog dropdown menu appears on hover (if implemented)
- [ ] Smooth scroll works for anchor links
- [ ] Header CTA button navigates to catalog correctly (if implemented)
- [ ] Sticky header behavior works correctly
- [ ] No critical JavaScript errors
- [ ] No test data cleanup needed

---

**Note:** 
- This is a read-only test - no data creation or modification
- Mobile menu testing is excluded (separate phase)
- Tests focus on desktop viewport interactions
- Test gracefully handles missing elements (dropdown, CTA button) with info messages
- Test uses fallback selectors when data-testid attributes are not available
