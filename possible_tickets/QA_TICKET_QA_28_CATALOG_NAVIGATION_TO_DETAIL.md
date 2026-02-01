# QA Ticket: CatalogPage Navigation to Product Detail Works Correctly (QA-28)

## Project
QA (QA)

## Issue Type
Story

UI Test - CatalogPage Navigation to Product Detail Works Correctly (QA-28)

**Parent Epic:** QA-13

**Links to GMP Epics:** GMP-26, GMP-27, GMP-34

---

## 📋 Description

Comprehensive test that verifies navigation from CatalogPage to ProductDetailPage works correctly, product cards are clickable, navigation uses correct product IDs, URL updates correctly, and browser history is managed.

**Context:**
- Product cards are clickable and navigate to product detail page
- Navigation uses React Router Link component
- URL format: `/producto/{productId}`
- Both product image and "Ver Detalles" button navigate to detail page
- Works in both grid and list view modes
- Desktop viewport only (1920x1080) - Mobile testing in separate phase

---

## 🎯 Test Strategy

**Focus:** Verify product card navigation, URL updates, browser history, and navigation from different view modes

**Viewport:** Desktop (1920x1080)

**Estimated Execution Time:** 15-20 seconds

**Tags:** @e2e, @public, @catalog, @navigation, @desktop, @development, @staging, @production

**Note:** Create test file in `tests/e2e/public/catalog-page/` folder. This test verifies navigation from catalog to product detail page.

### Workflow to Test:
1. Navigate to `/catalogo`
2. Verify product cards are clickable
3. Test navigation by clicking product image
4. Test navigation by clicking "Ver Detalles" button
5. Verify URL updates correctly
6. Verify product detail page loads
7. Test browser back button
8. Test navigation from list view
9. No cleanup needed (read-only test)

---

## UI Test

**File:** `tests/e2e/public/catalog-page/catalog-page-navigation-to-product-detail-works-correctly.spec.ts` (new test)

**Test Structure:** Single comprehensive test with multiple navigation scenarios

### Required Data-TestIds

Request the following `data-testid` attributes to be added:

1. **Product Card Link** - Link wrapper around product card (or image)
2. **Product Card Image** - Product image (clickable)
3. **Ver Detalles Button** - "Ver Detalles" button/link

**Note:** If there are any flaky locators identified in the flow of the test, please add `data-testid` attributes as needed to ensure stable test automation.

---

### Test Steps

**Setup:**
- Navigate to `/catalogo`
- Wait for `networkidle` state
- Wait for products to load
- Get first product ID from displayed products

**Step 1: Verify Product Cards are Clickable**
- Verify at least one product card is visible
- Verify product card image is visible
- Verify "Ver Detalles" button is visible
- Hover over product card image
- Verify cursor changes to pointer (indicates clickable)
- Hover over "Ver Detalles" button
- Verify cursor changes to pointer

**Step 2: Test Navigation by Clicking Product Image (Grid View)**
- Get first product card
- Get product ID from card (or from Supabase data)
- Click product card image
- Wait for navigation to complete
- Verify URL updates to `/producto/{productId}`
- Verify ProductDetailPage loads
- Verify product detail page shows correct product
- Verify product ID in URL matches clicked product

**Step 3: Test Navigation by Clicking "Ver Detalles" Button (Grid View)**
- Navigate back to `/catalogo`
- Wait for products to load
- Get first product card
- Get product ID
- Click "Ver Detalles" button
- Wait for navigation to complete
- Verify URL updates to `/producto/{productId}`
- Verify ProductDetailPage loads
- Verify product detail page shows correct product

**Step 4: Test Navigation from List View**
- Navigate back to `/catalogo`
- Wait for products to load
- Click List view button
- Wait for layout to update
- Get first product card in list view
- Get product ID
- Click product card image (or "Ver Detalles" button)
- Wait for navigation to complete
- Verify URL updates to `/producto/{productId}`
- Verify ProductDetailPage loads
- Verify product detail page shows correct product

**Step 5: Test Browser Back Button**
- Navigate back to `/catalogo` (using browser back button)
- Wait for page to load
- Verify URL is `/catalogo`
- Verify CatalogPage is displayed
- Verify products are still loaded
- Verify filters are preserved (if any were active)

**Step 6: Test Navigation with Filters Active**
- Navigate to `/catalogo`
- Click "Cuero" main category button
- Wait for products to filter
- Select a category from sidebar
- Wait for products to filter
- Get first filtered product
- Get product ID
- Click product card image
- Wait for navigation to complete
- Verify URL updates to `/producto/{productId}`
- Verify ProductDetailPage loads
- Navigate back to catalog
- Verify filters are still active
- Verify filtered products are still displayed

**Step 7: Test Navigation with Search Active**
- Navigate to `/catalogo`
- Type search term in search input
- Wait for search to complete
- Get first search result
- Get product ID
- Click product card image
- Wait for navigation to complete
- Verify URL updates to `/producto/{productId}`
- Verify ProductDetailPage loads
- Navigate back to catalog
- Verify search is cleared (expected behavior)
- Verify all products are displayed

**Step 8: Test Navigation from Different Product Cards**
- Navigate to `/catalogo`
- Wait for products to load
- Get second product card (not first)
- Get product ID
- Click product card image
- Wait for navigation to complete
- Verify URL updates to correct product ID
- Verify ProductDetailPage shows correct product
- Verify product information matches selected product

**Step 9: Verify Navigation Uses React Router**
- Navigate to `/catalogo`
- Click product card image
- Verify navigation is smooth (no page reload)
- Verify URL updates without full page refresh
- Verify React Router handles navigation
- Verify no browser navigation indicators (spinner)

**Step 10: Verify Product ID Accuracy**
- Navigate to `/catalogo`
- Get first product card
- Extract product ID from card (if visible) or from Supabase data
- Click product card image
- Wait for navigation
- Verify URL contains correct product ID
- Verify ProductDetailPage loads product with matching ID
- Verify product data matches (title, price, etc.)

**Step 11: Test Navigation from Empty State**
- Apply filters that result in no products
- Verify empty state is displayed
- Verify no product cards are clickable (no products to navigate to)
- Clear filters to show products
- Verify navigation works again

**Step 12: Verify Link Components**
- Verify product card image is wrapped in Link component
- Verify "Ver Detalles" button is a Link component
- Verify links have correct `to` prop: `/producto/{productId}`
- Verify links use React Router Link (not anchor tags)

**Step 13: Test Multiple Navigations**
- Navigate to `/catalogo`
- Click first product card
- Wait for product detail page
- Navigate back to catalog
- Click second product card
- Wait for product detail page
- Verify both navigations work correctly
- Verify browser history is maintained

**Step 14: Verify Navigation State**
- Navigate to `/catalogo`
- Apply filters
- Click product card
- Navigate back to catalog
- Verify catalog page state is preserved (filters, scroll position if applicable)

**Step 15: Test Navigation with View Mode**
- Navigate to `/catalogo`
- Switch to List view
- Click product card image
- Wait for navigation
- Verify navigation works from list view
- Navigate back
- Verify list view is still active
- Switch to Grid view
- Click product card image
- Verify navigation works from grid view

**Cleanup:**
- No cleanup needed (read-only test)

---

## Expected Behavior

**Product Card Navigation:**
- Product card image is clickable
- "Ver Detalles" button is clickable
- Both navigate to product detail page
- Navigation uses correct product ID

**URL Updates:**
- URL updates to `/producto/{productId}`
- Product ID in URL matches clicked product
- URL is correct format

**Navigation:**
- Navigation is smooth (React Router, no page reload)
- ProductDetailPage loads correctly
- Product information matches selected product

**Browser History:**
- Back button works correctly
- Browser history is maintained
- Navigation state is preserved

**View Modes:**
- Navigation works from grid view
- Navigation works from list view
- View mode state persists after navigation

---

## Acceptance Criteria

- [ ] Product cards are clickable
- [ ] Product card image navigates to product detail
- [ ] "Ver Detalles" button navigates to product detail
- [ ] URL updates to `/producto/{productId}`
- [ ] Product ID in URL is correct
- [ ] ProductDetailPage loads correctly
- [ ] Product information matches selected product
- [ ] Navigation works from grid view
- [ ] Navigation works from list view
- [ ] Browser back button works correctly
- [ ] Navigation works with filters active
- [ ] Navigation uses React Router (smooth, no reload)
- [ ] Multiple navigations work correctly
- [ ] Navigation state is preserved

---

**Note:**
- This is a read-only test - no data creation or modification
- Tests run against production/staging data in Supabase
- Requires at least one product in database
- Navigation uses React Router Link components
- Product ID must be valid and exist in database


