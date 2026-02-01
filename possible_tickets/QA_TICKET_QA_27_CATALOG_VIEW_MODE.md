# QA Ticket: CatalogPage View Mode Switch Works Correctly (QA-27)

## Project
QA (QA)

## Issue Type
Story

UI Test - CatalogPage View Mode Switch Works Correctly (QA-27)

**Parent Epic:** QA-13

**Links to GMP Epics:** GMP-26, GMP-32

---

## 📋 Description

Comprehensive test that verifies view mode toggle (Grid/List) works correctly, switches between grid and list layouts, updates product card display, maintains state, and provides smooth transitions.

**Context:**
- View mode toggle has two buttons: Grid and List
- Grid view: 3 columns on large screens, 2 on medium, 1 on small
- List view: Single column with horizontal product layout
- ProductCard component adapts to view mode
- Default view is Grid
- Desktop viewport only (1920x1080) - Mobile testing in separate phase

---

## 🎯 Test Strategy

**Focus:** Verify view mode toggle buttons, layout changes, product card adaptation, and state management

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 15-20 seconds

**Tags:** @e2e, @public, @catalog, @desktop, @development, @staging, @production

**Note:** Create test file in `tests/e2e/public/catalog-page/` folder. This test verifies view mode toggle functionality and layout changes.

### Workflow to Test:
1. Navigate to `/catalogo`
2. Verify view mode buttons are visible
3. Verify Grid view is default
4. Test switching to List view
5. Test switching back to Grid view
6. Verify product card layout changes
7. Verify state persists
8. No cleanup needed (read-only test)

---

## UI Test

**File:** `tests/e2e/public/catalog-page/catalog-page-view-mode-switch-works-correctly.spec.ts` (new test)

**Test Structure:** Single comprehensive test with view mode scenarios

### Required Data-TestIds

Request the following `data-testid` attributes to be added:

1. **Grid View Button** - Grid view toggle button
2. **List View Button** - List view toggle button
3. **Product Grid Container** - Container for product cards (changes layout based on view mode)

**Note:** If there are any flaky locators identified in the flow of the test, please add `data-testid` attributes as needed to ensure stable test automation.

---

### Test Steps

**Setup:**
- Navigate to `/catalogo`
- Wait for `networkidle` state
- Wait for products to load

**Step 1: Verify View Mode Buttons**
- Verify Grid view button is visible (Grid icon)
- Verify List view button is visible (List icon)
- Verify buttons are in a horizontal row
- Verify buttons have correct spacing
- Verify Grid icon is from lucide-react
- Verify List icon is from lucide-react

**Step 2: Verify Default State - Grid View**
- Verify Grid view button has active styling:
  - Background: `bg-leather-100`
  - Text color: `text-leather-800`
- Verify List view button has inactive styling:
  - Text color: `text-gray-400`
- Verify product grid container has grid layout:
  - Classes: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Verify products are displayed in grid format

**Step 3: Test Switch to List View**
- Click List view button
- Wait for layout to update
- Verify List view button has active styling
- Verify Grid view button has inactive styling
- Verify product grid container has list layout:
  - Classes: `grid-cols-1`
- Verify products are displayed in list format
- Verify ProductCard component renders in list mode

**Step 4: Verify List View Product Card Layout**
- Verify product cards in list view have:
  - Horizontal layout (flex row)
  - Product image on left (w-32 h-32)
  - Product info on right (flex-1)
  - Image and info side by side
- Verify product card shows:
  - Product image (thumbnail size)
  - Product title
  - Product description (truncated)
  - Inventory status badge
  - Price
  - "Ver Detalles" button
- Verify layout is horizontal (not vertical)

**Step 5: Test Switch Back to Grid View**
- Click Grid view button
- Wait for layout to update
- Verify Grid view button has active styling
- Verify List view button has inactive styling
- Verify product grid container has grid layout again
- Verify products are displayed in grid format
- Verify ProductCard component renders in grid mode

**Step 6: Verify Grid View Product Card Layout**
- Verify product cards in grid view have:
  - Vertical layout (card structure)
  - Product image on top (aspect-square)
  - Product info below image
  - Full-width image
- Verify product card shows:
  - Product image (full size, aspect-square)
  - Featured badge (if product.featured)
  - Price tag overlay (top-right on image)
  - Product title
  - Short description (if exists)
  - Inventory status badge
  - "Ver Detalles" button
- Verify layout is vertical (not horizontal)

**Step 7: Verify View Mode State Persistence**
- Click List view button
- Wait for layout to update
- Apply a filter (e.g., select category)
- Wait for products to filter
- Verify List view is still active
- Verify products remain in list layout
- Verify view mode state persists through filter changes

**Step 8: Verify View Mode with Filters**
- Click "Cuero" main category button
- Wait for products to filter
- Click List view button
- Wait for layout to update
- Verify filtered products display in list view
- Verify all filtered products are in list layout
- Switch back to Grid view
- Verify filtered products display in grid view

**Step 9: Verify View Mode with Search**
- Type search term in search input
- Wait for search to complete
- Click List view button
- Wait for layout to update
- Verify search results display in list view
- Verify all search results are in list layout
- Switch back to Grid view
- Verify search results display in grid view

**Step 10: Verify Button Hover States**
- Hover over Grid view button (when inactive)
- Verify hover effect: `hover:text-leather-800`
- Hover over List view button (when inactive)
- Verify hover effect
- Verify active button does not change on hover

**Step 11: Verify Grid Layout Responsiveness**
- Verify grid layout classes:
  - `grid-cols-1` (mobile)
  - `sm:grid-cols-2` (tablet)
  - `lg:grid-cols-3` (desktop)
- On desktop (1920x1080), verify 3 columns are displayed
- Verify products are evenly distributed across columns

**Step 12: Verify List Layout**
- Switch to List view
- Verify list layout uses single column
- Verify all products are in one column
- Verify products are stacked vertically
- Verify proper spacing between list items

**Step 13: Verify Product Card Content in Both Views**
- Switch to Grid view
- Verify first product card shows all required elements
- Switch to List view
- Verify same product card shows all required elements (may be arranged differently)
- Verify product information is consistent in both views

**Step 14: Verify Smooth Transitions**
- Click Grid view button
- Verify smooth transition (not instant layout change)
- Click List view button
- Verify smooth transition
- Verify no layout flickering or jumping

**Step 15: Verify View Mode with Empty State**
- Apply filters that result in no products
- Verify empty state is displayed
- Switch view modes
- Verify empty state remains (no products to display)
- Verify view mode buttons are still functional

**Step 16: Verify View Mode with Single Product**
- Apply filters that result in one product
- Switch to List view
- Verify single product displays correctly in list layout
- Switch to Grid view
- Verify single product displays correctly in grid layout

**Step 17: Verify View Mode Button Icons**
- Verify Grid button shows Grid icon (lucide-react)
- Verify List button shows List icon (lucide-react)
- Verify icons are properly sized (w-5 h-5)
- Verify icons are visible and properly positioned

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**View Mode Buttons:**
- Two buttons are visible (Grid and List)
- Grid button is active by default
- Buttons have correct styling (active vs inactive)
- Hover effects work correctly

**Grid View:**
- Products display in grid layout (3 columns on desktop)
- Product cards are vertical (image on top, info below)
- Layout is responsive

**List View:**
- Products display in list layout (single column)
- Product cards are horizontal (image left, info right)
- Layout is optimized for list viewing

**State Management:**
- View mode state persists through filter changes
- View mode state persists through search
- Smooth transitions between views

---

## Acceptance Criteria

- [ ] View mode buttons are visible
- [ ] Grid view is default
- [ ] Grid view button has active styling by default
- [ ] List view button has inactive styling by default
- [ ] Clicking List view switches to list layout
- [ ] Clicking Grid view switches to grid layout
- [ ] Product cards adapt to view mode correctly
- [ ] Grid view shows 3 columns on desktop
- [ ] List view shows single column
- [ ] View mode state persists through filter changes
- [ ] View mode state persists through search
- [ ] Button styling updates correctly
- [ ] Hover effects work correctly
- [ ] Smooth transitions between views
- [ ] Product information is consistent in both views

---

**Note:**
- This is a read-only test - no data creation or modification
- Tests run against production/staging data in Supabase
- Grid layout is responsive (3 columns on desktop, 2 on tablet, 1 on mobile)
- ProductCard component handles view mode internally
- View mode state is local (not persisted to URL or storage)


