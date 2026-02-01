# QA Ticket: CatalogPage Product Count Displays Correctly (QA-22)

## Project
QA (QA)

## Issue Type
Story

UI Test - CatalogPage Product Count Displays Correctly (QA-22)

**Parent Epic:** QA-13

**Links to GMP Epics:** GMP-26, GMP-27

---

## 📋 Description

Comprehensive test that verifies product count displays correctly on CatalogPage, including initial count, filtered count, main category count, subcategory count, search count, and combined filter count.

**Context:**
- Product count updates dynamically based on active filters
- Shows total count, filtered count, and context (category, search term)
- Count should match actual displayed products
- Desktop viewport only (1920x1080) - Mobile testing in separate phase

---

## 🎯 Test Strategy

**Focus:** Verify product count accuracy and dynamic updates based on filters

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 20-30 seconds

**Tags:** @e2e, @public, @catalog, @desktop, @development, @staging, @production

**Note:** Create test file in `tests/e2e/public/catalog-page/` folder. This test verifies product count accuracy across different filter combinations.

### Workflow to Test:
1. Navigate to `/catalogo`
2. Verify initial product count
3. Apply main category filter, verify count updates
4. Apply subcategory filter, verify count updates
5. Apply inventory filter, verify count updates
6. Apply search, verify count updates
7. Apply combined filters, verify count updates
8. No cleanup needed (read-only test)

---

## UI Test

**File:** `tests/e2e/public/catalog-page/catalog-page-product-count-displays-correctly.spec.ts` (new test)

**Test Structure:** Single comprehensive test with multiple filter scenarios

### Required Data-TestIds

Request the following `data-testid` attributes to be added:

1. **Product Count Text** - "Mostrando X productos" text element
2. **Product Grid Container** - Container to count actual product cards

**Note:** If there are any flaky locators identified in the flow of the test, please add `data-testid` attributes as needed to ensure stable test automation.

---

### Test Steps

**Setup:**
- Navigate to `/catalogo`
- Wait for `networkidle` state
- Wait for products to load

**Step 1: Verify Initial Product Count**
- Locate product count text: "Mostrando X productos"
- Extract count number from text
- Count actual product cards displayed
- Verify count text matches actual product cards count
- Verify count is greater than or equal to 0

**Step 2: Verify Count with Main Category Filter - Cuero**
- Click "Cuero" main category button
- Wait for products to filter (check for `isFiltering` state)
- Verify product count text updates
- Verify count text includes context: "de Cuero"
- Count actual product cards
- Verify count text matches actual product cards
- Verify all displayed products have `main_category = 'cuero'`

**Step 3: Verify Count with Main Category Filter - Macramé**
- Click "Macramé" main category button
- Wait for products to filter
- Verify product count text updates
- Verify count text includes context: "de Macramé"
- Count actual product cards
- Verify count text matches actual product cards
- Verify all displayed products have `main_category = 'macrame'`

**Step 4: Verify Count with Subcategory Filter**
- Click a subcategory from CategoryFilter sidebar (e.g., "Billeteras")
- Wait for products to filter
- Verify product count text updates
- Verify count text includes context: "en [Category Name]"
- Count actual product cards
- Verify count text matches actual product cards
- Verify URL parameter updates: `/catalogo?categoria=[category]`
- Verify all displayed products belong to selected category

**Step 5: Verify Count with Inventory Status Filter**
- Check an inventory status checkbox (e.g., "En Stock")
- Wait for products to filter
- Verify product count text updates
- Verify count text includes indicator: "• Filtros de inventario activos"
- Count actual product cards
- Verify count text matches actual product cards
- Verify all displayed products match selected inventory status

**Step 6: Verify Count with Search**
- Type search term in search input (e.g., "billetera")
- Wait for debounce (500ms) and search to complete
- Verify product count text updates
- Verify count text includes context: `para "[search term]"`
- Count actual product cards
- Verify count text matches actual product cards
- Verify all displayed products match search term (title or description)

**Step 7: Verify Count with Combined Filters**
- Apply main category filter: "Cuero"
- Apply subcategory filter: "Billeteras"
- Apply inventory filter: "En Stock"
- Wait for all filters to apply
- Verify product count text includes all contexts:
  - "de Cuero"
  - "en Billeteras"
  - "• Filtros de inventario activos"
- Count actual product cards
- Verify count text matches actual product cards
- Verify all displayed products match ALL active filters

**Step 8: Verify Count with No Results**
- Apply filters that result in no products (e.g., search for non-existent term)
- Verify product count text shows "Mostrando 0 productos"
- Verify empty state is displayed
- Verify no product cards are visible

**Step 9: Verify Count Reset**
- Clear all filters (click "Todas", clear inventory filters, clear search)
- Wait for products to reload
- Verify product count text resets to initial count
- Verify count text no longer includes filter contexts
- Count actual product cards
- Verify count matches initial count

**Step 10: Verify Count Accuracy with Supabase**
- Intercept Supabase API response
- Extract product count from API response
- Compare API count with displayed count text
- Verify counts match (accounting for client-side filtering if any)

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**Initial Count:**
- Product count displays total available products
- Count matches actual displayed product cards
- Count is accurate

**Filtered Count:**
- Count updates when filters are applied
- Count includes context (category, search term)
- Count matches filtered product cards
- Count is accurate

**Combined Filters:**
- Count reflects all active filters
- Count includes all relevant contexts
- Count is accurate

**No Results:**
- Count shows "0 productos"
- Empty state is displayed
- Appropriate message is shown

---

## Acceptance Criteria

- [ ] Initial product count displays correctly
- [ ] Product count matches actual displayed product cards
- [ ] Count updates when main category filter is applied
- [ ] Count updates when subcategory filter is applied
- [ ] Count updates when inventory filter is applied
- [ ] Count updates when search is applied
- [ ] Count updates correctly with combined filters
- [ ] Count includes appropriate context text
- [ ] Count shows "0 productos" when no results
- [ ] Count resets correctly when filters are cleared
- [ ] Count accuracy verified against Supabase API response

---

**Note:**
- This is a read-only test - no data creation or modification
- Tests run against production/staging data in Supabase
- Count may vary based on available products in database
- Some filter combinations may result in 0 products (expected behavior)


