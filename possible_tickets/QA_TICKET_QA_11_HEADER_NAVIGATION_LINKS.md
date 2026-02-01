# QA Ticket: Header Navigation Links Work Correctly (QA-11)

## Project
QA (QA)

## Issue Type
Story

UI Test - Header Navigation Links Work Correctly (QA-11)

**Parent Epic:** QA-4

**Links to GMP Epics:** GMP-4

---

## 📋 Description

Comprehensive test that verifies all navigation links in the header work correctly, including Catalog dropdown menu with hover states, category links with query parameters, active link highlighting based on current page, and smooth scroll to anchor links.

**Context:**
- Tests verify navigation functionality with interactions
- Includes dropdown menu hover behavior (onMouseEnter/onMouseLeave)
- Tests active link highlighting based on current page (using useLocation)
- Verifies smooth scroll to anchor links (#sobre-gmp)
- Catalog dropdown loads categories from Supabase with product counts
- Desktop viewport only (1920x1080) - Mobile testing in separate phase
- **Status:** 📝 **TO BE IMPLEMENTED** - Test file needs to be created

---

## 🎯 Test Strategy

**Focus:** Comprehensive navigation testing with dropdowns, hover states, active link management, and smooth scrolling

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 45-60 seconds

**Tags:** @e2e, @public, @navigation, @desktop, @development, @staging, @production

**Note:** Create test file in `tests/e2e/public/navigation/` folder. This test verifies complete navigation functionality.

### Workflow to Test:
1. Navigation links work correctly
2. Catalog dropdown menu works with hover
3. Active link highlighting works
4. Smooth scroll to anchor links works
5. No cleanup needed (read-only test)

---

## UI Test

**File:** `tests/e2e/public/navigation/header-navigation-links-work-correctly.spec.ts` (new test)

**Test Structure:** Single test with sequential steps

### Required Data-TestIds

Request the following `data-testid` attributes to be added (dev will define exact naming):

1. **Header Navigation** - `data-testid="header-nav"` (already exists)
2. **Navigation Link - Inicio** - `data-testid="header-nav-home-link"` (already exists for button)
3. **Navigation Link - Catálogo** - `data-testid="header-nav-catalog-link"` (already exists)
4. **Catalog Dropdown Menu** - Dropdown menu container (needs data-testid)
5. **Category Link** - Individual category links in dropdown (needs data-testid)
6. **Navigation Link - Sobre GMP** - "Sobre GMP" navigation link (needs data-testid)
7. **Navigation Link - Contacto** - "Contacto" navigation link (needs data-testid, if present)

**Note:** If there are any flaky locators identified in the flow of the test, please add `data-testid` attributes as needed to ensure stable test automation.

---

### Test Steps

**Setup:**
- Navigate to `/` using `navigateToHome(page)`
- Wait for `networkidle` state
- Wait for categories to load from Supabase (if dropdown is visible)

**Step 1: Verify Navigation Links Visibility**
- Verify "Inicio" link is visible (data-testid or button role)
- Verify "Catálogo" link is visible (data-testid or link role)
- Verify "Sobre GMP" link is visible (button role or data-testid)
- Verify "Contacto" link is visible (if present, button role or data-testid)

**Step 2: Test "Inicio" Link Navigation**
- Click "Inicio" link
- Verify URL is `/` (or `/gmp-web-app/`)
- Verify "Inicio" link has active styling:
  - Text color: `text-leather-800`
  - Background: `bg-leather-100`
- Verify other links do NOT have active styling

**Step 3: Test "Catálogo" Link Navigation**
- Click "Catálogo" link
- Verify URL is `/catalogo`
- Verify "Catálogo" link has active styling
- Verify "Inicio" link does NOT have active styling

**Step 4: Verify Hover States**
- Navigate to home
- Hover over "Inicio" link (when inactive):
  - Get text color before hover
  - Get background color before hover
  - Hover over link
  - Wait 300ms
  - Get text color after hover
  - Get background color after hover
  - Verify colors change (text: `hover:text-leather-800`, background: `hover:bg-leather-50`)
- Hover over "Catálogo" link:
  - Verify same hover effects
  - Verify dropdown appears (tested in next step)
- Hover over "Sobre GMP" link:
  - Verify same hover effects

**Step 5: Verify Catalog Dropdown Menu**
- Navigate to home
- Hover over "Catálogo" link
- Wait 500ms for dropdown to appear
- Verify dropdown menu is visible:
  - Check for dropdown container (data-testid or class selectors)
  - Verify dropdown has correct styling (white background, shadow, rounded)
- Verify "Ver Todo el Catálogo" link is visible at top of dropdown
- Verify categories are grouped by main category:
  - "Artesanías en Cuero" section header
  - "Macramé Artesanal" section header
- Verify category links display:
  - Category name
  - Category description
  - Product count (if > 0)
  - Hover indicator (dot that appears on hover)
- Test category link click:
  - Click a category link (e.g., "Billeteras")
  - Verify URL is `/catalogo?categoria=Billeteras` (URL encoded)
  - Verify catalog page loads
  - Navigate back to home
- Test "Ver Todo el Catálogo" link:
  - Hover over "Catálogo" to open dropdown
  - Click "Ver Todo el Catálogo" link
  - Verify URL is `/catalogo`
  - Verify catalog page loads
- Test dropdown close:
  - Hover over "Catálogo" to open dropdown
  - Move mouse away from dropdown area
  - Wait 500ms
  - Verify dropdown closes (not visible)
- Test dropdown persistence:
  - Hover over "Catálogo" to open dropdown
  - Move mouse to dropdown menu (without leaving)
  - Verify dropdown stays open
  - Move mouse back to "Catálogo" link
  - Verify dropdown stays open

**Step 6: Verify Smooth Scroll to Anchor**
- Navigate to home
- Scroll to top of page: `window.scrollTo(0, 0)`
- Click "Sobre GMP" link
- Wait 1 second for smooth scroll
- Verify smooth scroll behavior:
  - Check scroll position > 0 (page scrolled)
  - Verify scroll is smooth (not instant jump)
- Verify page scrolls to `#sobre-gmp` section
- Verify section is visible in viewport
- Verify section heading "Sobre GMP" is visible

**Step 7: Verify Active Link Highlighting**
- Navigate to `/`
- Verify "Inicio" link has active styling:
  - Text color: `text-leather-800`
  - Background: `bg-leather-100`
- Verify other links do NOT have active styling
- Navigate to `/catalogo`
- Verify "Catálogo" link has active styling
- Verify "Inicio" link does NOT have active styling
- Navigate back to `/`
- Verify "Inicio" link has active styling again

**Step 8: Verify Contacto Link (If Present)**
- Navigate to home
- If "Contacto" link exists:
  - Verify link is visible
  - Click link
  - Verify contact modal opens (if implemented as modal)
  - Or verify navigation to contact page (if implemented as page)

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**Navigation Links:**
- All navigation links work correctly and navigate to correct pages
- Links have correct hover effects (color and background changes)
- Active link highlighting works based on current page (using useLocation)

**Catalog Dropdown:**
- Dropdown menu displays on hover (onMouseEnter)
- Dropdown has correct styling and layout
- Categories are grouped by main category
- Category links show name, description, and product count
- "Ver Todo el Catálogo" link is at top of dropdown
- Dropdown closes when mouse leaves (onMouseLeave)
- Dropdown stays open when mouse moves between link and dropdown

**Smooth Scroll:**
- Smooth scroll works for anchor links (#sobre-gmp)
- Page scrolls to correct section
- Scroll is smooth (not instant jump)

**Active Link Highlighting:**
- Active link has correct styling (leather-800 text, leather-100 background)
- Only one link is active at a time
- Active state updates correctly on navigation

---

## Acceptance Criteria

- [ ] All navigation links work correctly and navigate to correct pages
- [ ] Dropdown menu displays and functions properly with hover
- [ ] Category links navigate with correct query parameters (URL encoded)
- [ ] Active link highlighting works correctly based on current page
- [ ] Smooth scroll works for anchor links
- [ ] All hover states work correctly
- [ ] Dropdown closes when mouse leaves
- [ ] Dropdown stays open when mouse moves between link and dropdown
- [ ] Categories are grouped by main category correctly
- [ ] Product counts display correctly in dropdown
- [ ] "Ver Todo el Catálogo" link works correctly
- [ ] No test data cleanup needed

---

**Note:** 
- This is a read-only test - no data creation or modification
- Mobile menu testing is excluded (separate phase)
- Tests focus on desktop viewport interactions
- Catalog dropdown loads categories from Supabase with product counts
- Dropdown uses onMouseEnter/onMouseLeave for hover behavior
- Active link highlighting uses React Router's useLocation hook
- Smooth scroll uses `scrollIntoView({ behavior: 'smooth' })`
