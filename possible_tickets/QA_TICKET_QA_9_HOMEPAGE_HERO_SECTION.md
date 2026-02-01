# QA Ticket: HomePage Hero Section Displays Correctly (QA-9)

## Project
QA (QA)

## Issue Type
Story

UI Test - HomePage Hero Section Displays Correctly (QA-9)

**Parent Epic:** QA-3

**Links to GMP Epics:** GMP-4

---

## 📋 Description

Comprehensive test that verifies Hero section carousel auto-advance, all 4 slides, first-visit animation sequence, parallax effects, CTA button interactions, and complete carousel functionality.

**Context:**
- Tests verify carousel auto-advances through all 4 slides every 5 seconds
- Includes first-visit animation sequence (2.5 seconds total)
- Tests parallax effects on mouse movement
- Verifies all slide content (titles, subtitles, descriptions, images)
- Tests CTA button interactions and navigation
- Desktop viewport only (1920x1080) - Mobile testing in separate phase
- **Status:** ✅ **IMPLEMENTED** - Test file exists and is comprehensive

---

## 🎯 Test Strategy

**Focus:** Comprehensive Hero section testing with carousel, animations, interactions, and all slide content

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 60-90 seconds

**Tags:** @e2e, @public, @homepage, @hero, @desktop, @development, @staging, @production

**Note:** Test file exists at `tests/e2e/public/home-page/home-page-hero-section-displays-correctly.spec.ts`. Test timeout is set to 5 minutes to allow for carousel cycles.

### Workflow to Test:
1. First visit animation sequence completes
2. Carousel auto-advances through all 4 slides
3. All slide content is correct
4. Parallax effects work on mouse movement
5. CTA button interactions work
6. Subsequent visit behavior (no animation)
7. No cleanup needed (read-only test)

---

## UI Test

**File:** `tests/e2e/public/home-page/home-page-hero-section-displays-correctly.spec.ts` ✅ **IMPLEMENTED**

**Test Structure:** Single test with sequential sections (test timeout: 5 minutes)

### Required Data-TestIds

The following `data-testid` attributes are used (some with fallback selectors):

1. **Home Hero First Visit Logo** - `data-testid="home-hero-first-visit-logo"` (optional, may not be implemented)
2. **Header** - `data-testid="header"` (with fallback to header element)
3. **Home Hero Section** - `data-testid="home-hero-section"`
4. **Home Hero Content** - `data-testid="home-hero-content"` (with fallback to div filter)
5. **Home Hero Title** - `data-testid="home-hero-title"` (with fallback to h1)
6. **Home Hero Subtitle** - `data-testid="home-hero-subtitle"` (with fallback to span filter)
7. **Home Hero Description** - `data-testid="home-hero-description"` (with fallback to p)
8. **Home Hero CTA Button** - `data-testid="home-hero-cta-button"`

**Note:** The test uses fallback selectors when data-testid attributes are not available, ensuring robustness.

---

### Test Steps

**Setup:**
- Navigate to `/` using `navigateToHome(page)` (fresh page load for first visit animation)
- Set default timeout to 90 seconds
- Set default navigation timeout to 60 seconds

**Step 1: Verify First Visit Animation Sequence**
- Locate logo animation element (data-testid, optional)
- If not found, log warning (data-testid may not be added yet)
- Get body overflow before animation
- Wait 2.5 seconds for animation to complete
- Get body overflow after animation
- Verify body overflow is NOT "hidden" after animation (scroll enabled)
- Verify header is visible after animation

**Step 2: Verify Hero Section Content**
- Verify hero section is visible
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
- Verify CTA button text contains "Explorar Catálogo"

**Step 3: Verify Carousel Auto-Advance**
- Define expected slide titles:
  - Slide 0: "Artesanías en Cuero"
  - Slide 1: "Macramé Artesanal"
  - Slide 2: "Desde Paysandú"
  - Slide 3: "Monederos Artesanales"
- Define expected slide subtitles:
  - Slide 0: "Hechas con Amor y Tradición"
  - Slide 1: "Tejidos que Transforman Espacios"
  - Slide 2: "Para Todo Uruguay"
  - Slide 3: "Detalles que Marcan la Diferencia"
- Loop through all 4 slides:
  - For each slide index:
    - Set timeout (80s for first slide, 25s for others)
    - Wait for title to contain expected text (case-insensitive)
    - Verify current title matches expected title
    - Verify current subtitle matches expected subtitle
    - Log success message for each slide

**Step 4: Verify Parallax Effect**
- Find visible slide (opacity > 0.9)
- Get transform before mouse movement
- Move mouse to center of viewport
- Wait 200ms
- Get transform after mouse movement
- If transforms are empty, check computed styles:
  - If computed transform exists and is not "none", log success
  - Otherwise, log warning (parallax may not be working)
- If transforms differ, log success (parallax detected)

**Step 5: Verify CTA Button Interactions**
- Verify CTA button is enabled
- Get button transform before hover
- Hover over button
- Wait 300ms
- Get button transform after hover
- If transforms differ, log success (hover effect detected)
- Test button navigation:
  - Click button
  - Wait for URL to match `/catalogo` pattern (timeout: 5s)
  - Verify URL matches `/catalogo` pattern
- Navigate back to home
- Wait 1 second

**Step 6: Verify Subsequent Visit Behavior**
- Navigate to catalog
- Wait 500ms
- Navigate back to home
- Wait 1 second
- Verify hero section is visible
- Verify title is visible (timeout: 2s)
- Log success message (hero loads immediately on subsequent visit)

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**First Visit Animation:**
- Animation plays on first visit
- Animation sequence completes in 2.5 seconds
- Scroll is disabled during animation (body overflow: hidden)
- Scroll is enabled after animation (body overflow: not hidden)
- Header is visible after animation

**Carousel:**
- Carousel auto-advances through all 4 slides
- Each slide displays correct content (title and subtitle)
- Transitions are smooth
- Carousel loops correctly

**Parallax Effect:**
- Background image moves based on mouse position
- Effect is smooth and responsive
- Effect is detected via transform or computed styles

**CTA Button:**
- Button has hover effects (transform changes)
- Button navigates to catalog correctly
- Navigation is smooth (React Router)

**Subsequent Visit:**
- Hero section loads immediately without animation
- No first visit animation on subsequent visits

---

## Acceptance Criteria

- [ ] Hero section displays all elements correctly with proper styling
- [ ] Carousel auto-advances through all 4 slides with correct timing
- [ ] All slide content (title, subtitle) is correct
- [ ] First visit animation completes successfully in 2.5 seconds
- [ ] Scroll is properly disabled/enabled during animation
- [ ] CTA button navigates to catalog page correctly
- [ ] Parallax effect works on mouse movement
- [ ] All text is readable and properly formatted
- [ ] All images load successfully
- [ ] Hero section loads immediately on subsequent visits
- [ ] No test data cleanup needed

---

**Note:** 
- This is a read-only test - no data creation or modification
- First visit animation may not play on subsequent visits (expected behavior)
- Carousel timing is approximate (5 seconds per slide, with longer timeout for first slide)
- Test timeout is set to 5 minutes to allow for complete carousel cycles
- Mobile viewport testing is in a separate phase
- Test uses fallback selectors when data-testid attributes are not available
- Parallax effect detection may vary based on implementation
