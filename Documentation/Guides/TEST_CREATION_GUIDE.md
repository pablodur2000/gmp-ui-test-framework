# Test Creation Guide - GMP UI Test Framework

**Last Updated:** January 25, 2026  
**Purpose:** Complete guide for creating new test files following current best practices  
**Status:** ✅ Single source of truth for test creation

---

## 📋 Quick Start Checklist

Before creating a new test, ensure you have:
- [ ] QA ticket created in Jira (Epic → Story)
- [ ] QA ticket markdown file in `possible_tickets/` folder
- [ ] Understanding of what to test (read the ticket)
- [ ] Required `data-testid` attributes identified (or fallback selectors)
- [ ] Test file location determined (`tests/smoke/` or `tests/e2e/public/` or `tests/e2e/admin/`)

---

## 📁 Step 1: File Structure & Naming

### File Location Rules

```
tests/
├── smoke/                          # Critical path tests (fast, essential)
│   └── critical-*.spec.ts
│
├── e2e/
│   ├── public/                     # Public pages (no auth)
│   │   ├── home-page/
│   │   ├── catalog-page/           # ← Create catalog tests here
│   │   ├── product-detail-page/
│   │   └── navigation/
│   │
│   └── admin/                      # Admin pages (auth required)
│       ├── authentication/
│       ├── dashboard/
│       └── product-management/
```

### File Naming Convention

**Format:** `[area]-[feature]-[action]-[expected-result].spec.ts`

**Examples:**
- ✅ `catalog-page-loads-and-displays-all-products.spec.ts`
- ✅ `catalog-page-main-category-filter-works-correctly.spec.ts`
- ✅ `catalog-page-search-functionality-works-correctly.spec.ts`
- ❌ `catalog-test.spec.ts` (not descriptive)
- ❌ `test-catalog.spec.ts` (wrong format)

---

## 📝 Step 2: Test File Template

### Complete Template

```typescript
import { test, expect } from '@playwright/test';
import { navigateToCatalog } from '../../utils/navigation';
import { TestSelectors } from '../../utils/selectors';
import { 
  trackPageLoad, 
  monitorAndCheckConsoleErrors,
  waitForFirstVisitAnimation,
  setupSupabaseListener,
  verifyImagesLoad,
  waitForElementInViewport,
  waitForScrollToComplete
} from '../../utils';

/**
 * E2E Test - CatalogPage Loads and Displays All Products (QA-21)
 * 
 * Comprehensive test that verifies CatalogPage loads correctly with all products,
 * filters, search, and navigation functionality.
 * 
 * Based on: QA_TICKET_QA_21_CATALOG_LOADS_ALL_PRODUCTS.md
 * Parent Epic: QA-13
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: 30-45 seconds
 * - Verifies product loading, filtering, search, and navigation
 * 
 * Tags: @e2e, @public, @catalog, @desktop, @development, @staging, @production
 */
test.describe('CatalogPage - Loads and Displays All Products', () => {
  test('should load all products correctly with filters and search', {
    tag: ['@e2e', '@public', '@catalog', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate to catalog page and track performance
    // ============================================================================
    const pageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToCatalog(page),
      5, // max 5 seconds
      3  // warn if > 3 seconds
    );

    // Wait for first-visit animation (if present)
    await waitForFirstVisitAnimation(page, 3000).catch(() => {
      // Animation might not be present, continue anyway
    });

    // Monitor console errors
    await monitorAndCheckConsoleErrors(page, 1000);

    // ============================================================================
    // SECTION 1: Page Load and Basic Verification
    // ============================================================================
    await expect(page).toHaveURL(/\/catalogo/);
    await expect(page).toHaveTitle(/catálogo|catalog/i);

    // ============================================================================
    // SECTION 2: Product Display Verification
    // ============================================================================
    // Your test code here

    // ============================================================================
    // SECTION 3: Filter Functionality
    // ============================================================================
    // Your test code here

    // ============================================================================
    // SECTION 4: Search Functionality
    // ============================================================================
    // Your test code here
  });
});
```

### Key Template Rules

1. **JSDoc Header** - Always include:
   - Test type and name
   - QA ticket reference
   - Parent Epic
   - Test strategy
   - Tags list

2. **Section Comments** - Use clear separators:
   ```typescript
   // ============================================================================
   // SECTION 1: [Descriptive Name]
   // ============================================================================
   ```

3. **No Step Executor** - Use direct Playwright code with section comments

4. **Import Utilities** - Import from `../../utils` (or appropriate relative path)

---

## 🎯 Step 3: Selector Patterns

### Pattern 1: Primary with Fallback (Most Common)

```typescript
// ✅ GOOD - Primary selector with fallback
const productCard = page.locator(TestSelectors.catalogProductCard).or(
  page.locator('.product-card').first()
);
await expect(productCard).toBeVisible();
```

### Pattern 2: Scoped Selectors (Critical - Prevents Strict Mode Violations)

```typescript
// ❌ BAD - May match multiple elements
const filterButton = page.locator(TestSelectors.catalogFilterButton);

// ✅ GOOD - Scoped to parent
const catalogPage = page.locator(TestSelectors.catalogPage).or(
  page.locator('[data-testid*="catalog"]').first()
);
const filterButton = catalogPage.locator(TestSelectors.catalogFilterButton);
```

### Pattern 3: Conditional Elements (For Optional Features)

```typescript
const emptyState = page.locator(TestSelectors.catalogEmptyState);
if (await emptyState.count() > 0) {
  await expect(emptyState).toBeVisible();
  console.log('ℹ️ Catalog is empty');
} else {
  // Products exist, continue testing
}
```

### Pattern 4: Dynamic Selectors (For Repeated Elements)

```typescript
// Product cards with index
const productCards = page.locator('[data-testid^="catalog-product-card"]');
const cardCount = await productCards.count();

if (cardCount > 0) {
  // Test first few cards
  for (let i = 0; i < Math.min(cardCount, 5); i++) {
    const card = productCards.nth(i);
    await expect(card).toBeVisible();
  }
}
```

---

## ⏱️ Step 4: Waiting Patterns

### ✅ Use Utility Functions (Preferred)

```typescript
// Page load tracking
const loadTime = await trackPageLoad(page, async () => {
  await navigateToCatalog(page);
}, 5, 3);

// Wait for animations
await waitForFirstVisitAnimation(page, 3000);

// Wait for scroll
await waitForScrollToComplete(page, 1000, 10, 2000);

// Wait for element in viewport
await waitForElementInViewport(page, TestSelectors.catalogProductCard);

// Wait for hover effect
await waitForHoverEffect(page, TestSelectors.catalogFilterButton, 'backgroundColor', 300);
```

### ✅ Standard Playwright Waits

```typescript
// Network idle (after navigation)
await navigateToCatalog(page);
await page.waitForLoadState('networkidle');

// URL change
await Promise.all([
  page.waitForURL(/\/catalogo/, { timeout: 5000 }),
  button.click()
]);

// Element visibility
await expect(element).toBeVisible({ timeout: 5000 });
```

### ✅ waitForFunction (For Custom Conditions)

```typescript
// Wait for products to load
await page.waitForFunction(
  () => {
    const doc = (globalThis as any).document;
    if (!doc) return false;
    const cards = doc.querySelectorAll('[data-testid^="catalog-product-card"]');
    const emptyState = doc.querySelector('[data-testid="catalog-empty-state"]');
    return cards.length > 0 || emptyState !== null;
  },
  { timeout: 10000 }
);
```

### ❌ Avoid waitForTimeout (Last Resort Only)

```typescript
// ❌ BAD - Arbitrary delay
await page.waitForTimeout(2000);

// ✅ GOOD - Use condition-based wait
await waitForElementInViewport(page, selector);
```

---

## 🔍 Step 5: API Verification

### Using setupSupabaseListener (Recommended)

```typescript
// Set up listener BEFORE triggering action
const apiResponse = await setupSupabaseListener(
  page,
  {
    endpoint: 'products',
    queryParams: { featured: 'eq.true' }
  },
  5000 // timeout
);

// Trigger action that causes API call
await section.scrollIntoViewIfNeeded();
await page.waitForLoadState('networkidle');

// Verify response
if (apiResponse.received) {
  expect(apiResponse.status).toBe(200);
  if (apiResponse.data && Array.isArray(apiResponse.data)) {
    console.log(`✅ Supabase API verified: ${apiResponse.data.length} products`);
  }
}
```

### Manual Response Listener (For Complex Cases)

```typescript
let responseReceived = false;
let responseStatus = 0;
let productData: any = null;

// Set up listener BEFORE action
page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('/rest/v1/products') && url.includes('categoria=')) {
    responseReceived = true;
    responseStatus = response.status();
    try {
      productData = await response.json();
    } catch (e) {
      // Response might not be JSON
    }
  }
});

// Trigger action
await filterButton.click();
await page.waitForLoadState('networkidle');

// Verify
if (responseReceived) {
  expect(responseStatus).toBe(200);
  console.log(`✅ Filter API verified: ${productData?.length || 0} products`);
}
```

---

## 🎨 Step 6: Interaction Patterns

### Click with Navigation

```typescript
await Promise.all([
  page.waitForURL(/\/producto\//, { timeout: 5000 }),
  productCard.click()
]);
await expect(page).toHaveURL(/\/producto\//);
await page.waitForLoadState('networkidle');
```

### Form Input

```typescript
const searchInput = page.locator(TestSelectors.catalogSearchInput).or(
  page.getByPlaceholder(/buscar/i)
);
await searchInput.fill('test search');
await searchInput.press('Enter');
await page.waitForLoadState('networkidle');
```

### Hover Effect

```typescript
const colorBefore = await element.evaluate((el) => {
  const styles = (globalThis as any).getComputedStyle(el);
  return styles.color;
});

await element.hover();
await waitForHoverEffect(page, TestSelectors.catalogFilterButton, 'color', 300);

const colorAfter = await element.evaluate((el) => {
  const styles = (globalThis as any).getComputedStyle(el);
  return styles.color;
});

if (colorAfter !== colorBefore) {
  console.log('✅ Hover effect detected');
}
```

### Dropdown/Select

```typescript
const categorySelect = page.locator(TestSelectors.catalogCategoryFilter);
await categorySelect.click();
await page.waitForTimeout(200); // Small delay for dropdown to appear

const option = page.getByRole('option', { name: /cuero/i });
await option.click();
await page.waitForLoadState('networkidle');
```

---

## ⚡ Step 7: Performance Tracking

### Page Load Time

```typescript
const pageLoadTime = await trackPageLoad(
  page,
  async () => await navigateToCatalog(page),
  5, // max 5 seconds (fails if exceeded)
  3  // warn if > 3 seconds
);

console.log(`📊 CatalogPage load time: ${pageLoadTime.toFixed(2)}s`);
```

### Redirect Time

```typescript
const redirectTime = await trackRedirect(
  page,
  async () => {
    await navigateToAdminDashboard(page);
    await page.waitForURL(/\/admin\/login/, { timeout: 5000 });
  },
  2.5 // max 2.5 seconds
);

expect(redirectTime).toBeLessThan(2.5);
console.log(`✅ Redirect happened in ${redirectTime.toFixed(2)}s`);
```

---

## 🛡️ Step 8: Error Handling

### Console Error Monitoring

```typescript
// Use utility function
await monitorAndCheckConsoleErrors(page, 1000);
```

### Optional Elements

```typescript
const element = page.locator(TestSelectors.optionalFeature);
if (await element.count() > 0) {
  await expect(element).toBeVisible();
  // Test the feature
} else {
  console.log('ℹ️ Optional feature not implemented yet');
  // Continue test without failing
}
```

### Try-Catch for Non-Critical Checks

```typescript
try {
  await expect(optionalElement).toBeVisible({ timeout: 500 });
  // Test optional feature
} catch (error) {
  console.log('⚠️ Optional feature not found (may not be implemented)');
  // Continue test
}
```

### Safe Storage Clearing

```typescript
try {
  await page.evaluate(() => {
    const win = (globalThis as any).window;
    if (win?.localStorage) win.localStorage.clear();
    if (win?.sessionStorage) win.sessionStorage.clear();
  });
} catch (error) {
  console.log('⚠️ Could not clear storage (may be cross-origin restriction)');
}
```

---

## 📝 Step 9: Logging Patterns

### Success Messages

```typescript
console.log('✅ CatalogPage loaded successfully');
console.log(`✅ Found ${productCount} products`);
console.log(`✅ Filter applied: ${filterName}`);
```

### Warning Messages

```typescript
console.warn('⚠️ Page load time exceeds recommended threshold');
console.warn('⚠️ Console errors detected:', errors);
```

### Info Messages

```typescript
console.log('ℹ️ No products found in catalog');
console.log('ℹ️ Optional feature not implemented yet');
```

### Performance Metrics

```typescript
console.log(`📊 Page load time: ${loadTime.toFixed(2)}s`);
console.log(`📊 API response time: ${apiTime.toFixed(2)}s`);
```

---

## 🏷️ Step 10: Test Tags

### Required Tags

Every test must include:

```typescript
tag: [
  '@e2e',              // or '@smoke' for smoke tests
  '@public',           // or '@admin' for admin tests
  '@catalog',          // area tag (@homepage, @catalog, @product-detail, etc.)
  '@desktop',          // viewport tag
  '@development',      // environment tags
  '@staging',
  '@production'
]
```

### Tag Categories

- **Test Type:** `@smoke`, `@e2e`, `@regression`
- **Access Level:** `@public`, `@admin`
- **Area:** `@homepage`, `@catalog`, `@product-detail`, `@navigation`, `@authentication`
- **Viewport:** `@desktop`, `@mobile` (future)
- **Environment:** `@development`, `@staging`, `@production`

---

## ✅ Step 11: Complete Example

### Example: CatalogPage Loads All Products

```typescript
import { test, expect } from '@playwright/test';
import { navigateToCatalog } from '../../utils/navigation';
import { TestSelectors } from '../../utils/selectors';
import { 
  trackPageLoad, 
  monitorAndCheckConsoleErrors,
  waitForFirstVisitAnimation,
  setupSupabaseListener,
  waitForElementInViewport
} from '../../utils';

/**
 * E2E Test - CatalogPage Loads and Displays All Products (QA-21)
 * 
 * Based on: QA_TICKET_QA_21_CATALOG_LOADS_ALL_PRODUCTS.md
 * Parent Epic: QA-13
 * 
 * Tags: @e2e, @public, @catalog, @desktop, @development, @staging, @production
 */
test.describe('CatalogPage - Loads and Displays All Products', () => {
  test('should load all products correctly with API verification', {
    tag: ['@e2e', '@public', '@catalog', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: Navigate and track performance
    // ============================================================================
    const pageLoadTime = await trackPageLoad(
      page,
      async () => await navigateToCatalog(page),
      5, 3
    );

    await waitForFirstVisitAnimation(page, 3000).catch(() => {});
    await monitorAndCheckConsoleErrors(page, 1000);

    // ============================================================================
    // SECTION 1: Page Load Verification
    // ============================================================================
    await expect(page).toHaveURL(/\/catalogo/);
    await expect(page).toHaveTitle(/catálogo|catalog/i);

    // ============================================================================
    // SECTION 2: Product Display
    // ============================================================================
    // Set up API listener BEFORE scrolling
    const apiResponse = await setupSupabaseListener(
      page,
      { endpoint: 'products' },
      5000
    );

    // Wait for products to load
    await page.waitForFunction(
      () => {
        const doc = (globalThis as any).document;
        if (!doc) return false;
        const cards = doc.querySelectorAll('[data-testid^="catalog-product-card"]');
        const emptyState = doc.querySelector('[data-testid="catalog-empty-state"]');
        return cards.length > 0 || emptyState !== null;
      },
      { timeout: 10000 }
    );

    const productCards = page.locator('[data-testid^="catalog-product-card"]');
    const cardCount = await productCards.count();

    if (cardCount > 0) {
      await expect(productCards.first()).toBeVisible();
      console.log(`✅ Found ${cardCount} products`);
    } else {
      const emptyState = page.locator(TestSelectors.catalogEmptyState);
      if (await emptyState.count() > 0) {
        await expect(emptyState).toBeVisible();
        console.log('ℹ️ Catalog is empty');
      }
    }

    // Verify API response
    if (apiResponse.received) {
      expect(apiResponse.status).toBe(200);
      console.log(`✅ Supabase API verified: ${apiResponse.data?.length || 0} products`);
    }

    // ============================================================================
    // SECTION 3: Filter Functionality
    // ============================================================================
    const catalogPage = page.locator(TestSelectors.catalogPage).or(
      page.locator('[data-testid*="catalog"]').first()
    );
    const categoryFilter = catalogPage.locator(TestSelectors.catalogCategoryFilter);

    if (await categoryFilter.count() > 0) {
      await categoryFilter.click();
      await page.waitForTimeout(200);
      
      const cueroOption = page.getByRole('option', { name: /cuero/i });
      await cueroOption.click();
      await page.waitForLoadState('networkidle');
      
      console.log('✅ Category filter applied');
    }
  });
});
```

---

## 🚫 Common Mistakes to Avoid

### ❌ Don't Do This

```typescript
// ❌ Hardcoded URLs
await page.goto('http://localhost:5173/gmp-web-app/catalogo');

// ❌ No fallback selectors
const element = page.locator(TestSelectors.xxx);

// ❌ Unscoped selectors (strict mode violations)
const button = page.locator('button');

// ❌ Excessive timeouts
await page.waitForTimeout(5000);

// ❌ No error handling
await expect(optionalElement).toBeVisible();

// ❌ API listener after action
await button.click();
page.on('response', ...); // Too late!
```

### ✅ Do This Instead

```typescript
// ✅ Navigation helpers
await navigateToCatalog(page);

// ✅ Fallback selectors
const element = page.locator(TestSelectors.xxx).or(page.locator('fallback'));

// ✅ Scoped selectors
const parent = page.locator(TestSelectors.parent);
const button = parent.locator(TestSelectors.button);

// ✅ Condition-based waits
await waitForElementInViewport(page, selector);

// ✅ Graceful error handling
if (await element.count() > 0) {
  await expect(element).toBeVisible();
}

// ✅ API listener before action
page.on('response', ...);
await button.click();
```

---

## 📚 Additional Resources

### Documentation Files

- **`Documentation/Tests/TEST_IMPLEMENTATION_PATTERNS.md`** - Complete patterns guide
- **`Documentation/Tests/COMMON_PITFALLS_AND_SOLUTIONS.md`** - Common issues and fixes
- **`Documentation/Tests/COMPLEX_TEST_SCENARIOS.md`** - Advanced scenarios
- **`Documentation/Tests/QUICK_REFERENCE_GUIDE.md`** - Quick lookup

### Utility Functions Reference

All utilities are exported from `tests/utils/index.ts`:

- **Navigation:** `navigateToHome`, `navigateToCatalog`, `navigateToProduct`, etc.
- **Selectors:** `TestSelectors` object with all data-testid selectors
- **Performance:** `trackPageLoad`, `trackRedirect`
- **API:** `setupSupabaseListener`, `waitForApiResponse`
- **Waits:** `waitForScrollToComplete`, `waitForAnimationComplete`, `waitForFirstVisitAnimation`, `waitForElementInViewport`, `waitForHoverEffect`
- **Monitoring:** `monitorAndCheckConsoleErrors`
- **Images:** `verifyImagesLoad`, `verifyImageLoads`

---

## ✅ Final Checklist

Before submitting your test:

- [ ] File follows naming convention
- [ ] File is in correct location (`smoke/` or `e2e/public/` or `e2e/admin/`)
- [ ] JSDoc header includes all required information
- [ ] All imports are correct
- [ ] Section comments are clear and descriptive
- [ ] Selectors use `TestSelectors` with fallbacks
- [ ] Selectors are scoped to prevent strict mode violations
- [ ] Waits use utility functions when possible
- [ ] API listeners are set up BEFORE actions
- [ ] Optional elements are handled gracefully
- [ ] All required tags are included
- [ ] Console errors are monitored
- [ ] Performance is tracked when relevant
- [ ] Success/warning/info messages are logged
- [ ] Test runs successfully locally
- [ ] Test follows the QA ticket requirements

---

**End of Guide**

For questions or clarifications, refer to existing test files or the documentation in `Documentation/Tests/`.
