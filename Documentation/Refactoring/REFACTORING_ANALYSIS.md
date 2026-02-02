# 🔍 Refactoring Analysis - GMP UI Test Framework

**Generated:** 2026-01-25  
**Analysis Type:** Pre-Refactoring Code Audit  
**Total Files Analyzed:** 6 test files + utilities

---

## 📊 Executive Summary

**Total Issues Found:** 44 hardcoded timeouts + 4 major duplication patterns  
**Estimated Refactoring Impact:** ~200-300 lines of duplicate code to extract  
**Risk Level:** Medium (tests are functional but flaky)

---

## 1. Hardcoded Timeout Analysis

### Summary

| File | Timeout Count | Total Wait Time (ms) | Risk Level |
|------|---------------|---------------------|------------|
| `critical-public-paths-load-correctly.spec.ts` | 15 | ~12,500ms | 🔴 HIGH |
| `home-page-navigation-to-catalog-works-correctly.spec.ts` | 12 | ~6,600ms | 🔴 HIGH |
| `home-page-hero-section-displays-correctly.spec.ts` | 6 | ~5,800ms | 🟡 MEDIUM |
| `home-page-loads-and-displays-correctly.spec.ts` | 5 | ~5,000ms | 🟡 MEDIUM |
| `critical-navigation-elements-work-correctly.spec.ts` | 0 | 0ms | ✅ GOOD |
| `critical-admin-paths-require-authentication.spec.ts` | 4 | ~2,100ms | 🟡 MEDIUM |
| **TOTAL** | **42** | **~32,000ms** | **🔴 HIGH** |

### Detailed Breakdown by File

#### `critical-public-paths-load-correctly.spec.ts` (15 timeouts)
```
Line 51:   await page.waitForTimeout(1000);   // Console error monitoring
Line 70:   await page.waitForTimeout(500);    // Scroll animation
Line 82:   await page.waitForTimeout(500);    // Scroll back
Line 116:  await page.waitForTimeout(1000);   // Location section scroll
Line 151:  await page.waitForTimeout(2000);   // Featured products API wait
Line 156:  await page.waitForTimeout(1000);   // Featured products check
Line 183:  await page.waitForTimeout(1000);   // About section scroll
Line 199:  await page.waitForTimeout(500);    // CTA section scroll
Line 237:  await page.waitForTimeout(1000);   // Console error monitoring
Line 283:  await page.waitForTimeout(2000);   // Products API wait
Line 309:  await page.waitForTimeout(1000);    // Product card click wait
Line 325:  await page.waitForTimeout(2000);   // Product detail API wait
Line 378:  await page.waitForTimeout(1000);   // Console error monitoring
Line 391:  await page.waitForTimeout(1000);   // Console error monitoring
Line 441:  await page.waitForTimeout(1000);   // Back button navigation wait
```

**Replacement Strategy:**
- Console monitoring: Extract to utility, use `waitForFunction()` to check error count
- Scroll animations: Use `waitForFunction()` to verify scroll position
- API waits: Use `page.waitForResponse()` instead
- Navigation waits: Use `page.waitForURL()` instead

#### `home-page-navigation-to-catalog-works-correctly.spec.ts` (12 timeouts)
```
Line 30:   await page.waitForTimeout(2500);  // First visit animation (CRITICAL)
Line 46:   await page.waitForTimeout(300);    // Hover effect wait
Line 63:   await page.waitForTimeout(300);    // Hover effect wait
Line 83:   await page.waitForTimeout(1000);   // Navigation wait
Line 89:   await page.waitForTimeout(1000);   // Navigation wait
Line 95:   await page.waitForTimeout(500);    // CTA section scroll
Line 110:  await page.waitForTimeout(300);    // Hover effect wait
Line 130:  await page.waitForTimeout(1000);   // Navigation wait
Line 136:  await page.waitForTimeout(500);    // Navigation wait
Line 146:  await page.waitForTimeout(300);    // Hover effect wait
Line 160:  await page.waitForTimeout(500);    // Scroll wait
Line 165:  await page.waitForTimeout(500);    // Scroll wait
Line 181:  await page.waitForTimeout(500);    // Navigation wait
Line 191:  await page.waitForTimeout(1000);   // Browser history wait
```

**Replacement Strategy:**
- First visit animation: Use `waitForFunction()` to check body overflow or header visibility
- Hover effects: Use `waitForFunction()` to verify CSS changes
- Navigation: Use `page.waitForURL()` instead
- Scroll: Use `waitForFunction()` to verify scroll position

#### `home-page-hero-section-displays-correctly.spec.ts` (6 timeouts)
```
Line 50:   await page.waitForTimeout(2500);  // First visit animation (CRITICAL)
Line 172:  await page.waitForTimeout(200);   // Parallax effect wait
Line 204:  await page.waitForTimeout(300);   // Button hover wait
Line 222:  await page.waitForTimeout(1000);  // Navigation wait
Line 228:  await page.waitForTimeout(500);   // Navigation wait
Line 230:  await page.waitForTimeout(1000);  // Subsequent visit wait
```

**Replacement Strategy:**
- First visit animation: Use `waitForFunction()` to check animation completion
- Parallax/hover: Use `waitForFunction()` to verify transform changes
- Navigation: Use `page.waitForURL()` instead

#### `home-page-loads-and-displays-correctly.spec.ts` (5 timeouts)
```
Line 54:   await page.waitForTimeout(1000);   // Console error monitoring
Line 126:  await page.waitForTimeout(1000);  // Location section scroll
Line 175:  await page.waitForTimeout(2000);  // Featured products API wait
Line 224:  await page.waitForTimeout(1000);  // About section scroll
Line 257:  await page.waitForTimeout(500);   // CTA section scroll
```

**Replacement Strategy:**
- Console monitoring: Extract to utility
- Scroll: Use `waitForFunction()` to verify scroll position
- API wait: Use `page.waitForResponse()` instead

#### `critical-admin-paths-require-authentication.spec.ts` (4 timeouts)
```
Line 54:   await page.waitForTimeout(1000);   // Console error monitoring
Line 101:  await page.waitForTimeout(300);   // Password toggle wait
Line 111:  await page.waitForTimeout(300);   // Password toggle wait
Line 190:  await page.waitForTimeout(500);    // Browser back wait
```

**Replacement Strategy:**
- Console monitoring: Extract to utility
- Password toggle: Use `waitForFunction()` to verify input type change
- Browser back: Use `page.waitForURL()` instead

---

## 2. Code Duplication Analysis

### Pattern 1: Console Error Monitoring (5 occurrences)

**Files:**
- `critical-public-paths-load-correctly.spec.ts` (3x)
- `critical-admin-paths-require-authentication.spec.ts` (1x)
- `home-page-loads-and-displays-correctly.spec.ts` (1x)

**Duplicate Code:**
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

**Lines Duplicated:** ~15 lines × 5 = 75 lines  
**Extraction Target:** `utils/console-monitor.ts`

---

### Pattern 2: Supabase API Listener Setup (4 occurrences)

**Files:**
- `critical-public-paths-load-correctly.spec.ts` (3x)
- `home-page-loads-and-displays-correctly.spec.ts` (1x)

**Duplicate Code:**
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

await page.waitForTimeout(2000);

if (supabaseResponseReceived) {
  expect(supabaseResponseStatus).toBe(200);
  if (productData && Array.isArray(productData)) {
    console.log(`✅ Supabase API verified: ${productData.length} products`);
  }
}
```

**Lines Duplicated:** ~25 lines × 4 = 100 lines  
**Extraction Target:** `utils/api-listener.ts`

---

### Pattern 3: Performance Tracking (3 occurrences)

**Files:**
- `critical-public-paths-load-correctly.spec.ts` (1x)
- `home-page-loads-and-displays-correctly.spec.ts` (1x)
- `critical-admin-paths-require-authentication.spec.ts` (1x - redirect timing)

**Duplicate Code:**
```typescript
const pageLoadStartTime = Date.now();
await navigateToHome(page);
await page.waitForLoadState('networkidle');
const pageLoadTime = (Date.now() - pageLoadStartTime) / 1000;

console.log(`📊 HomePage load time: ${pageLoadTime.toFixed(2)}s`);

if (pageLoadTime > 3) {
  console.warn(`⚠️ Page load time (${pageLoadTime.toFixed(2)}s) exceeds recommended 3s`);
}
```

**Lines Duplicated:** ~8 lines × 3 = 24 lines  
**Extraction Target:** `utils/performance-tracker.ts`

---

### Pattern 4: Image Loading Verification (3 occurrences)

**Files:**
- `critical-public-paths-load-correctly.spec.ts` (1x)
- `home-page-loads-and-displays-correctly.spec.ts` (2x)

**Duplicate Code:**
```typescript
const allImages = page.locator('img');
const imageCount = await allImages.count();
if (imageCount > 0) {
  for (let i = 0; i < Math.min(imageCount, 5); i++) {
    const img = allImages.nth(i);
    const src = await img.getAttribute('src');
    if (src && !src.startsWith('data:') && !src.startsWith('http')) {
      const baseURL = page.url().split('/').slice(0, 3).join('/');
      const fullUrl = src.startsWith('/') ? `${baseURL}${src}` : `${baseURL}/${src}`;
      const response = await page.request.get(fullUrl);
      expect(response.status()).toBeLessThan(400);
    } else if (src && src.startsWith('http')) {
      const response = await page.request.get(src);
      expect(response.status()).toBeLessThan(400);
    }
  }
  console.log('✅ Images load successfully');
}
```

**Lines Duplicated:** ~20 lines × 3 = 60 lines  
**Extraction Target:** `utils/image-verification.ts`

---

### Total Duplication Summary

| Pattern | Occurrences | Lines Each | Total Lines | Priority |
|---------|-------------|-----------|-------------|----------|
| Console Error Monitoring | 5 | ~15 | 75 | 🔴 HIGH |
| Supabase API Listener | 4 | ~25 | 100 | 🔴 HIGH |
| Image Loading Verification | 3 | ~20 | 60 | 🟡 MEDIUM |
| Performance Tracking | 3 | ~8 | 24 | 🟡 MEDIUM |
| **TOTAL** | **15** | **~68** | **~259 lines** | |

**Estimated Reduction:** ~259 lines of duplicate code → ~100 lines of utilities  
**Code Reduction:** ~60% reduction in test file size

---

## 3. File Structure Analysis

### Current Structure
```
tests/
  ├─ e2e/
  │   └─ public/
  │       └─ home-page/
  │           ├─ home-page-loads-and-displays-correctly.spec.ts (295 lines)
  │           ├─ home-page-hero-section-displays-correctly.spec.ts (238 lines)
  │           └─ home-page-navigation-to-catalog-works-correctly.spec.ts (198 lines)
  ├─ smoke/
  │   ├─ critical-public-paths-load-correctly.spec.ts (448 lines) ⚠️ TOO LONG
  │   ├─ critical-admin-paths-require-authentication.spec.ts (198 lines)
  │   └─ critical-navigation-elements-work-correctly.spec.ts (282 lines)
  └─ utils/
      ├─ navigation.ts (✅ Good - 85 lines)
      ├─ selectors.ts (✅ Good - 170 lines)
      ├─ step-executor.ts (❌ Unused - 266 lines)
      └─ index.ts (✅ Good - 26 lines)
```

### Issues Identified

1. **Long Test Files:**
   - `critical-public-paths-load-correctly.spec.ts`: 448 lines (target: <300)
   - Contains 3 separate test scenarios (should be split)

2. **Unused Code:**
   - `step-executor.ts`: 266 lines, 0 usages
   - Decision needed: Use it or remove it

3. **Missing Structure:**
   - No `pages/` directory (Page Objects)
   - No `fixtures/` directory (Test data)
   - No `config/` directory (Environment configs)

---

## 4. Step Executor Decision Analysis

### Current State
- **File:** `tests/utils/step-executor.ts`
- **Lines:** 266
- **Usages:** 0 (not used in any test file)
- **Documentation:** Extensive (README.md recommends using it)

### Options

#### Option A: Use Step Executor
**Pros:**
- Already implemented
- Good error handling
- Retry logic built-in
- Better test documentation

**Cons:**
- Requires refactoring all tests
- Adds complexity
- May be overkill for current test size

#### Option B: Remove Step Executor
**Pros:**
- Simpler codebase
- Less abstraction
- Easier for new contributors
- Matches current implementation

**Cons:**
- Loses structured error handling
- No built-in retry logic
- Less test documentation

### Recommendation: **REMOVE** (Option B)

**Reasoning:**
1. Tests are currently working without it
2. Simpler is better for this codebase size
3. Can add it back later if needed
4. Focus on fixing critical issues first (timeouts, duplication)

**Action:** Remove `step-executor.ts` and update documentation

---

## 5. Refactoring Priority Matrix

### Phase 1: Critical Fixes (Week 1)
**Impact:** High | **Effort:** Medium

1. ✅ Extract console monitoring utility
2. ✅ Extract API listener utility
3. ✅ Extract performance tracker utility
4. ✅ Replace hardcoded timeouts in smoke tests
5. ✅ Replace hardcoded timeouts in e2e tests

**Expected Outcome:** Zero hardcoded timeouts, ~150 lines of duplicate code removed

---

### Phase 2: Structure Improvements (Week 2)
**Impact:** Medium | **Effort:** High

1. ✅ Create Page Objects (HomePage, CatalogPage, AdminLoginPage)
2. ✅ Migrate tests to use Page Objects
3. ✅ Extract image verification utility
4. ✅ Split long test files

**Expected Outcome:** Clean test structure, Page Object Model implemented

---

### Phase 3: Cleanup (Week 3)
**Impact:** Low | **Effort:** Low

1. ✅ Remove step executor (if decision is to remove)
2. ✅ Update documentation
3. ✅ Add test fixtures structure
4. ✅ Final validation

**Expected Outcome:** Clean codebase, updated docs

---

## 6. Risk Assessment

### Low Risk Changes
- ✅ Extracting utilities (additive, doesn't break existing code)
- ✅ Replacing timeouts with condition-based waits (improves reliability)

### Medium Risk Changes
- ⚠️ Creating Page Objects (requires test refactoring)
- ⚠️ Splitting long test files (requires careful migration)

### High Risk Changes
- 🔴 Removing step executor (if tests depend on it - but they don't)
- 🔴 Changing test structure (could break CI/CD if configured)

### Mitigation Strategy
1. Create utilities first (additive)
2. Replace timeouts incrementally (test after each file)
3. Create Page Objects alongside existing code (parallel implementation)
4. Migrate tests one file at a time
5. Run full test suite after each change

---

## 7. Success Metrics

### Before Refactoring
- Hardcoded timeouts: 42
- Code duplication: ~259 lines
- Longest test file: 448 lines
- Unused code: 266 lines (step executor)

### After Refactoring (Target)
- Hardcoded timeouts: 0 ✅
- Code duplication: <50 lines ✅
- Longest test file: <300 lines ✅
- Unused code: 0 lines ✅

### Quality Metrics
- All tests pass consistently
- No flakiness (zero timeout-based waits)
- Clear separation of concerns
- Easy to extend (utilities available)

---

## 8. Implementation Plan

### Step 1: Create Utilities (Day 1-2)
1. Create `utils/console-monitor.ts`
2. Create `utils/api-listener.ts`
3. Create `utils/performance-tracker.ts`
4. Create `utils/image-verification.ts`
5. Create `utils/wait-helpers.ts`

### Step 2: Replace Timeouts in Smoke Tests (Day 3-4)
1. Refactor `critical-public-paths-load-correctly.spec.ts`
2. Refactor `critical-admin-paths-require-authentication.spec.ts`
3. Refactor `critical-navigation-elements-work-correctly.spec.ts` (already good)

### Step 3: Replace Timeouts in E2E Tests (Day 5-6)
1. Refactor `home-page-loads-and-displays-correctly.spec.ts`
2. Refactor `home-page-hero-section-displays-correctly.spec.ts`
3. Refactor `home-page-navigation-to-catalog-works-correctly.spec.ts`

### Step 4: Create Page Objects (Day 7-10)
1. Create `pages/HomePage.ts`
2. Migrate HomePage tests
3. Create other Page Objects as needed

### Step 5: Cleanup (Day 11-12)
1. Remove step executor (if decision is to remove)
2. Update documentation
3. Final validation

---

## 9. Validation Checklist

After each phase, verify:

- [ ] All tests pass
- [ ] No hardcoded timeouts remain
- [ ] Code duplication reduced
- [ ] No linting errors
- [ ] Documentation updated
- [ ] Utilities are reusable
- [ ] Tests are more maintainable

---

**Analysis Complete. Ready to begin refactoring.**
