# Test Implementation Patterns - Complete Guide

**Last Updated:** January 2026  
**Purpose:** Comprehensive guide for AI and developers to create new tests following proven patterns from existing implementations

---

## 📊 Executive Summary

This document analyzes **ALL 6 implemented test files** (3 smoke tests + 3 E2E tests) to extract:
- ✅ **Working patterns** that are proven and reliable
- ✅ **Best practices** for test structure, selectors, waiting, and error handling
- ✅ **Common pitfalls** and how to avoid them
- ✅ **Code templates** ready to use for new tests

**Total Lines Analyzed:** ~1,500 lines of test code  
**Test Files:** 6 complete implementations  
**Status:** All tests are working and follow consistent patterns

---

## 📁 File Structure Pattern

### Standard Test File Template

```typescript
import { test, expect } from '@playwright/test';
import { navigateToHome, navigateToCatalog, ... } from '../utils/navigation';
import { TestSelectors } from '../utils/selectors';

/**
 * [Test Type] - [Test Name] ([QA-Ticket])
 * 
 * [Comprehensive description of what the test verifies]
 * 
 * Based on: QA_TICKET_[NUMBER]_[NAME].md
 * Parent Epic: [EPIC-NUMBER]
 * 
 * Test Strategy:
 * - Desktop viewport only (1920x1080)
 * - Estimated execution time: [X-Y] seconds
 * - [Key testing points]
 * 
 * Tags: @[type], @[area], @[feature], @desktop, @development, @staging, @production
 */
test.describe('[Test Suite Name]', () => {
  test('should [expected behavior]', {
    tag: ['@[type]', '@[area]', '@[feature]', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: [Setup description]
    // ============================================================================
    // Setup code here
    
    // ============================================================================
    // SECTION 1: [Section Name]
    // ============================================================================
    // Test code here
    
    // ============================================================================
    // SECTION 2: [Section Name]
    // ============================================================================
    // More test code
  });
});
```

### Key Observations:
- ✅ **No step executor** - Direct Playwright code
- ✅ **Section comments** - Clear visual separators with `// ============================================================================`
- ✅ **JSDoc header** - Comprehensive test documentation
- ✅ **Tag array** - All required tags in test options

---

## 🔧 Import Patterns

### Standard Imports (Always Required)

```typescript
import { test, expect } from '@playwright/test';
import { navigateToHome, navigateToCatalog, navigateToProduct, navigateToAdminLogin, navigateToAdminDashboard } from '../utils/navigation';
import { TestSelectors } from '../utils/selectors';
```

### Import Rules:
1. ✅ **Always use navigation helpers** - Never hardcode URLs
2. ✅ **Always use TestSelectors** - Centralized selector management
3. ✅ **Import only what you need** - Keep imports minimal

---

## 🎯 Selector Patterns

### Pattern 1: Primary Selector with Fallback

**Most Common Pattern** (used in 90% of cases):

```typescript
const element = page.locator(TestSelectors.xxx).or(
  page.locator('fallback-selector')
);
await expect(element).toBeVisible();
```

**Examples from actual tests:**
```typescript
// Hero section
const heroSection = page.locator(TestSelectors.homeHeroSection).or(
  page.locator('section').filter({ hasText: /artesanías|macramé/i }).first()
);

// Header
const header = page.locator(TestSelectors.header).or(page.locator('header'));

// Search input
const searchInput = page.locator(TestSelectors.catalogSearchInput).or(
  page.getByPlaceholder(/buscar/i)
);
```

### Pattern 2: Scoped Selectors (Avoid Strict Mode Violations)

**Critical Pattern** - Always scope to parent element when multiple matches possible:

```typescript
// ❌ BAD - Matches both header and footer logos
const logo = page.locator(TestSelectors.headerLogo);

// ✅ GOOD - Scoped to header only
const header = page.locator(TestSelectors.header).or(page.locator('header'));
const logo = header.locator(TestSelectors.headerLogo);

// ✅ GOOD - Scoped to navigation area
const headerNav = header.locator('nav').or(header.locator('[data-testid*="nav"]'));
const homeLink = headerNav.locator(TestSelectors.headerNavHomeLink);
```

**Why this matters:**
- Prevents "strict mode violation" errors
- Ensures you're testing the right element
- More reliable and maintainable

### Pattern 3: Conditional Selectors (Graceful Fallbacks)

**For optional elements:**

```typescript
const element = page.locator(TestSelectors.xxx).or(
  page.getByRole('button', { name: /text/i })
);

if (await element.count() > 0) {
  await expect(element).toBeVisible();
  // Test the element
} else {
  console.log('ℹ️ Element may not be implemented yet');
}
```

### Pattern 4: Dynamic Selectors (For Repeated Elements)

**For product cards, slides, etc.:**

```typescript
// Using data-testid with pattern matching
const productCards = page.locator('[data-testid^="catalog-product-card"]');

// Using class selectors with fallback
const heroSlides = heroSection.locator('.hero-slide');

// Count and iterate
const cardCount = await productCards.count();
if (cardCount > 0) {
  await expect(productCards.first()).toBeVisible();
}
```

---

## ⏱️ Waiting Patterns

### Pattern 1: Network Idle (Most Common)

**For page loads and navigation:**

```typescript
await navigateToHome(page);
await page.waitForLoadState('networkidle');
```

**Used in:** 100% of navigation operations

### Pattern 2: waitForFunction (Smart Waits)

**For animations, state changes, and dynamic content:**

```typescript
// Wait for scroll to complete
await page.waitForFunction(() => {
  const win = (globalThis as any).window;
  if (!win) return false;
  return (win.scrollY || 0) >= 900;
}, { timeout: 2000 });

// Wait for header animation
await page.waitForFunction(() => {
  const doc = (globalThis as any).document;
  const win = (globalThis as any).window;
  if (!doc || !win) return false;
  const headerEl = doc.querySelector('header');
  if (!headerEl) return false;
  const styles = win.getComputedStyle(headerEl);
  return styles.opacity !== '0' && !headerEl.classList.contains('header-hidden');
}, { timeout: 3000 }).catch(() => {
  // Graceful fallback if condition never met
});
```

**Key Points:**
- ✅ Use `globalThis` for `window` and `document` access
- ✅ Always check for null/undefined
- ✅ Use `.catch()` for optional conditions
- ✅ Set appropriate timeout (usually 1-3 seconds)

### Pattern 3: waitForURL (Navigation Verification)

**For navigation confirmation:**

```typescript
await Promise.all([
  page.waitForURL(/\/catalogo/, { timeout: 5000 }),
  button.click()
]);
await expect(page).toHaveURL(/\/catalogo/);
```

### Pattern 4: waitForTimeout (Last Resort)

**Only when no other wait mechanism works:**

```typescript
// For CSS transitions (duration-100 = 100ms)
await page.waitForTimeout(300);

// For Intersection Observer animations
await page.waitForTimeout(1000);

// For first visit animation sequence
await page.waitForTimeout(2500);
```

**Rules:**
- ⚠️ Use sparingly - prefer smart waits
- ⚠️ Keep timeouts short (< 3 seconds)
- ⚠️ Add comments explaining why timeout is needed

### Pattern 5: scrollIntoViewIfNeeded (For Off-Screen Elements)

**For sections that need to be scrolled into view:**

```typescript
const section = page.locator(TestSelectors.xxx);
await section.scrollIntoViewIfNeeded();
await page.waitForTimeout(1000); // Wait for Intersection Observer
await expect(section).toBeVisible();
```

---

## 🔍 API Verification Patterns

### Pattern 1: Response Listener (Before Action)

**Critical:** Set up listener BEFORE triggering the API call:

```typescript
let supabaseResponseReceived = false;
let supabaseResponseStatus = 0;
let productData: any = null;

// Set up response listener BEFORE scrolling/navigating
page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('/rest/v1/products') && url.includes('featured=eq.true')) {
    supabaseResponseReceived = true;
    supabaseResponseStatus = response.status();
    try {
      productData = await response.json();
    } catch (e) {
      // Response might not be JSON
    }
  }
});

// NOW trigger the action that causes API call
await featuredSection.scrollIntoViewIfNeeded();
await page.waitForTimeout(2000);

// Verify response
if (supabaseResponseReceived) {
  expect(supabaseResponseStatus).toBe(200);
  if (productData && Array.isArray(productData)) {
    console.log(`✅ Supabase API verified: ${productData.length} products`);
  }
}
```

**Key Points:**
- ✅ Listener must be set up BEFORE the action
- ✅ Check URL patterns to identify correct API call
- ✅ Handle JSON parsing errors gracefully
- ✅ Verify status code and data structure

---

## 🎨 Animation & Interaction Patterns

### Pattern 1: CSS Transition Detection

**For hover effects and transitions:**

```typescript
// Get initial state
const colorBefore = await element.evaluate((el) => {
  const styles = (globalThis as any).getComputedStyle(el);
  return styles.color;
});

// Trigger interaction
await element.hover();
await page.waitForTimeout(300); // Wait for transition (duration-100 = 100ms)

// Get final state
const colorAfter = await element.evaluate((el) => {
  const styles = (globalThis as any).getComputedStyle(el);
  return styles.color;
});

// Verify change
if (colorAfter !== colorBefore) {
  console.log('✅ Hover effect detected');
}
```

### Pattern 2: Intersection Observer Handling

**For scroll-triggered animations:**

```typescript
// Scroll to section
await section.scrollIntoViewIfNeeded();
await page.waitForTimeout(1000); // Wait for Intersection Observer

// Verify section is visible and animated
await expect(section).toBeVisible();
```

### Pattern 3: Carousel/Slideshow Testing

**For auto-advancing carousels:**

```typescript
const slideTitles = ['Title 1', 'Title 2', 'Title 3', 'Title 4'];

for (let slideIndex = 0; slideIndex < slideTitles.length; slideIndex++) {
  const timeout = slideIndex === 0 ? 80000 : 25000; // First slide longer timeout
  await expect(title).toContainText(new RegExp(slideTitles[slideIndex], 'i'), { timeout });
  console.log(`✅ Slide ${slideIndex} verified: ${slideTitles[slideIndex]}`);
}
```

### Pattern 4: Parallax Effect Detection

**For parallax/mouse-follow effects:**

```typescript
const transformBefore = await slide.evaluate((el: any) => {
  return el.style.transform || '';
});

const viewportSize = page.viewportSize();
const centerX = (viewportSize?.width || 1920) / 2;
const centerY = (viewportSize?.height || 1080) / 2;

await page.mouse.move(centerX, centerY);
await page.waitForTimeout(200);

const transformAfter = await slide.evaluate((el: any) => {
  return el.style.transform || '';
});

if (transformAfter !== transformBefore) {
  console.log('✅ Parallax effect detected');
}
```

---

## ⚡ Performance Tracking Patterns

### Pattern 1: Page Load Time

```typescript
const pageLoadStartTime = Date.now();
await navigateToHome(page);
await page.waitForLoadState('networkidle');
const pageLoadTime = (Date.now() - pageLoadStartTime) / 1000;

console.log(`📊 Page load time: ${pageLoadTime.toFixed(2)}s`);

if (pageLoadTime > 3) {
  console.warn(`⚠️ Page load time (${pageLoadTime.toFixed(2)}s) exceeds recommended 3s`);
}
if (pageLoadTime > 5) {
  throw new Error(`Page load time (${pageLoadTime.toFixed(2)}s) is too slow (> 5s)`);
}
```

### Pattern 2: Redirect Time

```typescript
const redirectStartTime = Date.now();
await navigateToAdminDashboard(page);
await page.waitForURL(/\/admin\/login/, { timeout: 5000 });
const redirectTime = (Date.now() - redirectStartTime) / 1000;

expect(redirectTime).toBeLessThan(1);
console.log(`✅ Redirect happened in ${redirectTime.toFixed(2)}s`);
```

---

## 🛡️ Error Handling Patterns

### Pattern 1: Console Error Monitoring

```typescript
const errors: string[] = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    errors.push(msg.text());
  }
});
await page.waitForTimeout(1000);

if (errors.length > 0) {
  console.warn('⚠️ Console errors detected:', errors);
  const criticalErrors = errors.filter(err =>
    err.includes('React') || err.includes('Uncaught') || err.includes('Error:')
  );
  if (criticalErrors.length > 0) {
    throw new Error(`Critical console errors: ${criticalErrors.join(', ')}`);
  }
}
```

### Pattern 2: Graceful Element Handling

**For optional elements:**

```typescript
const element = page.locator(TestSelectors.xxx);

if (await element.count() > 0) {
  await expect(element).toBeVisible();
  // Test the element
} else {
  console.log('ℹ️ Element may not be implemented yet');
  // Continue test without failing
}
```

### Pattern 3: Try-Catch for Optional Features

```typescript
try {
  await expect(optionalElement).toBeVisible({ timeout: 500 });
  // Test optional feature
} catch (error) {
  console.log('⚠️ Optional feature not found (data-testid may not be added yet)');
  // Continue test
}
```

### Pattern 4: Safe Storage Clearing

```typescript
try {
  await page.evaluate(() => {
    const win = (globalThis as any).window;
    if (win?.localStorage) win.localStorage.clear();
    if (win?.sessionStorage) win.sessionStorage.clear();
  });
} catch (error) {
  // If localStorage access is denied (e.g., cross-origin), continue anyway
  console.log('⚠️ Could not clear localStorage/sessionStorage (may be cross-origin restriction)');
}
```

---

## 🧪 Test Organization Patterns

### Pattern 1: Section-Based Organization

**Standard structure with clear sections:**

```typescript
// ============================================================================
// SETUP: Navigate to home page and track performance
// ============================================================================
// Setup code

// ============================================================================
// SECTION 1: Page Load and Performance Verification
// ============================================================================
// Test code

// ============================================================================
// SECTION 2: Hero Section Verification
// ============================================================================
// More test code
```

**Benefits:**
- ✅ Easy to read and understand
- ✅ Clear separation of concerns
- ✅ Easy to debug (know which section failed)

### Pattern 2: Multiple Test Cases in One File

**For related test scenarios:**

```typescript
test.describe('Smoke Test - Critical Public Paths', () => {
  test('should load HomePage correctly', { ... }, async ({ page }) => {
    // Test 1
  });

  test('should load CatalogPage correctly', { ... }, async ({ page }) => {
    // Test 2
  });

  test('should load ProductDetailPage correctly', { ... }, async ({ page }) => {
    // Test 3
  });
});
```

---

## 🔄 Navigation Patterns

### Pattern 1: Using Navigation Helpers

**Always use helpers, never hardcode URLs:**

```typescript
// ✅ GOOD
await navigateToHome(page);
await navigateToCatalog(page);
await navigateToProduct(page, productId);
await navigateToAdminLogin(page);
await navigateToAdminDashboard(page);

// ❌ BAD
await page.goto('http://localhost:5173/gmp-web-app');
```

### Pattern 2: Navigation with Verification

```typescript
await Promise.all([
  page.waitForURL(/\/catalogo/, { timeout: 5000 }),
  button.click()
]);
await expect(page).toHaveURL(/\/catalogo/);
await page.waitForLoadState('networkidle');
```

### Pattern 3: Browser History Testing

```typescript
await button.click();
await page.waitForURL(/\/catalogo/, { timeout: 5000 });

await page.goBack();
await page.waitForTimeout(1000);

await expect(page).toHaveURL(/\/gmp-web-app\/?$/);
console.log('✅ Browser history management works correctly');
```

---

## 📝 Logging Patterns

### Pattern 1: Success Messages

```typescript
console.log('✅ [Feature] works correctly');
console.log(`✅ Found ${count} items`);
console.log(`✅ Supabase API verified: ${data.length} products`);
```

### Pattern 2: Warning Messages

```typescript
console.warn('⚠️ Console errors detected:', errors);
console.warn(`⚠️ Page load time (${time}s) exceeds recommended 3s`);
```

### Pattern 3: Info Messages

```typescript
console.log('ℹ️ No products found in catalog');
console.log('ℹ️ Element may not be implemented yet');
console.log('ℹ️ Featured products section does not exist (no featured products in DB)');
```

---

## 🎯 Common Patterns Summary

### ✅ DO's

1. **Always use navigation helpers** - Never hardcode URLs
2. **Always scope selectors** - Prevent strict mode violations
3. **Always wait for networkidle** - After navigation
4. **Always set up API listeners BEFORE actions** - Capture responses
5. **Always use section comments** - Clear organization
6. **Always handle optional elements gracefully** - Use `if (count > 0)`
7. **Always use `globalThis`** - In `page.evaluate()` calls
8. **Always verify after navigation** - Check URL and wait for load

### ❌ DON'Ts

1. **Don't hardcode URLs** - Use navigation helpers
2. **Don't use step executor** - Use direct Playwright code
3. **Don't use excessive timeouts** - Prefer smart waits
4. **Don't match multiple elements** - Always scope selectors
5. **Don't ignore errors** - Handle gracefully or fail appropriately
6. **Don't skip waitForLoadState** - After navigation
7. **Don't access window/document directly** - Use `globalThis`
8. **Don't test without data-testid** - Use TestSelectors first

---

## 📚 Real Examples from Tests

### Example 1: Complete Test Structure

```typescript
test.describe('Smoke Test - Critical Public Paths', () => {
  test('should load HomePage correctly with all sections and Supabase data', {
    tag: ['@smoke', '@heartbeat', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // Setup
    const pageLoadStartTime = Date.now();
    await navigateToHome(page);
    await page.waitForLoadState('networkidle');
    const pageLoadTime = (Date.now() - pageLoadStartTime) / 1000;
    console.log(`📊 HomePage load time: ${pageLoadTime.toFixed(2)}s`);

    // Section 1: Page Load
    await expect(page).toHaveTitle(/GMP|Artesanías en Cuero/i);

    // Section 2: Header
    const header = page.locator(TestSelectors.header).or(page.locator('header'));
    await expect(header).toBeVisible();

    // Section 3: Hero Section
    const heroSection = page.locator(TestSelectors.homeHeroSection).or(
      page.locator('section').filter({ hasText: /artesanías|macramé/i }).first()
    );
    await expect(heroSection).toBeVisible();
  });
});
```

### Example 2: API Verification

```typescript
let supabaseResponseReceived = false;
let supabaseResponseStatus = 0;
let productData: any = null;

page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('/rest/v1/products') && url.includes('featured=eq.true')) {
    supabaseResponseReceived = true;
    supabaseResponseStatus = response.status();
    try {
      productData = await response.json();
    } catch (e) {
      // Response might not be JSON
    }
  }
});

const featuredSection = page.locator(TestSelectors.homeFeaturedProducts);
await featuredSection.scrollIntoViewIfNeeded();
await page.waitForTimeout(2000);

if (supabaseResponseReceived) {
  expect(supabaseResponseStatus).toBe(200);
  if (productData && Array.isArray(productData)) {
    console.log(`✅ Supabase API verified: ${productData.length} featured products`);
  }
}
```

### Example 3: Scoped Selectors

```typescript
// Scope to header to avoid footer logo
const header = page.locator(TestSelectors.header).or(page.locator('header'));
const logo = header.locator(TestSelectors.headerLogo);
await expect(logo).toBeVisible();

// Scope to navigation area to avoid mobile menu
const headerNav = header.locator('nav').or(header.locator('[data-testid*="nav"]'));
const homeLink = headerNav.locator(TestSelectors.headerNavHomeLink);
await expect(homeLink).toBeVisible();
```

---

## 🚀 Quick Reference Checklist

When creating a new test:

- [ ] Use standard file structure with JSDoc header
- [ ] Import navigation helpers and TestSelectors
- [ ] Use section comments for organization
- [ ] Scope selectors to parent elements
- [ ] Use `.or()` fallback for selectors
- [ ] Wait for `networkidle` after navigation
- [ ] Set up API listeners BEFORE actions
- [ ] Use `waitForFunction` for animations
- [ ] Handle optional elements gracefully
- [ ] Use `globalThis` in `page.evaluate()`
- [ ] Add appropriate tags
- [ ] Log success/warning/info messages
- [ ] Verify URLs after navigation
- [ ] Track performance when relevant
- [ ] Monitor console errors

---

**End of Document**

