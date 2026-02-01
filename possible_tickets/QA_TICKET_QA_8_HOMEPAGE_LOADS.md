# QA Ticket: HomePage Loads and Displays Correctly (QA-8)

## Project
QA (QA)

## Issue Type
Story

UI Test - HomePage Loads and Displays Correctly (QA-8)

**Parent Epic:** QA-3

**Links to GMP Epics:** GMP-4

---

## 📋 Description

Comprehensive test that verifies HomePage loads correctly with all sections, Intersection Observer animations, scroll behavior, content validation, image loading, and data from Supabase.

**Context:**
- Tests verify both visual and functional aspects of HomePage
- Includes Supabase API verification for Featured Products
- Tests Intersection Observer animations that trigger on scroll
- Verifies performance metrics (page load times)
- Tests all main sections: Hero, Location, Featured Products, About GMP, CTA
- Desktop viewport only (1920x1080) - Mobile testing in separate phase
- **Status:** ✅ **IMPLEMENTED** - Test file exists and is comprehensive

---

## 🎯 Test Strategy

**Focus:** Comprehensive HomePage testing with animations, interactions, data validation, and performance checks

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 45-60 seconds

**Tags:** @e2e, @public, @homepage, @desktop, @development, @staging, @production

**Note:** Test file exists at `tests/e2e/public/home-page/home-page-loads-and-displays-correctly.spec.ts`. This test verifies complete HomePage functionality.

### Workflow to Test:
1. Page loads with performance verification
2. Hero section displays correctly
3. Location section with Intersection Observer animations
4. Featured Products section loads from Supabase
5. About GMP section with animations
6. CTA section displays correctly
7. Page health and accessibility verification
8. No cleanup needed (read-only test)

---

## UI Test

**File:** `tests/e2e/public/home-page/home-page-loads-and-displays-correctly.spec.ts` ✅ **IMPLEMENTED**

**Test Structure:** Single test with sequential sections

### Required Data-TestIds

The following `data-testid` attributes are used (some with fallback selectors):

1. **Home Hero Section** - `data-testid="home-hero-section"` (with fallback to section filter)
2. **Home Hero Content** - `data-testid="home-hero-content"` (with fallback to div filter)
3. **Home Hero Title** - `data-testid="home-hero-title"` (with fallback to h1)
4. **Home Hero Subtitle** - `data-testid="home-hero-subtitle"` (with fallback to span filter)
5. **Home Hero Description** - `data-testid="home-hero-description"` (with fallback to p)
6. **Home Hero CTA Button** - `data-testid="home-hero-cta-button"`
7. **Home Location Section** - `data-testid="home-location-section"` (with fallback to section filter)
8. **Home Location Heading** - `data-testid="home-location-heading"` (with fallback to heading role)
9. **Home Location Info Cards** - Multiple testids for each card (TiendaFisica, Envios, Garantia)
10. **Home Location Address Text** - `data-testid="home-location-address-text"`
11. **Home Location Map Address** - `data-testid="home-location-map-address"`
12. **Home Location Ver Mapa Button** - `data-testid="home-location-ver-mapa-button"`
13. **Home Location Rastrear Envio Link** - `data-testid="home-location-rastrear-envio-link"`
14. **Home Featured Products** - `data-testid="home-featured-products"` (with fallback to section filter)
15. **Home Featured Products Heading** - `data-testid="home-featured-products-heading"` (with fallback to heading role)
16. **Home Featured Product Cards** - `data-testid^="home-featured-product-card"`
17. **Home Featured Products Ver Todos Link** - `data-testid="home-featured-products-ver-todos-link"`
18. **Home About GMP Section** - `data-testid="home-about-gmp-section"` (with fallback to `#sobre-gmp`)
19. **Home About GMP Heading** - `data-testid="home-about-gmp-heading"` (with fallback to heading role)
20. **Home About GMP Description** - `data-testid="home-about-gmp-description"`
21. **Home About GMP Artisan Name** - `data-testid="home-about-gmp-artisan-name"` (with fallback to heading role)
22. **Home About GMP Artisan Image** - `data-testid="home-about-gmp-artisan-image"` (with fallback to img)
23. **Home CTA Section** - `data-testid="home-cta-section"` (with fallback to section filter)
24. **Home CTA Catalog Link** - `data-testid="home-cta-catalog-link"` (with fallback to button role)

**Note:** The test uses fallback selectors when data-testid attributes are not available, ensuring robustness.

---

### Test Steps

**Setup:**
- Navigate to `/` using `navigateToHome(page)`
- Start performance timer
- Wait for `networkidle` state
- Calculate page load time

**Step 1: Verify Page Load and Performance**
- Verify page title contains "Artesanías en Cuero" or "GMP" (case-insensitive)
- Capture console errors (log all, fail on critical errors only)
- Log page load time
- Warn if page load time > 3 seconds
- Fail if page load time > 5 seconds
- Wait 1 second for page to stabilize

**Step 2: Verify Hero Section Basic Verification**
- Verify hero section is visible (data-testid or section filter)
- Verify hero section height > 80% of viewport height
- Verify hero slides exist (count > 0)
- Find visible slide (opacity > 0.9):
  - Loop through slides
  - Check opacity of each slide
  - Identify visible slide
- Verify visible slide has background image (CSS backgroundImage contains 'url(')
- Verify hero content elements:
  - Title is visible (data-testid or h1)
  - Subtitle is visible (data-testid or span filter)
  - Description is visible (data-testid or p)
  - CTA button is visible

**Step 3: Verify Location Section with Intersection Observer**
- Scroll to location section (scrollIntoViewIfNeeded)
- Wait 1 second for Intersection Observer animation
- Verify section is visible (data-testid or section filter)
- Verify section heading "Ubicación" is visible (data-testid or heading role)
- Verify three info cards are visible:
  - "Tienda Física" card (data-testid)
  - "Envíos a Todo el País" card (data-testid)
  - "Garantía de Calidad" card (data-testid)
- Verify address text is visible (data-testid)
- Verify map address is visible (data-testid)
- Verify "Ver mapa" button is visible (data-testid)
- Verify "Rastrear Envío" link is visible (data-testid)

**Step 4: Verify Featured Products Section with Supabase Data**
- Set up response listener BEFORE scrolling to section
- Scroll to Featured Products section (scrollIntoViewIfNeeded)
- Wait 2 seconds for API call
- **Supabase Verification:** Intercept GET request to `/rest/v1/products?featured=eq.true`
  - Verify response status is `200`
  - Extract product data from response (if JSON)
  - Log product count if available
- If section exists:
  - Verify section is visible
  - Verify section heading "Productos Destacados" is visible (data-testid or heading role)
  - Verify product cards exist (data-testid pattern)
  - If cards exist:
    - Verify first card is visible
    - Verify card image src attribute is present
    - Log card count
  - Verify "Ver todos los productos" link is visible (if exists)
- If section doesn't exist:
  - Log info message (no featured products in DB)

**Step 5: Verify About GMP Section with Intersection Observer**
- Scroll to About GMP section (scrollIntoViewIfNeeded)
- Wait 1 second for Intersection Observer animation
- Verify section is visible (data-testid or `#sobre-gmp`)
- Verify section heading "Sobre GMP" is visible (data-testid or heading role)
- Verify description is visible (data-testid)
- Verify "Gabriela Ponzoni" heading is visible (data-testid or heading role)
- Verify artisan image is visible (if exists):
  - Check image src attribute is present

**Step 6: Verify CTA Section**
- Scroll to CTA section (scrollIntoViewIfNeeded)
- Wait 500ms
- Verify section is visible (data-testid or section filter)
- Verify "Ver Catálogo Completo" button is visible (data-testid or button role)

**Step 7: Verify Page Health and Accessibility**
- Verify body content is not empty
- Verify images load successfully:
  - Get all images
  - Check first 5 images
  - For each image:
    - Get src attribute
    - Build full URL if relative
    - Verify image loads (status < 400)
- Log success message

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**Page Load:**
- Page loads successfully with all sections
- Page load time is acceptable (< 3 seconds, warn if > 3s, fail if > 5s)
- No critical JavaScript errors

**Hero Section:**
- Hero section displays with all content visible
- Background images load successfully
- CTA button is visible and styled correctly

**Location Section:**
- Location section displays with Intersection Observer animations
- All info cards are visible and animate in
- Map button and shipping info are visible

**Featured Products:**
- Featured Products section loads data from Supabase (API verified)
- Products display correctly with images, titles, prices (if products exist)
- Section doesn't render if no featured products (returns null)

**About GMP:**
- About GMP section displays with animations
- Image and text content are visible

**CTA Section:**
- CTA section displays with button
- Button is visible and clickable

**Page Health:**
- All images load successfully (no broken images)
- Page is fully interactive

---

## Acceptance Criteria

- [ ] Page loads successfully with all sections
- [ ] Page load time is acceptable (< 3 seconds, warn if > 3s, fail if > 5s)
- [ ] All main sections are visible and properly styled
- [ ] Hero section displays correctly with background images
- [ ] Intersection Observer animations trigger on scroll
- [ ] Featured Products load from Supabase correctly (API verified with status 200)
- [ ] All images load successfully (status < 400)
- [ ] All interactive elements are functional
- [ ] No critical JavaScript errors
- [ ] Page is fully accessible and interactive
- [ ] No test data cleanup needed

---

**Note:** 
- This is a read-only test - no data creation or modification
- Tests run against production/staging data in Supabase
- Performance metrics are logged but don't fail the test unless significantly slow (> 5s)
- Mobile viewport testing is in a separate phase
- Test gracefully handles missing sections (e.g., no featured products in DB)
- Test uses fallback selectors when data-testid attributes are not available
