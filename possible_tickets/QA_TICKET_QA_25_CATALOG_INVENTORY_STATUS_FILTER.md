# QA Ticket: CatalogPage Inventory Status Filter Works Correctly (QA-25)

## Project
QA (QA)

## Issue Type
Story

UI Test - CatalogPage Inventory Status Filter Works Correctly (QA-25)

**Parent Epic:** QA-13

**Links to GMP Epics:** GMP-26, GMP-30

---

## 📋 Description

Comprehensive test that verifies inventory status filter checkboxes work correctly, filter products by inventory_status, support multiple selections, show "Limpiar" button when active, and combine correctly with other filters.

**Context:**
- Inventory status filter is in CategoryFilter sidebar
- Five checkboxes: Pieza Única, Encargo Mismo Material, Encargo Diferente Material, No Disponible, En Stock
- Supports multiple selections (OR logic)
- Shows "Limpiar" button when any filter is active
- Filters products by `inventory_status` field in Supabase
- Desktop viewport only (1920x1080) - Mobile testing in separate phase

---

## 🎯 Test Strategy

**Focus:** Verify inventory status filter checkboxes, multiple selections, product filtering, and "Limpiar" button

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 25-35 seconds

**Tags:** @e2e, @public, @catalog, @filtering, @desktop, @development, @staging, @production

**Note:** Create test file in `tests/e2e/public/catalog-page/` folder. This test verifies inventory status filter functionality and multiple selection logic.

### Workflow to Test:
1. Navigate to `/catalogo`
2. Verify inventory status filter section is visible
3. Verify all five checkboxes are visible
4. Test individual checkbox selections
5. Test multiple checkbox selections
6. Test "Limpiar" button
7. Verify product filtering accuracy
8. Verify filter combines with other filters
9. No cleanup needed (read-only test)

---

## UI Test

**File:** `tests/e2e/public/catalog-page/catalog-page-inventory-status-filter-works-correctly.spec.ts` (new test)

**Test Structure:** Single comprehensive test with multiple filter scenarios

### Required Data-TestIds

Request the following `data-testid` attributes to be added:

1. **Inventory Status Filter Section** - "Estado de Inventario" section container
2. **Pieza Única Checkbox** - Checkbox for "Pieza Única"
3. **Encargo Mismo Material Checkbox** - Checkbox for "Encargo Mismo Material"
4. **Encargo Diferente Material Checkbox** - Checkbox for "Encargo Diferente Material"
5. **No Disponible Checkbox** - Checkbox for "No Disponible"
6. **En Stock Checkbox** - Checkbox for "En Stock"
7. **Limpiar Button** - "Limpiar" button (when filters are active)

**Note:** If there are any flaky locators identified in the flow of the test, please add `data-testid` attributes as needed to ensure stable test automation.

---

### Test Steps

**Setup:**
- Navigate to `/catalogo`
- Wait for `networkidle` state
- Wait for products to load

**Step 1: Verify Inventory Status Filter Section**
- Verify "Estado de Inventario" heading is visible
- Verify section is in CategoryFilter sidebar
- Verify section has border-top separator
- Verify all five checkboxes are visible with labels:
  - "Pieza Única"
  - "Encargo Mismo Material"
  - "Encargo Diferente Material"
  - "No Disponible"
  - "En Stock"
- Verify all checkboxes are unchecked by default
- Verify "Limpiar" button is NOT visible (no active filters)

**Step 2: Test Single Checkbox - "En Stock"**
- Check "En Stock" checkbox
- Wait for products to filter
- Verify checkbox is checked
- Verify "Limpiar" button is visible
- Verify Supabase API call includes: `.in('inventory_status', ['en_stock'])`
- Verify all displayed products have `inventory_status = 'en_stock'`
- Verify product count text includes: "• Filtros de inventario activos"
- Verify product count matches filtered products

**Step 3: Test Single Checkbox - "Pieza Única"**
- Uncheck "En Stock" (if checked)
- Check "Pieza Única" checkbox
- Wait for products to filter
- Verify checkbox is checked
- Verify all displayed products have `inventory_status = 'pieza_unica'`
- Verify product count is correct

**Step 4: Test Multiple Checkboxes (OR Logic)**
- Check "En Stock" checkbox
- Wait for products to filter
- Check "Pieza Única" checkbox
- Wait for products to filter
- Verify both checkboxes are checked
- Verify Supabase API call includes: `.in('inventory_status', ['en_stock', 'pieza_unica'])`
- Verify all displayed products have `inventory_status` in ['en_stock', 'pieza_unica']
- Verify product count reflects both statuses
- Verify product count is sum of both statuses (approximately)

**Step 5: Test All Checkboxes**
- Check all five checkboxes
- Wait for products to filter
- Verify all checkboxes are checked
- Verify Supabase API call includes all five statuses
- Verify all displayed products have `inventory_status` matching one of the selected statuses
- Verify product count reflects all selected statuses

**Step 6: Test "Limpiar" Button**
- Verify "Limpiar" button is visible (with active filters)
- Click "Limpiar" button
- Wait for products to reload
- Verify all checkboxes are unchecked
- Verify "Limpiar" button is NOT visible
- Verify all products are displayed (no inventory filtering)
- Verify product count text does NOT include "• Filtros de inventario activos"
- Verify product count matches total available products

**Step 7: Test Uncheck Individual Checkbox**
- Check "En Stock" checkbox
- Wait for products to filter
- Check "Pieza Única" checkbox
- Wait for products to filter
- Uncheck "En Stock" checkbox
- Wait for products to filter
- Verify "En Stock" is unchecked
- Verify "Pieza Única" is still checked
- Verify only "Pieza Única" products are displayed
- Verify "Limpiar" button is still visible (other filter active)

**Step 8: Verify Filter with Main Category**
- Check "En Stock" checkbox
- Wait for products to filter
- Click "Cuero" main category button
- Wait for products to filter
- Verify all displayed products have:
  - `main_category = 'cuero'`
  - `inventory_status = 'en_stock'`
- Verify product count reflects both filters

**Step 9: Verify Filter with Subcategory**
- Check "En Stock" checkbox
- Wait for products to filter
- Select a category from sidebar
- Wait for products to filter
- Verify all displayed products have:
  - `category_id` matching selected category
  - `inventory_status = 'en_stock'`
- Verify product count reflects both filters

**Step 10: Verify Filter with Search**
- Check "En Stock" checkbox
- Wait for products to filter
- Type search term in search input
- Wait for search to complete
- Verify all displayed products have:
  - `inventory_status = 'en_stock'`
  - Title or description matching search term
- Verify product count reflects both filter and search

**Step 11: Verify Filter Clears Search**
- Type search term in search input
- Wait for search to complete
- Check an inventory status checkbox
- Wait for products to filter
- Verify search input is cleared
- Verify search term state is reset
- Verify only inventory filter is active

**Step 12: Verify Checkbox States**
- Verify unchecked checkbox has: `checked={false}`
- Verify checked checkbox has: `checked={true}`
- Verify checkbox styling is correct
- Verify checkbox labels are clickable

**Step 13: Verify Empty State with Filters**
- Check inventory status filters that result in no products
- Wait for products to filter
- Verify empty state is displayed
- Verify empty state message mentions inventory filters
- Verify "No se encontraron productos" heading is visible
- Verify appropriate empty state message

**Step 14: Verify API Call Accuracy**
- Intercept Supabase API request
- Check "En Stock" checkbox
- Verify request includes: `.in('inventory_status', ['en_stock'])`
- Check "Pieza Única" checkbox
- Verify request includes: `.in('inventory_status', ['en_stock', 'pieza_unica'])`
- Click "Limpiar" button
- Verify request does NOT include inventory_status filter

**Step 15: Verify Filter Persistence**
- Check "En Stock" checkbox
- Wait for products to filter
- Select a category
- Wait for products to filter
- Verify "En Stock" checkbox is still checked
- Verify both filters are active
- Verify products match both filters

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**Inventory Status Filter:**
- Five checkboxes are visible with correct labels
- Checkboxes are unchecked by default
- "Limpiar" button appears when any filter is active
- "Limpiar" button clears all filters

**Product Filtering:**
- Single checkbox filters products correctly
- Multiple checkboxes filter with OR logic
- All displayed products match selected status(es)
- Filtering is accurate

**Combined Filters:**
- Inventory filter works with main category filter
- Inventory filter works with subcategory filter
- Inventory filter works with search
- All filters combine correctly (AND logic)

**State Management:**
- Checkbox states update correctly
- "Limpiar" button visibility updates correctly
- Filter state persists during other filter changes
- Search clears when inventory filter is applied

---

## Acceptance Criteria

- [ ] Inventory status filter section is visible
- [ ] All five checkboxes are visible with correct labels
- [ ] Checkboxes are unchecked by default
- [ ] "Limpiar" button appears when filters are active
- [ ] Single checkbox filters products correctly
- [ ] Multiple checkboxes filter with OR logic
- [ ] Product filtering is accurate
- [ ] "Limpiar" button clears all filters
- [ ] Unchecking individual checkbox works correctly
- [ ] Filter works with main category filter
- [ ] Filter works with subcategory filter
- [ ] Filter works with search
- [ ] Filter clears search when applied
- [ ] Empty state displays correctly with filters
- [ ] API calls include correct inventory_status filter
- [ ] Filter state persists correctly

---

**Note:**
- This is a read-only test - no data creation or modification
- Tests run against production/staging data in Supabase
- Requires products with different inventory_status values
- Multiple selections use OR logic (products matching ANY selected status)
- "sin_stock" products are hidden from public catalog by default


