# QA Ticket: Smoke Test - Critical Public Paths Load Correctly (QA-5)

## Project
QA (QA)

## Issue Type
Story

UI Test - Smoke Test - Critical Public Paths Load Correctly (QA-5)

**Parent Epic:** QA-2

**Links to GMP Epics:** GMP-4, GMP-26, GMP-34

---

## 📋 Description

Comprehensive smoke test that verifies HomePage, CatalogPage, and ProductDetailPage load correctly with content validation, interactions, data correctness, and performance checks. This test is implemented as three separate test cases in a single file.

**Context:**
- This is a critical smoke test that runs on every commit and deployment
- Tests verify both visual and functional aspects, not just visibility
- Includes Supabase API verification to ensure data loads correctly
- Tests Intersection Observer animations and scroll behavior
- Verifies performance metrics (page load times)
- Desktop viewport only (1920x1080) - Mobile testing in separate phase
- **Status:** ✅ **IMPLEMENTED** - Test file exists and is comprehensive

---

## 🎯 Test Strategy

**Focus:** Comprehensive health checks for critical public paths with data validation, interactions, and performance verification

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 10-15 seconds

**Tags:** @smoke, @heartbeat, @desktop, @development, @staging, @production

**Note:** Test file exists at `tests/smoke/critical-public-paths-load-correctly.spec.ts`. This test provides fast feedback on critical paths and catches regressions early.

### Workflow to Test:
1. HomePage loads with all sections and Supabase data
2. CatalogPage loads with products and filters
3. ProductDetailPage loads with product data from Supabase
4. No cleanup needed (read-only tests)

---

## UI Test

**File:** `tests/smoke/critical-public-paths-load-correctly.spec.ts` ✅ **IMPLEMENTED**

**Test Structure:** Three separate test cases in a single describe block

### Required Data-TestIds

The following `data-testid` attributes are used (some with fallback selectors):

1. **Header** - `data-testid="header"` (with fallback to `header` element)
2. **Header Logo** - `data-testid="header-logo"` (with fallback to logo image)
3. **Home Hero Section** - `data-testid="home-hero-section"` (with fallback to section filter)
4. **Home Hero CTA Button** - `data-testid="home-hero-cta-button"` (with fallback to button role)
5. **Home Location Section** - `data-testid="home-location-section"` (with fallback to section filter)
6. **Home Location Info Cards** - Multiple testids for each card
7. **Home Featured Products** - `data-testid="home-featured-products"` (with fallback to section filter)
8. **Home Featured Product Cards** - `data-testid^="home-featured-product-card"`
9. **Home About GMP Section** - `data-testid="home-about-gmp-section"` (with fallback to `#sobre-gmp`)
10. **Home CTA Section** - `data-testid="home-cta-section"` (with fallback to section filter)
11. **Catalog Heading** - `data-testid="catalog-heading"` (with fallback to heading role)
12. **Catalog Filters** - `data-testid="catalog-filters"` (with fallback to aside filter)
13. **Catalog Search Input** - `data-testid="catalog-search-input"` (with fallback to placeholder)
14. **Catalog Product Cards** - `data-testid^="catalog-product-card"` (with fallback to class selectors)
15. **Product Detail Title** - `data-testid="product-detail-title"` (with fallback to heading)
16. **Product Detail Image** - `data-testid="product-detail-image-{index}"` (with fallback to img)

**Note:** The test uses fallback selectors when data-testid attributes are not available, ensuring robustness.

---

### Test Steps

**Test 1: HomePage Loads Correctly with All Sections and Data**

**Setup:**
- Navigate to `/` using `navigateToHome(page)`
- Wait for `networkidle` state
- Start performance timer

**Step 1: Verify Page Load and Performance**
- Verify page title contains "GMP" or "Artesanías en Cuero" (case-insensitive)
- Capture console errors (log all, fail on critical errors only)
- Stop timer, verify page load time < 3 seconds (warn if > 3s, fail if > 5s)
- Log page load time

**Step 2: Verify Header and Sticky Behavior**
- Verify header is visible immediately
- Scroll down page (500px), verify header stays at top (sticky behavior)
- Verify header position y <= 10px after scroll
- Verify logo is visible in header

**Step 3: Verify Hero Section**
- Verify hero section is visible
- Verify hero section takes full viewport height (height > 80% of viewport)
- Verify hero slides exist (count > 0)
- Verify visible slide has background image (CSS backgroundImage contains 'url(')
- Verify hero content elements:
  - Title is visible
  - Subtitle is visible
  - Description is visible
  - CTA button "Explorar Catálogo" is visible

**Step 4: Verify Location Section with Intersection Observer**
- Scroll to location section (scrollIntoViewIfNeeded)
- Wait 1 second for Intersection Observer animation
- Verify section heading "Ubicación" is visible
- Verify three info cards are visible:
  - "Tienda Física" card
  - "Envíos a Todo el País" card
  - "Garantía de Calidad" card
- Verify address text is visible
- Verify map address is visible

**Step 5: Verify Featured Products Section with Supabase Data**
- Set up response listener BEFORE scrolling to section
- Scroll to Featured Products section
- Wait 2 seconds for API call
- **Supabase Verification:** Intercept GET request to `/rest/v1/products?featured=eq.true`
  - Verify response status is `200`
  - Log product count if available
- If section exists:
  - Verify section heading "Productos Destacados" is visible
  - Verify product cards exist (if products available)
  - Verify first product card is visible
  - Verify product images load (check src attribute)
  - Verify "Ver todos los productos" link is visible (if exists)
- If section doesn't exist: log that no featured products in DB

**Step 6: Verify About GMP Section**
- Scroll to About GMP section
- Wait 1 second for Intersection Observer animation
- Verify section has ID `#sobre-gmp`
- Verify section heading "Sobre GMP" is visible
- Verify image is loaded (artisan photo) with correct alt text
- Verify "Gabriela Ponzoni" heading is visible
- Verify description text about marroquinería and macramé

**Step 7: Verify CTA Section**
- Scroll to CTA section
- Verify section has dark background (leather-800)
- Verify heading "¿Listo para descubrir nuestras artesanías?" is visible
- Verify "Ver Catálogo Completo" button is visible

**Step 8: Verify Page Health and Accessibility**
- Verify body content is not empty
- Verify images load successfully (check first 5 images, verify status < 400)
- Log success message

**Cleanup:**
- No cleanup needed (read-only test)

---

**Test 2: CatalogPage Loads Correctly with Products and Filters**

**Setup:**
- Navigate to `/catalogo` using `navigateToCatalog(page)`
- Wait for `networkidle` state

**Step 1: Verify Page Load and Basic Elements**
- Verify page title contains "catálogo" or "productos" (case-insensitive)
- Verify header is visible
- Verify page heading "Catálogo de Productos" is visible
- Capture console errors (log all, don't fail on warnings)

**Step 2: Verify Filters and Search**
- Verify filters sidebar is visible (if exists)
- Verify search input is visible (if exists)

**Step 3: Verify Products Load from Supabase**
- Set up response listener BEFORE waiting
- Wait 2 seconds for API call
- **Supabase Verification:** Intercept GET request to `/rest/v1/products` (not featured)
  - Verify response status is `200`
  - Log product count from API response
- Verify product cards exist (if products available)
- Verify first product card is visible
- Log product count found

**Step 4: Verify Product Card Interaction**
- If product cards exist:
  - Click first product card
  - Wait 1 second
  - Verify URL matches `/producto/` pattern
  - Log success message

**Cleanup:**
- No cleanup needed (read-only test)

---

**Test 3: ProductDetailPage Loads Correctly with Product Data from Supabase**

**Setup:**
- Navigate to `/catalogo` first
- Wait for products to load
- Get product ID from first product card's link href
- Extract product ID from URL pattern `/producto/{productId}`
- If no products found, skip test

**Step 1: Verify Page Load and Title**
- Set up response listener BEFORE navigation
- Navigate to `/producto/{productId}` using `navigateToProduct(page, productId)`
- Wait for `networkidle` state
- Wait 1 second
- Verify page title contains product ID

**Step 2: Verify Product Data from Supabase**
- **Supabase Verification:** Intercept GET request to `/rest/v1/products?id=eq.{productId}`
  - Verify response status is `200`
  - Extract product data from response
  - Log product name/title
- Verify product title is visible
- If product data available, verify displayed title matches API response

**Step 3: Verify Product Images**
- Verify product image is visible (if exists)
- Verify image src attribute is present

**Step 4: Verify Navigation Elements**
- Verify "Volver al Catálogo" button/link is visible (if exists)
- If back button exists:
  - Click back button
  - Wait 1 second
  - Verify URL matches `/catalogo`
  - Log success message

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**Test 1 (HomePage Loads Correctly):**
- Page loads successfully with all sections visible
- Page load time is acceptable (< 3 seconds, warn if > 3s, fail if > 5s)
- Intersection Observer animations trigger on scroll
- Featured Products load from Supabase correctly (API verified)
- All images load successfully (no broken images)
- No critical JavaScript errors

**Test 2 (CatalogPage Loads Correctly):**
- Page loads with products from Supabase (API verified)
- All filters and search elements are visible (if implemented)
- Product cards are clickable and navigate correctly
- Product images load successfully

**Test 3 (ProductDetailPage Loads Correctly):**
- Page loads with product data from Supabase (API verified)
- Product data matches database (title verified against API)
- Images load successfully
- Navigation back to catalog works correctly

---

## Acceptance Criteria

- [ ] All three public pages load successfully with full content
- [ ] No critical JavaScript errors in console
- [ ] Page titles are correct and match content
- [ ] All main content areas are visible and populated
- [ ] Data loads from Supabase correctly (API calls verified with status 200)
- [ ] Images load successfully (no broken images, status < 400)
- [ ] Intersection Observer animations work on scroll
- [ ] Test completes in < 15 seconds total
- [ ] All interactive elements are functional (not just visible)
- [ ] Product data matches Supabase API responses
- [ ] Performance metrics are logged (page load times)
- [ ] No test data cleanup needed

---

**Note:** 
- This is a read-only test - no data creation or modification
- Tests run against production/staging data in Supabase
- Mobile viewport testing is in a separate phase
- Performance metrics are logged but don't fail the test unless significantly slow (> 5s)
- Test uses fallback selectors when data-testid attributes are not available
- Test gracefully handles missing sections (e.g., no featured products in DB)
