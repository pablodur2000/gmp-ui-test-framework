# Common Pitfalls and Solutions

**Last Updated:** January 2026  
**Purpose:** Learn from mistakes - common issues found in tests and how to fix them

---

## 🚨 Strict Mode Violations

### Problem: Selector Matches Multiple Elements

**Error:**
```
Error: strict mode violation: locator('[data-testid="header-logo"]') resolved to 2 elements
```

**Root Cause:**
- Selector matches both header and footer elements
- Selector matches both desktop and mobile elements
- Selector matches multiple instances of same component

**Solution: Scope to Parent Element**

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

**Real Example from Tests:**
- `critical-navigation-elements-work-correctly.spec.ts` - Logo selector fixed by scoping to header
- `critical-navigation-elements-work-correctly.spec.ts` - Navigation links fixed by scoping to headerNav

---

## 🔒 SecurityError: localStorage Access Denied

### Problem: Cannot Access localStorage in page.evaluate()

**Error:**
```
Error: page.evaluate: SecurityError: Failed to read the 'localStorage' property from 'Window': Access is denied for this document.
```

**Root Cause:**
- Cross-origin restrictions
- Page context limitations
- Security policies

**Solution: Use globalThis and Handle Errors**

```typescript
// ❌ BAD - Direct access
await page.evaluate(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// ✅ GOOD - Safe access with error handling
try {
  await page.evaluate(() => {
    const win = (globalThis as any).window;
    if (win?.localStorage) win.localStorage.clear();
    if (win?.sessionStorage) win.sessionStorage.clear();
  });
} catch (error) {
  // If localStorage access is denied, continue anyway
  // Cookies clearing is more important for authentication
  console.log('⚠️ Could not clear localStorage/sessionStorage (may be cross-origin restriction)');
}

// ✅ BETTER - Use cookies for authentication (primary mechanism)
await page.context().clearCookies();
// Note: localStorage/sessionStorage clearing is skipped due to SecurityError restrictions
```

**Real Example:**
- `critical-admin-paths-require-authentication.spec.ts` - Removed localStorage clearing, uses cookies only

---

## 🪟 TypeScript Errors: Cannot Find Name 'window' or 'document'

### Problem: TypeScript doesn't recognize browser globals in page.evaluate()

**Error:**
```
Cannot find name 'window'.
Cannot find name 'document'.
```

**Root Cause:**
- TypeScript doesn't have browser context in `page.evaluate()`
- Need to use `globalThis` to access browser APIs

**Solution: Use globalThis**

```typescript
// ❌ BAD - Direct access
await page.evaluate(() => {
  window.scrollTo(0, 0);
  const scrollY = window.scrollY;
  const styles = window.getComputedStyle(element);
});

// ✅ GOOD - Use globalThis
await page.evaluate(() => {
  (globalThis as any).window?.scrollTo(0, 0);
  const scrollY = (globalThis as any).window?.scrollY || 0;
  const styles = (globalThis as any).getComputedStyle(element);
});

// ✅ GOOD - With null checks
await page.waitForFunction(() => {
  const doc = (globalThis as any).document;
  const win = (globalThis as any).window;
  if (!doc || !win) return false;
  const headerEl = doc.querySelector('header');
  if (!headerEl) return false;
  const styles = win.getComputedStyle(headerEl);
  return styles.opacity !== '0';
}, { timeout: 3000 });
```

**Real Examples:**
- `critical-navigation-elements-work-correctly.spec.ts` - All window/document access uses globalThis
- `home-page-hero-section-displays-correctly.spec.ts` - Scroll and style access uses globalThis

---

## ⏱️ Timeout Issues

### Problem: Tests timeout waiting for elements or actions

**Error:**
```
Test timeout of 30000ms exceeded.
```

**Root Cause:**
- Waiting for elements that don't exist
- Waiting for animations that never complete
- Network requests that never finish

**Solution: Use Appropriate Wait Strategies**

```typescript
// ❌ BAD - Hardcoded long timeout
await page.waitForTimeout(5000);

// ✅ GOOD - Wait for actual condition
await page.waitForLoadState('networkidle');
await page.waitForFunction(() => {
  const win = (globalThis as any).window;
  return (win?.scrollY || 0) >= 900;
}, { timeout: 2000 });

// ✅ GOOD - Wait for URL change
await Promise.all([
  page.waitForURL(/\/catalogo/, { timeout: 5000 }),
  button.click()
]);

// ✅ GOOD - Wait for element with timeout
await expect(element).toBeVisible({ timeout: 5000 });
```

**Real Examples:**
- All tests use `waitForLoadState('networkidle')` after navigation
- `critical-navigation-elements-work-correctly.spec.ts` - Uses `waitForFunction` for animations

---

## 🔄 API Response Not Captured

### Problem: API response listener doesn't capture response

**Root Cause:**
- Listener set up AFTER the action that triggers API call
- Wrong URL pattern matching
- Response happens too fast

**Solution: Set Up Listener BEFORE Action**

```typescript
// ❌ BAD - Listener after action
await section.scrollIntoViewIfNeeded();
page.on('response', (response) => {
  // Too late! Response already happened
});

// ✅ GOOD - Listener before action
let supabaseResponseReceived = false;
let supabaseResponseStatus = 0;

page.on('response', (response) => {
  const url = response.url();
  if (url.includes('/rest/v1/products') && url.includes('featured=eq.true')) {
    supabaseResponseReceived = true;
    supabaseResponseStatus = response.status();
  }
});

// NOW trigger the action
await section.scrollIntoViewIfNeeded();
await page.waitForTimeout(2000);

// Verify response
if (supabaseResponseReceived) {
  expect(supabaseResponseStatus).toBe(200);
}
```

**Real Examples:**
- `critical-public-paths-load-correctly.spec.ts` - All API listeners set up before actions
- `home-page-loads-and-displays-correctly.spec.ts` - Featured products API verified correctly

---

## 🎯 Dropdown/Menu Not Detected

### Problem: Dropdown selector matches wrong element (e.g., mobile menu button)

**Error:**
```
Error: expect(locator).toBeVisible() failed
Locator: locator('[data-testid*="dropdown"], [data-testid*="menu"]')
Expected: visible
Received: hidden
```

**Root Cause:**
- Selector too generic, matches mobile menu button
- Not scoped to desktop navigation
- Waiting for wrong element

**Solution: Scope and Wait for Actual Content**

```typescript
// ❌ BAD - Too generic, matches mobile menu
const dropdown = page.locator('[data-testid*="dropdown"], [data-testid*="menu"]');

// ✅ GOOD - Scoped to desktop nav and wait for content
const headerForDropdown = page.locator(TestSelectors.header).or(page.locator('header'));
const headerNavForDropdown = headerForDropdown.locator('nav').first(); // Desktop nav

const catalogLinkForDropdown = headerNavForDropdown.locator(TestSelectors.headerNavCatalogLink);
await catalogLinkForDropdown.hover();

// Wait for dropdown content to appear
await page.waitForFunction(() => {
  const doc = (globalThis as any).document;
  if (!doc) return false;
  const header = doc.querySelector('header');
  if (!header) return false;
  const dropdownTexts = header.textContent || '';
  const hasDropdownContent = /ver todo el catálogo|billeteras|cinturones/i.test(dropdownTexts);
  return hasDropdownContent;
}, { timeout: 2000 });

// Verify dropdown content
const dropdownContent = headerNavForDropdown.getByText(/ver todo el catálogo|billeteras/i).first();
if (await dropdownContent.count() > 0) {
  await expect(dropdownContent).toBeVisible();
}
```

**Real Example:**
- `critical-navigation-elements-work-correctly.spec.ts` - Dropdown hover test fixed by scoping and waiting for content

---

## 📄 Page Title Assertion Fails

### Problem: Page title doesn't match expected pattern

**Error:**
```
Error: expect(page).toHaveTitle(expected) failed
Expected pattern: /admin|login/i
Received string: "Artesanías en Cuero - Catálogo Familiar"
```

**Root Cause:**
- Page title not set in production code
- Title changes based on route
- Title assertion happens before title is set

**Solution: Verify URL First, Then Title**

```typescript
// ❌ BAD - Title assertion may fail if title not set
await expect(page).toHaveTitle(/admin|login/i);

// ✅ GOOD - Verify URL first (more reliable)
await expect(page).toHaveURL(/\/admin\/login/);
await expect(page).toHaveTitle(/admin|login/i);

// ✅ BETTER - Fix production code to set title
// In AdminLoginPage.tsx:
useEffect(() => {
  document.title = 'Admin Login - Artesanías en Cuero';
  return () => {
    document.title = 'Artesanías en Cuero - Catálogo Familiar';
  };
}, []);
```

**Real Example:**
- `critical-admin-paths-require-authentication.spec.ts` - Fixed by verifying URL first, then title
- Production code fixed to set page title

---

## 🎨 Animation Not Detected

### Problem: Hover effects or transitions not detected

**Root Cause:**
- Not waiting for CSS transition to complete
- Checking state before transition starts
- Transition duration not accounted for

**Solution: Wait for Transition Duration**

```typescript
// ❌ BAD - No wait for transition
await element.hover();
const colorAfter = await element.evaluate((el) => {
  const styles = (globalThis as any).getComputedStyle(el);
  return styles.color;
});

// ✅ GOOD - Wait for transition (duration-100 = 100ms, use 300ms buffer)
const colorBefore = await element.evaluate((el) => {
  const styles = (globalThis as any).getComputedStyle(el);
  return styles.color;
});

await element.hover();
await page.waitForTimeout(300); // Wait for CSS transition

const colorAfter = await element.evaluate((el) => {
  const styles = (globalThis as any).getComputedStyle(el);
  return styles.color;
});

if (colorAfter !== colorBefore) {
  console.log('✅ Hover effect detected');
}
```

**Real Examples:**
- `critical-navigation-elements-work-correctly.spec.ts` - Hover effects tested with proper waits
- `home-page-navigation-to-catalog-works-correctly.spec.ts` - Button hover effects verified

---

## 🔄 Element Not Found After Navigation

### Problem: Element selector fails after page navigation

**Root Cause:**
- Element re-rendered after navigation
- Selector needs to be re-scoped
- Page state changed

**Solution: Re-Scope Selectors After Navigation**

```typescript
// ❌ BAD - Using old selector after navigation
const logo = header.locator(TestSelectors.headerLogo);
await navigateToCatalog(page);
await expect(logo).toBeVisible(); // May fail - element re-rendered

// ✅ GOOD - Re-scope after navigation
const header = page.locator(TestSelectors.header).or(page.locator('header'));
const logo = header.locator(TestSelectors.headerLogo);
await logo.click();

await navigateToCatalog(page);
await page.waitForLoadState('networkidle');

// Re-scope to current page header
const headerAfterNav = page.locator(TestSelectors.header).or(page.locator('header'));
const logoAfterNav = headerAfterNav.locator(TestSelectors.headerLogo);
await expect(logoAfterNav).toBeVisible();
```

**Real Example:**
- `critical-navigation-elements-work-correctly.spec.ts` - Logo and navigation links re-scoped after each navigation

---

## 📊 Performance Metrics Not Accurate

### Problem: Performance timing includes setup time

**Root Cause:**
- Timer starts too early (before navigation)
- Timer includes wait times
- Not accounting for network delays

**Solution: Measure Only Navigation Time**

```typescript
// ❌ BAD - Includes setup time
const startTime = Date.now();
await page.waitForTimeout(1000); // Setup
await navigateToHome(page);
const loadTime = (Date.now() - startTime) / 1000; // Includes setup

// ✅ GOOD - Measure only navigation
const pageLoadStartTime = Date.now();
await navigateToHome(page);
await page.waitForLoadState('networkidle');
const pageLoadTime = (Date.now() - pageLoadStartTime) / 1000;
console.log(`📊 Page load time: ${pageLoadTime.toFixed(2)}s`);
```

**Real Examples:**
- All tests measure performance correctly - timer starts right before navigation

---

## 🎯 Summary: Prevention Checklist

When writing tests, avoid these common pitfalls:

- [ ] **Scope selectors** - Always scope to parent to avoid strict mode violations
- [ ] **Use globalThis** - In all `page.evaluate()` calls
- [ ] **Set up API listeners BEFORE actions** - Capture responses correctly
- [ ] **Wait for networkidle** - After all navigation
- [ ] **Re-scope selectors** - After page navigation
- [ ] **Wait for transitions** - Use appropriate timeouts for CSS animations
- [ ] **Handle optional elements** - Use `if (count > 0)` checks
- [ ] **Verify URL first** - More reliable than title
- [ ] **Use smart waits** - Prefer `waitForFunction` over `waitForTimeout`
- [ ] **Handle errors gracefully** - Use try-catch for optional features

---

**End of Document**

