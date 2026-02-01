# QA Ticket: CatalogPage Main Category Filter Works Correctly (QA-23)

## Project
QA (QA)

## Issue Type
Story

UI Test - CatalogPage Main Category Filter Works Correctly (QA-23)

**Parent Epic:** QA-13

**Links to GMP Epics:** GMP-26, GMP-28

---

## 📋 Description

Comprehensive test that verifies main category filter (Todas, Cuero, Macramé) works correctly, filters products by main_category, updates UI state, and maintains filter state correctly.

**Context:**
- Main category filter is the primary filter for product browsing
- Three options: "Todas" (all), "Cuero" (leather), "Macramé" (macramé)
- Filters products by `main_category` field in Supabase
- Updates product count and product display
- Desktop viewport only (1920x1080) - Mobile testing in separate phase

---

## 🎯 Test Strategy

**Focus:** Verify main category filter functionality, product filtering, and UI state management

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 20-30 seconds

**Tags:** @e2e, @public, @catalog, @filtering, @desktop, @development, @staging, @production

**Note:** Create test file in `tests/e2e/public/catalog-page/` folder. This test verifies main category filter buttons and product filtering logic.

### Workflow to Test:
1. Navigate to `/catalogo`
2. Verify all three filter buttons are visible
3. Test "Todas" button (shows all products)
4. Test "Cuero" button (filters to cuero products)
5. Test "Macramé" button (filters to macramé products)
6. Verify product filtering accuracy
7. Verify UI state updates
8. No cleanup needed (read-only test)

---

## UI Test

**File:** `tests/e2e/public/catalog-page/catalog-page-main-category-filter-works-correctly.spec.ts` (new test)

**Test Structure:** Single comprehensive test with multiple filter scenarios

### Required Data-TestIds

Request the following `data-testid` attributes to be added:

1. **Main Category Filter Section** - "Tipo de Artesanía" section container
2. **Todas Button** - "Todas" filter button
3. **Cuero Button** - "Cuero" filter button
4. **Macramé Button** - "Macramé" filter button

**Note:** If there are any flaky locators identified in the flow of the test, please add `data-testid` attributes as needed to ensure stable test automation.

---

### Test Steps

**Setup:**
- Navigate to `/catalogo`
- Wait for `networkidle` state
- Wait for products to load

**Step 1: Verify Filter Buttons Visibility**
- Verify "Tipo de Artesanía" heading is visible
- Verify three filter buttons are visible:
  - "Todas"
  - "Cuero"
  - "Macramé"
- Verify buttons are in a horizontal row
- Verify buttons have correct spacing

**Step 2: Verify Default State - "Todas" Selected**
- Verify "Todas" button has active styling:
  - Background: `bg-leather-600`
  - Text color: `text-white`
- Verify "Cuero" button has inactive styling:
  - Background: `bg-gray-200`
  - Text color: `text-gray-700`
- Verify "Macramé" button has inactive styling
- Verify all products are displayed (no filtering)

**Step 3: Test "Cuero" Filter**
- Click "Cuero" button
- Wait for products to filter (check for `isFiltering` state, then wait for completion)
- Verify "Cuero" button has active styling (bg-leather-600, text-white)
- Verify "Todas" button has inactive styling
- Verify "Macramé" button has inactive styling
- Verify Supabase API call includes: `main_category=eq.cuero`
- Verify all displayed products have `main_category = 'cuero'`
- Verify product count text includes "de Cuero"
- Verify product count matches filtered products

**Step 4: Test "Macramé" Filter**
- Click "Macramé" button
- Wait for products to filter
- Verify "Macramé" button has active styling
- Verify "Cuero" button has inactive styling
- Verify "Todas" button has inactive styling
- Verify Supabase API call includes: `main_category=eq.macrame`
- Verify all displayed products have `main_category = 'macrame'`
- Verify product count text includes "de Macramé"
- Verify product count matches filtered products

**Step 5: Test "Todas" Filter (Reset)**
- Click "Todas" button
- Wait for products to reload
- Verify "Todas" button has active styling
- Verify other buttons have inactive styling
- Verify Supabase API call does NOT include main_category filter
- Verify all products are displayed (no filtering by main category)
- Verify product count text does NOT include "de Cuero" or "de Macramé"
- Verify product count matches total available products

**Step 6: Verify Filter Transitions**
- Click "Cuero" button
- Wait for filter animation (check opacity transitions)
- Verify smooth transition (not instant)
- Click "Macramé" button
- Verify smooth transition
- Click "Todas" button
- Verify smooth transition

**Step 7: Verify Filter with Subcategory**
- Click "Cuero" button
- Wait for products to filter
- Click a subcategory from sidebar (e.g., "Billeteras")
- Wait for products to filter
- Verify both filters are active:
  - Main category: Cuero
  - Subcategory: Selected category
- Verify all displayed products have:
  - `main_category = 'cuero'`
  - `category_id` matching selected subcategory
- Verify product count reflects both filters

**Step 8: Verify Filter with Search**
- Click "Cuero" button
- Wait for products to filter
- Type search term in search input
- Wait for search to complete
- Verify all displayed products have:
  - `main_category = 'cuero'`
  - Title or description matching search term
- Verify product count reflects both filter and search

**Step 9: Verify Filter with Inventory Status**
- Click "Cuero" button
- Wait for products to filter
- Check an inventory status filter (e.g., "En Stock")
- Wait for products to filter
- Verify all displayed products have:
  - `main_category = 'cuero'`
  - `inventory_status` matching selected status
- Verify product count reflects all active filters

**Step 10: Verify Button Hover States**
- Hover over "Cuero" button (when inactive)
- Verify hover effect: `hover:bg-gray-300`
- Hover over "Macramé" button (when inactive)
- Verify hover effect
- Verify active button does not change on hover

**Step 11: Verify API Call Accuracy**
- Intercept Supabase API request
- Click "Cuero" button
- Verify request includes: `.eq('main_category', 'cuero')`
- Click "Macramé" button
- Verify request includes: `.eq('main_category', 'macrame')`
- Click "Todas" button
- Verify request does NOT include main_category filter

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**Filter Buttons:**
- Three buttons are visible and clickable
- Active button has leather-600 background and white text
- Inactive buttons have gray background and gray text
- Hover effects work correctly

**Product Filtering:**
- "Todas" shows all available products
- "Cuero" shows only cuero products
- "Macramé" shows only macramé products
- Filtering is accurate (all displayed products match filter)

**State Management:**
- Only one button is active at a time
- Button state updates correctly on click
- Product count updates correctly
- Filter state persists during page interaction

**Combined Filters:**
- Main category filter works with subcategory filter
- Main category filter works with search
- Main category filter works with inventory filters
- All filters combine correctly (AND logic)

---

## Acceptance Criteria

- [ ] All three filter buttons are visible
- [ ] "Todas" button is selected by default
- [ ] Button styling is correct (active vs inactive)
- [ ] "Cuero" button filters products correctly
- [ ] "Macramé" button filters products correctly
- [ ] "Todas" button shows all products
- [ ] Product filtering is accurate (all products match filter)
- [ ] Product count updates correctly
- [ ] Filter state persists correctly
- [ ] Filter works with other filters (subcategory, search, inventory)
- [ ] API calls include correct main_category filter
- [ ] Smooth transitions between filters
- [ ] Hover effects work correctly

---

**Note:**
- This is a read-only test - no data creation or modification
- Tests run against production/staging data in Supabase
- Requires products with different main_category values in database
- Filter accuracy depends on correct main_category values in products


