# QA Ticket: CatalogPage Loads and Displays All Products (QA-21)

## Project
QA (QA)

## Issue Type
Story

UI Test - CatalogPage Loads and Displays All Products (QA-21)

**Parent Epic:** QA-13

**Links to GMP Epics:** GMP-26, GMP-27

---

## 📋 Description

Comprehensive test that verifies CatalogPage loads correctly with all products, proper layout, loading states, empty states, product cards display, and Supabase API integration.

**Context:**
- CatalogPage is the main product browsing page
- Loads products from Supabase with filtering capabilities
- Displays products in grid or list view
- Shows product count and handles empty states
- Desktop viewport only (1920x1080) - Mobile testing in separate phase

---

## 🎯 Test Strategy

**Focus:** Verify CatalogPage loads correctly with all products, proper data display, and Supabase integration

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 15-20 seconds

**Tags:** @e2e, @public, @catalog, @desktop, @development, @staging, @production

**Note:** Create test file in `tests/e2e/public/catalog-page/` folder. This test verifies basic page load and product display functionality.

### Workflow to Test:
1. Navigate to `/catalogo`
2. Wait for page to load and products to fetch from Supabase
3. Verify page structure and layout
4. Verify products display correctly
5. Verify product count
6. Verify empty state (if no products)
7. No cleanup needed (read-only test)

---

## UI Test

**File:** `tests/e2e/public/catalog-page/catalog-page-loads-and-displays-all-products.spec.ts` (new test)

**Test Structure:** Single comprehensive test with multiple sections

### Required Data-TestIds

Request the following `data-testid` attributes to be added (dev will define exact naming):

1. **Catalog Page Container** - Main page container (`data-testid="catalog-page"` - already exists)
2. **Catalog Heading** - Page heading (`data-testid="catalog-heading"` - already exists)
3. **Product Grid Container** - Container for product cards
4. **Product Card** - Individual product card (can use existing ProductCard component)
5. **Product Count Text** - "Mostrando X productos" text
6. **Empty State Container** - Empty state message container
7. **Loading Spinner** - Loading indicator during initial load

**Note:** If there are any flaky locators identified in the flow of the test, please add `data-testid` attributes as needed to ensure stable test automation.

---

### Test Steps

**Setup:**
- Navigate to `/catalogo`
- Wait for `networkidle` state
- Start performance timer

**Step 1: Verify Page Load and Structure**
- Verify page title contains "Catálogo" or "Productos"
- Verify page heading "Catálogo de Productos" is visible
- Verify page description is visible
- Verify catalog page container is visible
- Capture console errors (log all, fail on critical errors only)
- Stop timer, verify page load time < 3 seconds
- Verify no 404 errors for resources (images, CSS, JS)

**Step 2: Verify Sidebar and Filters**
- Verify CategoryFilter sidebar is visible on left
- Verify sidebar has "Categorías" heading
- Verify "Todas las categorías" option is visible
- Verify category list is visible (if categories exist)
- Verify inventory status filter section is visible
- Verify price range filter section is visible

**Step 3: Verify Main Category Filter**
- Verify "Tipo de Artesanía" section is visible
- Verify three buttons are visible: "Todas", "Cuero", "Macramé"
- Verify "Todas" button is selected by default (active styling)
- Verify buttons have correct styling (active: bg-leather-600, inactive: bg-gray-200)

**Step 4: Verify Search and View Controls**
- Verify search input is visible with Search icon
- Verify search placeholder text "Buscar productos por nombre..."
- Verify Grid view button is visible
- Verify List view button is visible
- Verify Grid button is active by default (bg-leather-100)

**Step 5: Verify Supabase API Call**
- Intercept GET request to `/rest/v1/products`
- Verify request includes: `available=eq.true`, `inventory_status=neq.sin_stock`
- Verify response status is `200`
- Verify response contains product data array
- Log product count from API

**Step 6: Verify Products Display (If Products Exist)**
- Wait for products to load (check for loading spinner to disappear)
- Verify product count text displays: "Mostrando X productos"
- Verify product count matches number of product cards displayed
- Verify at least one product card is visible
- Verify product cards are displayed in grid layout (default)
- Verify product cards have:
  - Product image (first image from images array)
  - Product title
  - Product price (formatted as UYU currency)
  - Inventory status badge
  - "Ver Detalles" button
- Verify product images load successfully (no broken images)
- Verify product cards have fade-in animation (check opacity transitions)

**Step 7: Verify Product Card Content**
- Select first product card
- Verify product image is visible and loaded
- Verify product title is visible and readable
- Verify product price is formatted correctly (e.g., "$45.000")
- Verify inventory status badge is visible with correct color
- Verify "Ver Detalles" button is visible and clickable
- If product has `short_description`, verify it's displayed
- If product has `featured=true`, verify "Destacado" badge is visible

**Step 8: Verify Empty State (If No Products)**
- If no products exist in database:
  - Verify empty state container is visible
  - Verify empty state icon (Search icon) is visible
  - Verify "No se encontraron productos" heading is visible
  - Verify appropriate empty state message is displayed
  - Verify product grid is not visible

**Step 9: Verify Loading States**
- Verify loading spinner appears during initial load
- Verify loading spinner disappears after products load
- Verify `isFiltering` state shows smooth transitions (opacity changes)

**Step 10: Verify Page Health**
- Verify no critical JavaScript errors
- Verify page content is rendered (body not empty)
- Verify all images load correctly (no broken images)
- Verify page is fully interactive (can click, scroll, interact)
- Verify URL is `/catalogo` (or `/gmp-web-app/catalogo`)

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**Page Load:**
- Page loads successfully with all sections visible
- Page load time is acceptable (< 3 seconds)
- No critical JavaScript errors

**Layout:**
- Sidebar with filters on left
- Main content area on right
- Header with heading and description
- Search and view controls visible

**Products Display:**
- Products load from Supabase correctly
- Product cards display in grid layout by default
- Product count matches displayed products
- Product images load successfully
- Product information is correct (title, price, status)

**Empty State:**
- Empty state displays correctly when no products exist
- Appropriate message is shown

**Loading States:**
- Loading spinner appears during initial load
- Smooth transitions when filtering

---

## Acceptance Criteria

- [ ] Page loads successfully with all sections visible
- [ ] CatalogPage heading and description are visible
- [ ] Sidebar with CategoryFilter is visible
- [ ] Main category filter buttons are visible (Todas, Cuero, Macramé)
- [ ] Search input and view mode buttons are visible
- [ ] Products load from Supabase correctly (verify API call)
- [ ] Product count displays correctly
- [ ] Product cards display in grid layout
- [ ] Product cards show correct information (image, title, price, status)
- [ ] Product images load successfully
- [ ] Empty state displays correctly when no products exist
- [ ] Loading states work correctly
- [ ] Page load time is acceptable (< 3 seconds)
- [ ] No critical errors
- [ ] Page is fully interactive

---

**Note:**
- This is a read-only test - no data creation or modification
- Tests run against production/staging data in Supabase
- Product count may vary based on available products in database
- Empty state testing may require test data setup or manual verification


