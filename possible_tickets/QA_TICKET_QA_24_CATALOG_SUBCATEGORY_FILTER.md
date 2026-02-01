# QA Ticket: CatalogPage Subcategory Filter Works Correctly (QA-24)

## Project
QA (QA)

## Issue Type
Story

UI Test - CatalogPage Subcategory Filter Works Correctly (QA-24)

**Parent Epic:** QA-13

**Links to GMP Epics:** GMP-26, GMP-29

---

## 📋 Description

Comprehensive test that verifies subcategory filter (CategoryFilter sidebar) works correctly, filters products by category, displays product counts per category, updates URL parameters, and maintains filter state.

**Context:**
- Subcategory filter is in the CategoryFilter sidebar component
- Categories are grouped by main category (Cuero/Macramé)
- Each category shows product count
- Filter updates URL parameter: `/catalogo?categoria=[category]`
- Categories load from Supabase with product counts
- Desktop viewport only (1920x1080) - Mobile testing in separate phase

---

## 🎯 Test Strategy

**Focus:** Verify subcategory filter functionality, product filtering, URL parameters, and product counts

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 25-35 seconds

**Tags:** @e2e, @public, @catalog, @filtering, @desktop, @development, @staging, @production

**Note:** Create test file in `tests/e2e/public/catalog-page/` folder. This test verifies CategoryFilter sidebar and subcategory filtering logic.

### Workflow to Test:
1. Navigate to `/catalogo`
2. Verify CategoryFilter sidebar is visible
3. Verify categories are loaded with product counts
4. Test "Todas las categorías" option
5. Test individual category filters
6. Verify URL parameter updates
7. Verify product filtering accuracy
8. Verify product counts per category
9. No cleanup needed (read-only test)

---

## UI Test

**File:** `tests/e2e/public/catalog-page/catalog-page-subcategory-filter-works-correctly.spec.ts` (new test)

**Test Structure:** Single comprehensive test with multiple category scenarios

### Required Data-TestIds

Request the following `data-testid` attributes to be added:

1. **CategoryFilter Sidebar** - CategoryFilter component container
2. **Todas las Categorías Button** - "Todas las categorías" option
3. **Category Button** - Individual category buttons (can use category name as identifier)
4. **Category Product Count** - Product count number next to category name

**Note:** If there are any flaky locators identified in the flow of the test, please add `data-testid` attributes as needed to ensure stable test automation.

---

### Test Steps

**Setup:**
- Navigate to `/catalogo`
- Wait for `networkidle` state
- Wait for categories and products to load

**Step 1: Verify CategoryFilter Sidebar**
- Verify CategoryFilter sidebar is visible on left side
- Verify sidebar has white background and rounded corners
- Verify "Categorías" heading is visible
- Verify sidebar is properly positioned (lg:w-64)

**Step 2: Verify Categories Load with Product Counts**
- Verify "Todas las categorías" option is visible
- Verify it shows total product count
- Verify categories are grouped by main category:
  - "Artesanías en Cuero" section
  - "Macramé Artesanal" section
- Verify each category displays:
  - Category name
  - Product count number
- Verify categories are sorted alphabetically within each group
- Verify Supabase API call to load categories with counts

**Step 3: Verify "Todas las Categorías" Option**
- Verify "Todas las categorías" is selected by default (active styling)
- Verify active styling: `bg-leather-100 text-leather-800 font-medium`
- Click "Todas las categorías" (if not already selected)
- Verify all products are displayed (no category filtering)
- Verify URL does NOT include `categoria` parameter
- Verify product count matches total available products

**Step 4: Test Individual Category Filter**
- Select a category from sidebar (e.g., "Billeteras")
- Wait for products to filter
- Verify selected category has active styling
- Verify "Todas las categorías" has inactive styling
- Verify URL parameter updates: `/catalogo?categoria=billeteras`
- Verify Supabase API call includes category filter:
  - First: Get category ID by name
  - Then: Filter products by `category_id`
- Verify all displayed products belong to selected category
- Verify product count matches category's product count
- Verify product count text includes: "en [Category Name]"

**Step 5: Test Category from Cuero Group**
- Select a category from "Artesanías en Cuero" section
- Wait for products to filter
- Verify all displayed products have:
  - `main_category = 'cuero'`
  - `category_id` matching selected category
- Verify product count is correct
- Verify URL parameter is correct

**Step 6: Test Category from Macramé Group**
- Select a category from "Macramé Artesanal" section
- Wait for products to filter
- Verify all displayed products have:
  - `main_category = 'macrame'`
  - `category_id` matching selected category
- Verify product count is correct
- Verify URL parameter is correct

**Step 7: Verify URL Parameter on Page Load**
- Navigate directly to `/catalogo?categoria=billeteras`
- Wait for page to load
- Verify "Billeteras" category is selected (active styling)
- Verify products are filtered to Billeteras category
- Verify URL parameter is preserved

**Step 8: Test Category Change**
- Select "Billeteras" category
- Wait for products to filter
- Select "Cinturones" category
- Wait for products to filter
- Verify "Cinturones" is now active
- Verify "Billeteras" is inactive
- Verify URL parameter updates to new category
- Verify products update correctly

**Step 9: Verify Category Filter with Main Category Filter**
- Click "Cuero" main category button
- Wait for products to filter
- Select a category from "Artesanías en Cuero" section
- Wait for products to filter
- Verify all displayed products have:
  - `main_category = 'cuero'`
  - `category_id` matching selected category
- Verify product count reflects both filters

**Step 10: Verify Category Filter with Search**
- Select a category (e.g., "Billeteras")
- Wait for products to filter
- Type search term in search input
- Wait for search to complete
- Verify all displayed products have:
  - `category_id` matching selected category
  - Title or description matching search term
- Verify product count reflects both filter and search

**Step 11: Verify Category Filter with Inventory Status**
- Select a category
- Wait for products to filter
- Check an inventory status filter
- Wait for products to filter
- Verify all displayed products have:
  - `category_id` matching selected category
  - `inventory_status` matching selected status
- Verify product count reflects all active filters

**Step 12: Verify Category Hover States**
- Hover over a category button (when inactive)
- Verify hover effect: `hover:bg-leather-50 hover:text-leather-800`
- Verify smooth transition
- Verify active category does not change on hover

**Step 13: Verify Product Counts Accuracy**
- For each category, verify:
  - Displayed product count matches actual product cards
  - Count matches Supabase API response
  - Count is accurate for filtered products

**Step 14: Verify Category Grouping**
- Verify categories are properly grouped by main_category
- Verify main category headers are visible
- Verify subcategories are indented under main category
- Verify grouping is correct (cuero vs macramé)

**Step 15: Verify Clear Search on Category Change**
- Type search term in search input
- Wait for search to complete
- Select a category
- Verify search input is cleared
- Verify search term state is reset
- Verify only category filter is active

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**CategoryFilter Sidebar:**
- Sidebar is visible and properly styled
- Categories are grouped by main category
- Each category shows product count
- Categories are sorted alphabetically

**Category Selection:**
- "Todas las categorías" shows all products
- Individual categories filter products correctly
- Active category has correct styling
- Inactive categories have correct styling

**Product Filtering:**
- Products are filtered by selected category
- All displayed products belong to selected category
- Product count matches category's product count
- Filtering is accurate

**URL Parameters:**
- URL updates when category is selected
- URL parameter is read on page load
- Category is selected based on URL parameter

**Combined Filters:**
- Category filter works with main category filter
- Category filter works with search
- Category filter works with inventory filters
- All filters combine correctly

---

## Acceptance Criteria

- [ ] CategoryFilter sidebar is visible
- [ ] Categories load with product counts
- [ ] Categories are grouped by main category
- [ ] "Todas las categorías" option works correctly
- [ ] Individual category filters work correctly
- [ ] Category selection updates URL parameter
- [ ] URL parameter is read on page load
- [ ] Product filtering is accurate
- [ ] Product counts are accurate
- [ ] Category styling is correct (active vs inactive)
- [ ] Category filter works with other filters
- [ ] Search clears when category changes
- [ ] Hover effects work correctly
- [ ] Smooth transitions between categories

---

**Note:**
- This is a read-only test - no data creation or modification
- Tests run against production/staging data in Supabase
- Requires categories with products in database
- Category names are case-sensitive in URL parameters


