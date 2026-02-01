# Quick Reference Guide - Test Implementation

**Last Updated:** January 2026  
**Purpose:** Quick lookup for common patterns and code snippets

---

## 📋 File Template

```typescript
import { test, expect } from '@playwright/test';
import { navigateToHome, navigateToCatalog } from '../utils/navigation';
import { TestSelectors } from '../utils/selectors';

/**
 * [Test Type] - [Test Name] ([QA-Ticket])
 * Based on: QA_TICKET_[NUMBER]_[NAME].md
 * Tags: @[type], @[area], @desktop, @development, @staging, @production
 */
test.describe('[Suite Name]', () => {
  test('should [behavior]', {
    tag: ['@[type]', '@[area]', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: [Description]
    // ============================================================================
    await navigateToHome(page);
    await page.waitForLoadState('networkidle');
    
    // ============================================================================
    // SECTION 1: [Section Name]
    // ============================================================================
    // Test code
  });
});
```

---

## 🎯 Selector Patterns

### Primary with Fallback
```typescript
const element = page.locator(TestSelectors.xxx).or(
  page.locator('fallback-selector')
);
```

### Scoped (Avoid Strict Mode)
```typescript
const parent = page.locator(TestSelectors.parent);
const child = parent.locator(TestSelectors.child);
```

### Conditional
```typescript
const element = page.locator(TestSelectors.xxx);
if (await element.count() > 0) {
  await expect(element).toBeVisible();
}
```

---

## ⏱️ Waiting Patterns

### Network Idle
```typescript
await navigateToHome(page);
await page.waitForLoadState('networkidle');
```

### Smart Wait (Function)
```typescript
await page.waitForFunction(() => {
  const win = (globalThis as any).window;
  return (win?.scrollY || 0) >= 900;
}, { timeout: 2000 });
```

### URL Change
```typescript
await Promise.all([
  page.waitForURL(/\/catalogo/, { timeout: 5000 }),
  button.click()
]);
```

### Timeout (Last Resort)
```typescript
await page.waitForTimeout(300); // For CSS transitions
```

---

## 🔍 API Verification

```typescript
let responseReceived = false;
let responseStatus = 0;

page.on('response', (response) => {
  if (response.url().includes('/rest/v1/products')) {
    responseReceived = true;
    responseStatus = response.status();
  }
});

// Trigger action
await section.scrollIntoViewIfNeeded();
await page.waitForTimeout(2000);

// Verify
if (responseReceived) {
  expect(responseStatus).toBe(200);
}
```

---

## 🎨 Animation Testing

### Hover Effect
```typescript
const colorBefore = await element.evaluate((el) => {
  const styles = (globalThis as any).getComputedStyle(el);
  return styles.color;
});

await element.hover();
await page.waitForTimeout(300);

const colorAfter = await element.evaluate((el) => {
  const styles = (globalThis as any).getComputedStyle(el);
  return styles.color;
});

if (colorAfter !== colorBefore) {
  console.log('✅ Hover effect detected');
}
```

### Scroll Animation
```typescript
await section.scrollIntoViewIfNeeded();
await page.waitForTimeout(1000); // Intersection Observer
```

---

## 🔄 Navigation

### Basic Navigation
```typescript
await navigateToHome(page);
await page.waitForLoadState('networkidle');
```

### Navigation with Verification
```typescript
await Promise.all([
  page.waitForURL(/\/catalogo/, { timeout: 5000 }),
  button.click()
]);
await expect(page).toHaveURL(/\/catalogo/);
```

### Browser History
```typescript
await page.goBack();
await page.waitForTimeout(1000);
```

---

## ⚡ Performance

```typescript
const startTime = Date.now();
await navigateToHome(page);
await page.waitForLoadState('networkidle');
const loadTime = (Date.now() - startTime) / 1000;
console.log(`📊 Load time: ${loadTime.toFixed(2)}s`);
```

---

## 🛡️ Error Handling

### Console Errors
```typescript
const errors: string[] = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
await page.waitForTimeout(1000);
if (errors.length > 0) {
  console.warn('⚠️ Console errors:', errors);
}
```

### Optional Elements
```typescript
const element = page.locator(TestSelectors.xxx);
if (await element.count() > 0) {
  await expect(element).toBeVisible();
} else {
  console.log('ℹ️ Element not found');
}
```

---

## 🌐 GlobalThis Pattern

```typescript
// In page.evaluate()
await page.evaluate(() => {
  (globalThis as any).window?.scrollTo(0, 0);
  const scrollY = (globalThis as any).window?.scrollY || 0;
  const styles = (globalThis as any).getComputedStyle(element);
});
```

---

## 📝 Logging

```typescript
console.log('✅ Success message');
console.warn('⚠️ Warning message');
console.log('ℹ️ Info message');
console.log(`📊 Metric: ${value}`);
```

---

## ✅ Checklist

- [ ] Use navigation helpers
- [ ] Scope selectors to parent
- [ ] Wait for networkidle after navigation
- [ ] Set up API listeners BEFORE actions
- [ ] Use globalThis in page.evaluate()
- [ ] Handle optional elements gracefully
- [ ] Use section comments
- [ ] Add appropriate tags
- [ ] Log important events
- [ ] Verify URLs after navigation

---

**See full documentation:**
- `TEST_IMPLEMENTATION_PATTERNS.md` - Complete patterns guide
- `COMMON_PITFALLS_AND_SOLUTIONS.md` - Common issues and fixes
- `COMPLEX_TEST_SCENARIOS.md` - Advanced test scenarios

---

**End of Document**

