# Complex Test Scenarios - Patterns for Advanced Tests

**Last Updated:** January 2026  
**Purpose:** Patterns for complex test scenarios like catalog filtering, search, carousels, and multi-step flows

---

## 🎯 Catalog Page Testing Patterns

### Scenario 1: Filter Testing with Multiple Combinations

**Pattern for testing filters that combine:**

```typescript
// ============================================================================
// SECTION 1: Initial State
// ============================================================================
await navigateToCatalog(page);
await page.waitForLoadState('networkidle');

// Get initial product count
const initialProductCount = await page.locator('[data-testid^="catalog-product-card"]').count();
console.log(`📊 Initial products: ${initialProductCount}`);

// ============================================================================
// SECTION 2: Main Category Filter
// ============================================================================
const mainCategoryButton = page.locator(TestSelectors.catalogMainCategoryFilter).or(
  page.getByRole('button', { name: /cuero|macramé/i }).first()
);

await mainCategoryButton.click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000); // Wait for filter to apply

const filteredCount = await page.locator('[data-testid^="catalog-product-card"]').count();
expect(filteredCount).toBeLessThanOrEqual(initialProductCount);
console.log(`📊 Filtered products: ${filteredCount}`);

// ============================================================================
// SECTION 3: Subcategory Filter (Combined with Main Category)
// ============================================================================
const subcategoryButton = page.locator(TestSelectors.catalogSubcategoryFilter).or(
  page.getByRole('button', { name: /billeteras|cinturones/i }).first()
);

await subcategoryButton.click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);

const combinedFilterCount = await page.locator('[data-testid^="catalog-product-card"]').count();
expect(combinedFilterCount).toBeLessThanOrEqual(filteredCount);
console.log(`📊 Combined filter products: ${combinedFilterCount}`);

// ============================================================================
// SECTION 4: Verify Product Count Display Updates
// ============================================================================
const productCountText = page.locator(TestSelectors.catalogProductCount).or(
  page.getByText(/mostrando|productos/i)
);

if (await productCountText.count() > 0) {
  const countText = await productCountText.textContent();
  expect(countText).toContain(combinedFilterCount.toString());
  console.log(`✅ Product count display updated: ${countText}`);
}
```

### Scenario 2: Search with Debounce Testing

**Pattern for testing search with 500ms debounce:**

```typescript
// ============================================================================
// SECTION 1: Search Input Setup
// ============================================================================
await navigateToCatalog(page);
await page.waitForLoadState('networkidle');

const searchInput = page.locator(TestSelectors.catalogSearchInput).or(
  page.getByPlaceholder(/buscar/i)
);
await expect(searchInput).toBeVisible();

// ============================================================================
// SECTION 2: Track API Calls
// ============================================================================
let apiCallCount = 0;
let lastApiCallTime = 0;

page.on('response', (response) => {
  const url = response.url();
  if (url.includes('/rest/v1/products') && url.includes('search')) {
    apiCallCount++;
    lastApiCallTime = Date.now();
  }
});

// ============================================================================
// SECTION 3: Test Debounce (Type Multiple Characters Quickly)
// ============================================================================
const searchStartTime = Date.now();
await searchInput.fill('billetera');
// Should only trigger ONE API call after 500ms debounce

await page.waitForTimeout(700); // Wait for debounce + buffer

const debounceTime = lastApiCallTime - searchStartTime;
expect(debounceTime).toBeGreaterThanOrEqual(500);
expect(apiCallCount).toBeLessThanOrEqual(2); // Initial load + search
console.log(`✅ Debounce verified: ${debounceTime}ms delay`);

// ============================================================================
// SECTION 4: Verify Search Results
// ============================================================================
await page.waitForLoadState('networkidle');
const searchResults = page.locator('[data-testid^="catalog-product-card"]');
const resultCount = await searchResults.count();

if (resultCount > 0) {
  // Verify first result contains search term
  const firstResult = searchResults.first();
  const productName = await firstResult.locator('[data-testid*="product-name"]').textContent();
  expect(productName?.toLowerCase()).toContain('billetera');
  console.log(`✅ Search results verified: ${resultCount} products`);
}
```

### Scenario 3: View Mode Toggle Testing

**Pattern for testing grid/list view toggle:**

```typescript
// ============================================================================
// SECTION 1: Initial State (Grid View)
// ============================================================================
await navigateToCatalog(page);
await page.waitForLoadState('networkidle');

const gridViewButton = page.locator(TestSelectors.catalogGridViewButton).or(
  page.getByRole('button', { name: /grid|cuadrícula/i })
);
const listViewButton = page.locator(TestSelectors.catalogListViewButton).or(
  page.getByRole('button', { name: /list|lista/i })
);

// Verify grid view is active
const gridButtonActive = await gridViewButton.evaluate((el) => {
  return el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true';
});
expect(gridButtonActive).toBe(true);

// Verify grid layout (3 columns on large screens)
const productGrid = page.locator(TestSelectors.catalogProductGrid).or(
  page.locator('[data-testid^="catalog-product-card"]').first().locator('..')
);
const gridStyles = await productGrid.evaluate((el) => {
  const styles = (globalThis as any).getComputedStyle(el);
  return {
    display: styles.display,
    gridTemplateColumns: styles.gridTemplateColumns
  };
});
expect(gridStyles.display).toBe('grid');
console.log('✅ Grid view verified');

// ============================================================================
// SECTION 2: Switch to List View
// ============================================================================
await listViewButton.click();
await page.waitForTimeout(500); // Wait for transition

// Verify list view is active
const listButtonActive = await listViewButton.evaluate((el) => {
  return el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true';
});
expect(listButtonActive).toBe(true);

// Verify list layout (single column)
const listStyles = await productGrid.evaluate((el) => {
  const styles = (globalThis as any).getComputedStyle(el);
  return {
    display: styles.display,
    flexDirection: styles.flexDirection
  };
});
expect(listStyles.display === 'flex' || listStyles.display === 'block').toBe(true);
console.log('✅ List view verified');

// ============================================================================
// SECTION 3: Switch Back to Grid View
// ============================================================================
await gridViewButton.click();
await page.waitForTimeout(500);

const gridButtonActiveAgain = await gridViewButton.evaluate((el) => {
  return el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true';
});
expect(gridButtonActiveAgain).toBe(true);
console.log('✅ View mode toggle works correctly');
```

---

## 🎠 Carousel/Slideshow Testing Patterns

### Scenario 4: Auto-Advancing Carousel with Multiple Slides

**Pattern for testing carousel that auto-advances every 5 seconds:**

```typescript
// ============================================================================
// SECTION 1: Verify All Slides Exist
// ============================================================================
const heroSection = page.locator(TestSelectors.homeHeroSection);
const heroSlides = heroSection.locator('.hero-slide');
const slideCount = await heroSlides.count();
expect(slideCount).toBeGreaterThanOrEqual(4);

// ============================================================================
// SECTION 2: Verify Each Slide Appears (Auto-Advance)
// ============================================================================
const slideTitles = [
  'Artesanías en Cuero',
  'Macramé Artesanal',
  'Desde Paysandú',
  'Monederos Artesanal'
];

const title = page.locator(TestSelectors.homeHeroTitle);

for (let slideIndex = 0; slideIndex < slideTitles.length; slideIndex++) {
  // First slide may take longer (initial load), others should be ~5 seconds
  const timeout = slideIndex === 0 ? 80000 : 25000;
  
  await expect(title).toContainText(
    new RegExp(slideTitles[slideIndex], 'i'),
    { timeout }
  );

  const currentTitle = await title.textContent();
  expect(currentTitle).toContain(slideTitles[slideIndex]);
  console.log(`✅ Slide ${slideIndex + 1} verified: ${slideTitles[slideIndex]}`);
  
  // Wait a bit to ensure slide is fully visible before next transition
  if (slideIndex < slideTitles.length - 1) {
    await page.waitForTimeout(1000);
  }
}

// ============================================================================
// SECTION 3: Verify Slide Transitions Are Smooth
// ============================================================================
// Check that slides have transition CSS
const firstSlide = heroSlides.first();
const transition = await firstSlide.evaluate((el) => {
  const styles = (globalThis as any).getComputedStyle(el);
  return styles.transition;
});
expect(transition).not.toBe('none');
console.log('✅ Slide transitions are smooth');
```

---

## 🔐 Authentication Flow Testing Patterns

### Scenario 5: Complete Login Flow with Validation

**Pattern for testing admin login with multiple validation steps:**

```typescript
// ============================================================================
// SECTION 1: Navigate to Login Page
// ============================================================================
await navigateToAdminLogin(page);
await page.waitForLoadState('networkidle');
await expect(page).toHaveURL(/\/admin\/login/);

// ============================================================================
// SECTION 2: Verify Form Elements
// ============================================================================
const emailInput = page.locator(TestSelectors.adminLoginEmailInput);
const passwordInput = page.locator(TestSelectors.adminLoginPasswordInput);
const submitButton = page.locator(TestSelectors.adminLoginSubmitButton);

await expect(emailInput).toBeVisible();
await expect(passwordInput).toBeVisible();
await expect(submitButton).toBeVisible();

// ============================================================================
// SECTION 3: Test Form Validation
// ============================================================================
// Test invalid email
await emailInput.fill('invalid-email');
await submitButton.click();
await page.waitForTimeout(500);

// Should show validation error or stay on page
const currentUrl = page.url();
expect(currentUrl).toMatch(/\/admin\/login/);

// Test empty password
await emailInput.clear();
await emailInput.fill('admin@example.com');
await passwordInput.clear();
await submitButton.click();
await page.waitForTimeout(500);

expect(page.url()).toMatch(/\/admin\/login/);

// ============================================================================
// SECTION 4: Test Valid Login
// ============================================================================
const validEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const validPassword = process.env.ADMIN_PASSWORD || 'your-admin-password';

await emailInput.fill(validEmail);
await passwordInput.fill(validPassword);

// Track navigation
await Promise.all([
  page.waitForURL(/\/admin\/dashboard/, { timeout: 10000 }),
  submitButton.click()
]);

await expect(page).toHaveURL(/\/admin\/dashboard/);
console.log('✅ Login successful');
```

---

## 📦 Multi-Step Product Flow Testing

### Scenario 6: Complete Product Browsing Flow

**Pattern for testing complete user journey:**

```typescript
// ============================================================================
// SECTION 1: Start at Home Page
// ============================================================================
await navigateToHome(page);
await page.waitForLoadState('networkidle');

// ============================================================================
// SECTION 2: Navigate to Catalog via Hero CTA
// ============================================================================
const heroCtaButton = page.locator(TestSelectors.homeHeroCtaButton);
await expect(heroCtaButton).toBeVisible();
await heroCtaButton.click();
await page.waitForURL(/\/catalogo/, { timeout: 5000 });
await page.waitForLoadState('networkidle');
console.log('✅ Navigated to catalog from hero CTA');

// ============================================================================
// SECTION 3: Apply Filter in Catalog
// ============================================================================
const categoryFilter = page.locator(TestSelectors.catalogMainCategoryFilter).or(
  page.getByRole('button', { name: /cuero/i }).first()
);
await categoryFilter.click();
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);

const filteredProducts = page.locator('[data-testid^="catalog-product-card"]');
const productCount = await filteredProducts.count();
expect(productCount).toBeGreaterThan(0);
console.log(`✅ Filtered to ${productCount} products`);

// ============================================================================
// SECTION 4: Click Product to View Details
// ============================================================================
const firstProduct = filteredProducts.first();
await expect(firstProduct).toBeVisible();

// Get product ID from link
const productLink = firstProduct.locator('a').first();
const href = await productLink.getAttribute('href');
const productIdMatch = href?.match(/\/producto\/([^\/]+)/);
expect(productIdMatch).not.toBeNull();

const productId = productIdMatch![1];

// Navigate to product detail
await firstProduct.click();
await page.waitForURL(new RegExp(`/producto/${productId}`), { timeout: 5000 });
await page.waitForLoadState('networkidle');
console.log(`✅ Navigated to product detail: ${productId}`);

// ============================================================================
// SECTION 5: Verify Product Detail Page
// ============================================================================
const productTitle = page.locator(TestSelectors.productDetailTitle);
await expect(productTitle).toBeVisible();

const productImage = page.locator(TestSelectors.productDetailImage(0));
await expect(productImage).toBeVisible();

// ============================================================================
// SECTION 6: Navigate Back to Catalog
// ============================================================================
const backButton = page.getByRole('button', { name: /volver al catálogo/i }).or(
  page.getByRole('link', { name: /volver|catálogo/i })
);

if (await backButton.count() > 0) {
  await backButton.click();
  await page.waitForURL(/\/catalogo/, { timeout: 5000 });
  await page.waitForLoadState('networkidle');
  console.log('✅ Navigated back to catalog');
}

// ============================================================================
// SECTION 7: Verify Filter State Persisted
// ============================================================================
// Filter should still be active
const activeFilter = await categoryFilter.evaluate((el) => {
  return el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true';
});
expect(activeFilter).toBe(true);
console.log('✅ Filter state persisted after navigation');
```

---

## 🔄 State Management Testing Patterns

### Scenario 7: Testing State Persistence Across Navigation

**Pattern for verifying state (filters, view mode) persists:**

```typescript
// ============================================================================
// SECTION 1: Set Initial State
// ============================================================================
await navigateToCatalog(page);
await page.waitForLoadState('networkidle');

// Apply filter
const filterButton = page.locator(TestSelectors.catalogMainCategoryFilter).first();
await filterButton.click();
await page.waitForLoadState('networkidle');

// Switch to list view
const listViewButton = page.locator(TestSelectors.catalogListViewButton);
await listViewButton.click();
await page.waitForTimeout(500);

// ============================================================================
// SECTION 2: Navigate Away
// ============================================================================
await navigateToHome(page);
await page.waitForLoadState('networkidle');

// ============================================================================
// SECTION 3: Navigate Back and Verify State
// ============================================================================
await navigateToCatalog(page);
await page.waitForLoadState('networkidle');

// Verify filter is still active
const filterActive = await filterButton.evaluate((el) => {
  return el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true';
});
expect(filterActive).toBe(true);

// Verify list view is still active
const listViewActive = await listViewButton.evaluate((el) => {
  return el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true';
});
expect(listViewActive).toBe(true);

console.log('✅ State persisted across navigation');
```

---

## 📊 Data Validation Patterns

### Scenario 8: Verify API Data Matches UI Display

**Pattern for comparing API response with displayed data:**

```typescript
// ============================================================================
// SECTION 1: Capture API Response
// ============================================================================
let apiProductData: any = null;

page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('/rest/v1/products') && url.includes('id=eq.')) {
    try {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        apiProductData = data[0];
      }
    } catch (e) {
      // Response might not be JSON
    }
  }
});

// ============================================================================
// SECTION 2: Navigate and Wait for API
// ============================================================================
await navigateToProduct(page, productId);
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);

// ============================================================================
// SECTION 3: Compare API Data with UI
// ============================================================================
if (apiProductData) {
  // Compare product name
  const uiTitle = await page.locator(TestSelectors.productDetailTitle).textContent();
  expect(uiTitle).toContain(apiProductData.name || apiProductData.title);
  
  // Compare price
  const uiPrice = await page.locator(TestSelectors.productDetailPrice).textContent();
  if (apiProductData.price) {
    expect(uiPrice).toContain(apiProductData.price.toString());
  }
  
  // Compare description
  const uiDescription = await page.locator(TestSelectors.productDetailDescription).textContent();
  if (apiProductData.description) {
    expect(uiDescription).toContain(apiProductData.description);
  }
  
  console.log('✅ API data matches UI display');
}
```

---

## 🎯 Summary: Complex Test Checklist

When writing complex tests:

- [ ] **Set up API listeners BEFORE actions** - Capture all responses
- [ ] **Track state changes** - Verify filters, view modes persist
- [ ] **Test multi-step flows** - Complete user journeys
- [ ] **Verify data consistency** - Compare API with UI
- [ ] **Test edge cases** - Empty states, error states
- [ ] **Wait for all transitions** - Animations, debounces, API calls
- [ ] **Verify state persistence** - Across navigation
- [ ] **Test combinations** - Multiple filters, search + filters
- [ ] **Measure performance** - Track timing for complex operations
- [ ] **Log progress** - Console logs for debugging

---

**End of Document**

