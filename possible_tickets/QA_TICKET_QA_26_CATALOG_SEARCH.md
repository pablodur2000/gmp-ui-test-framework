# QA Ticket: CatalogPage Search Functionality Works Correctly (QA-26)

## Project
QA (QA)

## Issue Type
Story

UI Test - CatalogPage Search Functionality Works Correctly (QA-26)

**Parent Epic:** QA-13

**Links to GMP Epics:** GMP-26, GMP-31

---

## 📋 Description

Comprehensive test that verifies search functionality works correctly, includes debounce (500ms), searches in title and description, combines with filters, shows loading state, and handles empty results.

**Context:**
- Search input is in the main content area
- Searches products by title and description (case-insensitive)
- Uses 500ms debounce to avoid excessive API calls
- Shows loading spinner during search
- Combines with other filters (category, inventory status)
- Desktop viewport only (1920x1080) - Mobile testing in separate phase

---

## 🎯 Test Strategy

**Focus:** Verify search input, debounce behavior, search accuracy, loading states, and filter combinations

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 25-35 seconds

**Tags:** @e2e, @public, @catalog, @search, @desktop, @development, @staging, @production

**Note:** Create test file in `tests/e2e/public/catalog-page/` folder. This test verifies search functionality and debounce behavior.

### Workflow to Test:
1. Navigate to `/catalogo`
2. Verify search input is visible
3. Test search with different terms
4. Verify debounce behavior (500ms)
5. Verify search accuracy (title and description)
6. Verify search with filters
7. Verify empty results
8. Verify loading state
9. No cleanup needed (read-only test)

---

## UI Test

**File:** `tests/e2e/public/catalog-page/catalog-page-search-functionality-works-correctly.spec.ts` (new test)

**Test Structure:** Single comprehensive test with multiple search scenarios

### Required Data-TestIds

Request the following `data-testid` attributes to be added:

1. **Search Input** - Search input field
2. **Search Loading Spinner** - Loading indicator during search
3. **Search Icon** - Search icon in input field

**Note:** If there are any flaky locators identified in the flow of the test, please add `data-testid` attributes as needed to ensure stable test automation.

---

### Test Steps

**Setup:**
- Navigate to `/catalogo`
- Wait for `networkidle` state
- Wait for products to load

**Step 1: Verify Search Input**
- Verify search input is visible
- Verify search input has Search icon on left
- Verify placeholder text: "Buscar productos por nombre..."
- Verify input is enabled and focusable
- Verify input type is "text"

**Step 2: Test Basic Search**
- Type search term in search input (e.g., "billetera")
- Wait for debounce (500ms) + search completion
- Verify search loading spinner appears during search
- Verify search loading spinner disappears after search
- Verify Supabase API call includes: `.or('title.ilike.%billetera%,description.ilike.%billetera%')`
- Verify all displayed products have title or description matching search term
- Verify product count text includes: `para "billetera"`
- Verify product count matches search results

**Step 3: Verify Debounce Behavior**
- Type "b" in search input
- Wait 300ms (less than debounce)
- Type "i" (now "bi")
- Wait 300ms
- Type "l" (now "bil")
- Verify only ONE API call is made after 500ms debounce
- Verify search executes only after typing stops for 500ms
- Verify no excessive API calls during typing

**Step 4: Test Search by Title**
- Clear search input
- Type a product title (or part of it)
- Wait for search to complete
- Verify all displayed products have title matching search term (case-insensitive)
- Verify search is case-insensitive (test with uppercase/lowercase)

**Step 5: Test Search by Description**
- Clear search input
- Type a word from product description
- Wait for search to complete
- Verify all displayed products have description matching search term (case-insensitive)
- Verify search matches partial words

**Step 6: Test Search with No Results**
- Type search term that doesn't match any products (e.g., "xyz123nonexistent")
- Wait for search to complete
- Verify empty state is displayed
- Verify empty state message: `No hay productos que coincidan con "[search term]"`
- Verify no product cards are displayed
- Verify product count shows "Mostrando 0 productos"

**Step 7: Test Clear Search**
- Type search term
- Wait for search to complete
- Clear search input (select all and delete, or use clear button if exists)
- Wait for debounce + reload
- Verify all products are displayed (no search filter)
- Verify product count text does NOT include search term
- Verify product count matches total available products

**Step 8: Test Search with Main Category Filter**
- Click "Cuero" main category button
- Wait for products to filter
- Type search term in search input
- Wait for search to complete
- Verify all displayed products have:
  - `main_category = 'cuero'`
  - Title or description matching search term
- Verify product count reflects both filter and search
- Verify product count text includes both contexts

**Step 9: Test Search with Subcategory Filter**
- Select a category from sidebar
- Wait for products to filter
- Type search term in search input
- Wait for search to complete
- Verify all displayed products have:
  - `category_id` matching selected category
  - Title or description matching search term
- Verify product count reflects both filter and search

**Step 10: Test Search with Inventory Status Filter**
- Check an inventory status checkbox
- Wait for products to filter
- Type search term in search input
- Wait for search to complete
- Verify all displayed products have:
  - `inventory_status` matching selected status
  - Title or description matching search term
- Verify product count reflects both filter and search

**Step 11: Test Search with Combined Filters**
- Click "Cuero" main category button
- Select a category from sidebar
- Check an inventory status checkbox
- Wait for all filters to apply
- Type search term in search input
- Wait for search to complete
- Verify all displayed products match ALL filters:
  - `main_category = 'cuero'`
  - `category_id` matching selected category
  - `inventory_status` matching selected status
  - Title or description matching search term
- Verify product count reflects all active filters

**Step 12: Verify Search Clears on Category Change**
- Type search term in search input
- Wait for search to complete
- Select a category from sidebar
- Verify search input is cleared
- Verify search term state is reset
- Verify only category filter is active

**Step 13: Verify Search Clears on Inventory Filter Change**
- Type search term in search input
- Wait for search to complete
- Check an inventory status checkbox
- Verify search input is cleared
- Verify search term state is reset
- Verify only inventory filter is active

**Step 14: Verify Search Loading State**
- Type search term in search input
- Verify search loading spinner appears immediately
- Wait for debounce (500ms)
- Verify spinner is still visible during API call
- Wait for search to complete
- Verify spinner disappears
- Verify products are displayed

**Step 15: Test Special Characters in Search**
- Type search term with special characters (e.g., "cinturón")
- Wait for search to complete
- Verify search handles special characters correctly
- Verify products matching special characters are displayed

**Step 16: Test Long Search Term**
- Type a long search term (20+ characters)
- Wait for search to complete
- Verify search handles long terms correctly
- Verify results are accurate

**Step 17: Test Empty Search**
- Type search term
- Wait for search to complete
- Clear search input completely
- Wait for debounce + reload
- Verify `loadProducts()` is called (not `handleSearch()`)
- Verify all products are displayed
- Verify no search filter is active

**Step 18: Verify API Call Accuracy**
- Intercept Supabase API request
- Type search term "billetera"
- Wait for search to complete
- Verify request includes: `.or('title.ilike.%billetera%,description.ilike.%billetera%')`
- Verify request includes other active filters (if any)
- Verify case-insensitive search (ilike)

**Step 19: Verify Search Input Focus**
- Click search input
- Verify input receives focus
- Verify cursor is in input field
- Type search term
- Verify text appears in input

**Step 20: Verify Search Icon**
- Verify Search icon is visible on left side of input
- Verify icon is properly positioned
- Verify icon does not interfere with input functionality

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**Search Input:**
- Search input is visible and functional
- Search icon is visible on left
- Placeholder text is correct
- Input is focusable and typeable

**Search Functionality:**
- Search executes after 500ms debounce
- Search is case-insensitive
- Search matches title and description
- Search results are accurate

**Debounce:**
- Only one API call after typing stops for 500ms
- No excessive API calls during typing
- Debounce works correctly

**Loading State:**
- Loading spinner appears during search
- Spinner disappears after search completes
- Smooth transition

**Combined Filters:**
- Search works with main category filter
- Search works with subcategory filter
- Search works with inventory status filter
- All filters combine correctly

**Empty Results:**
- Empty state displays correctly
- Appropriate message is shown
- No product cards displayed

---

## Acceptance Criteria

- [ ] Search input is visible and functional
- [ ] Search icon is visible
- [ ] Search executes after 500ms debounce
- [ ] Debounce prevents excessive API calls
- [ ] Search matches product titles
- [ ] Search matches product descriptions
- [ ] Search is case-insensitive
- [ ] Search results are accurate
- [ ] Search loading spinner appears/disappears correctly
- [ ] Search works with main category filter
- [ ] Search works with subcategory filter
- [ ] Search works with inventory status filter
- [ ] Search works with combined filters
- [ ] Search clears on category change
- [ ] Search clears on inventory filter change
- [ ] Empty results display correctly
- [ ] Clear search works correctly
- [ ] API calls include correct search query

---

**Note:**
- This is a read-only test - no data creation or modification
- Tests run against production/staging data in Supabase
- Debounce timing is critical (500ms)
- Search uses case-insensitive matching (ilike)
- Search matches partial words in title and description


