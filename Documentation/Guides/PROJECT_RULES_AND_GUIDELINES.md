# GMP UI Test Framework - Project Rules and Guidelines

## 🎯 Purpose

This document defines the **global rules, conventions, and best practices** for the GMP UI Test Framework. All tests, code, and contributions must follow these guidelines to ensure consistency, maintainability, and reliability.

**Target Audience**: Developers, QA Engineers, AI Agents, and Contributors

## 📚 Quick Links

- **Creating a new test?** → See [TEST_CREATION_GUIDE.md](TEST_CREATION_GUIDE.md) (complete step-by-step guide)
- **Test patterns and examples?** → See [../Tests/TEST_IMPLEMENTATION_PATTERNS.md](../Tests/TEST_IMPLEMENTATION_PATTERNS.md)
- **Common issues?** → See [../Tests/COMMON_PITFALLS_AND_SOLUTIONS.md](../Tests/COMMON_PITFALLS_AND_SOLUTIONS.md)
- **Quick reference?** → See [../Tests/QUICK_REFERENCE_GUIDE.md](../Tests/QUICK_REFERENCE_GUIDE.md)

---

## 📁 Project Structure

### Folder Organization

```
tests/
├── smoke/                          # Basic heartbeat/smoke tests
│   └── application-heartbeat-*.spec.ts
│
├── e2e/                            # Comprehensive end-to-end tests
│   ├── public/                     # Public-facing pages
│   │   ├── home-page/
│   │   ├── catalog-page/
│   │   ├── product-detail-page/
│   │   └── navigation/
│   │
│   └── admin/                      # Admin pages (protected)
│       ├── authentication/
│       ├── dashboard/
│       └── product-management/
│
└── utils/                           # Shared utilities
    ├── step-executor.ts            # Step executor pattern
    ├── navigation.ts               # Navigation helpers
    ├── selectors.ts                # Centralized selectors
    └── index.ts                    # Utility exports
```

### File Naming Conventions

**Test Files**: `[area]-[feature]-[action]-[expected-result].spec.ts`

**Examples**:
- ✅ `home-page-loads-and-displays-correctly.spec.ts`
- ✅ `home-page-hero-section-displays-correctly.spec.ts`
- ✅ `catalog-page-main-category-filter-works-correctly.spec.ts`
- ❌ `homePageTest.spec.ts` (wrong format)
- ❌ `test1.spec.ts` (not descriptive)

**Documentation Files**: `[TOPIC]_[DESCRIPTION].md` (UPPERCASE with underscores)

**Examples**:
- ✅ `DATA_TESTID_IMPLEMENTATION_GUIDE.md`
- ✅ `TEST_PLAN.md`
- ✅ `ENVIRONMENT_CONFIGURATION.md`

---

## 🧪 Test Structure Rules

### ⚠️ IMPORTANT: Test Creation Guide

**For creating new tests, refer to:** `TEST_CREATION_GUIDE.md` (single source of truth)

This guide includes:
- Complete file template
- Selector patterns
- Waiting patterns
- API verification
- Interaction patterns
- Error handling
- Complete examples

### 1. Test File Structure

**REQUIRED**: Use section comments for organization (NOT step executor)

**Why**: Cleaner, more readable, easier to maintain. Direct Playwright code with clear sections.

**Example**:
```typescript
// ============================================================================
// SETUP: Navigate to page
// ============================================================================
await navigateToHome(page);
await page.waitForLoadState('networkidle');

// ============================================================================
// SECTION 1: Page Load Verification
// ============================================================================
const heroSection = page.locator(TestSelectors.homeHeroSection);
await expect(heroSection).toBeVisible();
```

### 2. Test File Template

**REQUIRED Structure**:

```typescript
import { test, expect } from '@playwright/test';
import { navigateToHome } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
import { trackPageLoad, monitorAndCheckConsoleErrors } from '../../../utils';

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
 * Tags: @e2e, @public, @[area], @[feature], @desktop, @development, @staging, @production
 */
test.describe('[Test Suite Name]', () => {
  test('should [expected behavior]', {
    tag: ['@e2e', '@public', '@[area]', '@desktop', '@development', '@staging', '@production'],
  }, async ({ page }) => {
    // ============================================================================
    // SETUP: [Setup description]
    // ============================================================================
    await navigateToHome(page);
    await page.waitForLoadState('networkidle');

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

**See `TEST_CREATION_GUIDE.md` for complete template and examples.**

### 3. Test Organization

**REQUIRED**: Tests must be organized into clear sections:

1. **SETUP** - Navigation, initialization, performance tracking
2. **SECTION 1-N** - Main test sections (descriptive names)
3. **Cleanup** - Only if needed (most tests are read-only)

**Each section should have a clear, descriptive name**:
- ✅ `SECTION 1: Page Load and Performance Verification`
- ✅ `SECTION 2: Product Display Verification`
- ✅ `SECTION 3: Filter Functionality`
- ❌ `SECTION 1: Test stuff`
- ❌ `SECTION 2: More tests`

---

## 🎯 Selector Strategy

### Rule 1: Always Use data-testid (Primary)

**REQUIRED**: Use `data-testid` attributes as the primary selector method.

**Why**: Most stable, least likely to break with UI changes.

**How**:
```typescript
// ✅ CORRECT - Use TestSelectors utility
const heroSection = page.locator(TestSelectors.homeHeroSection);

// ✅ CORRECT - Direct data-testid (if not in utility yet)
const element = page.locator('[data-testid="home-hero-title"]');

// ❌ WRONG - Text-based selector (only as fallback)
const element = page.getByText('Some Text');
```

### Rule 2: Use TestSelectors Utility

**REQUIRED**: All selectors must be defined in `tests/utils/selectors.ts`

**Why**: Single source of truth, easy to update, consistent naming.

**How**:
```typescript
// In selectors.ts
export const TestSelectors = {
  homeHeroSection: '[data-testid="home-hero-section"]',
  homeHeroTitle: '[data-testid="home-hero-title"]',
  // ...
};

// In test file
import { TestSelectors } from '../../../utils/selectors';
const title = page.locator(TestSelectors.homeHeroTitle);
```

### Rule 3: NO Fallback Selectors - Use Only data-testid

**PROHIBITED**: Using `.or()` fallback selectors when `data-testid` exists.

**CRITICAL RULE**: **IF `data-testid` EXISTS, fallback is NOT necessary!**

```typescript
// ❌ PROHIBITED - Never use .or() when data-testid exists
const element = page.locator(TestSelectors.homeHeroTitle).or(
  page.locator('h1').first() // Fallback - REMOVE THIS
);

// ✅ REQUIRED - Use only data-testid selector
const element = page.locator(TestSelectors.homeHeroTitle);
```

**Why this rule exists:**
- `.or()` causes strict mode violations (matches multiple elements)
- Hides missing attributes instead of forcing us to add them
- Makes tests flaky and unpredictable
- Slower execution (evaluates multiple selectors)

**If test fails:**
1. Verify `data-testid` exists in web app
2. If missing, add it to the component
3. If exists, check selector spelling/typo
4. Never add `.or()` fallback as a workaround

### Rule 4: Avoid Text-Based Selectors

**AVOID**: Text-based selectors (`getByText()`, `getByRole()` with text) unless:
1. No `data-testid` exists AND
2. Text is unique AND
3. Text is unlikely to change

**Why**: Text changes frequently, causes test failures, not stable.

**Exception**: Role-based selectors for semantic elements (buttons, links) are acceptable:
```typescript
// ✅ ACCEPTABLE - Role-based for buttons
const button = page.getByRole('button', { name: /ver catálogo/i });

// ❌ AVOID - Text-based for content
const title = page.getByText('Artesanías en Cuero');
```

---

## 📝 data-testid Naming Conventions

### Rule 1: Naming Pattern

**REQUIRED Format**: `[area]-[component]-[element]`

**Examples**:
- ✅ `home-hero-section`
- ✅ `home-hero-title`
- ✅ `home-location-info-card-tienda-fisica`
- ✅ `catalog-product-card-0`
- ❌ `heroSection` (no hyphens)
- ❌ `home_hero_title` (underscores)
- ❌ `hero-title` (missing area prefix)

### Rule 2: Use kebab-case

**REQUIRED**: Always use lowercase with hyphens.

- ✅ `home-about-gmp-artisan-name`
- ❌ `homeAboutGmpArtisanName` (camelCase)
- ❌ `home_about_gmp_artisan_name` (snake_case)

### Rule 3: Be Descriptive

**REQUIRED**: Names must clearly describe the element.

- ✅ `home-location-ver-mapa-button` (clear what it is)
- ❌ `home-location-btn` (too generic)
- ❌ `home-location-button-1` (not descriptive)

### Rule 4: Indexed Elements

**REQUIRED**: Use index for repeated elements.

- ✅ `home-hero-slide-0`
- ✅ `home-hero-slide-1`
- ✅ `home-featured-product-card-0`
- ❌ `home-hero-slide-first` (use numbers)

---

## 🔧 Utility Usage Rules

### Navigation Utility

**REQUIRED**: Always use `navigateToHome()`, `navigateToCatalog()`, etc. from `navigation.ts`

**Why**: Centralized URL management, handles environment variables.

**Example**:
```typescript
import { navigateToHome, navigateToCatalog } from '../../../utils/navigation';

// ✅ CORRECT
await navigateToHome(page);

// ❌ WRONG
await page.goto('http://localhost:3000/gmp-web-app/');
```

### Step Executor Utility

**REQUIRED**: Use for all test steps.

**Options**:
- `step()` - Single step with logging
- `stepGroup()` - Group of related steps
- `options: { continueOnError: true }` - For non-critical checks

**Example**:
```typescript
await stepGroup('Step 1: Verification', [
  {
    name: 'Verify element is visible',
    action: async () => {
      await expect(element).toBeVisible();
    }
  },
  {
    name: 'Non-critical check',
    action: async () => {
      // May fail, but test continues
    },
    options: { continueOnError: true }
  }
]);
```

---

## 🎨 Code Style Rules

### Rule 1: TypeScript Strict Mode

**REQUIRED**: All code must be TypeScript with proper types.

**Example**:
```typescript
// ✅ CORRECT
const heroSection: Locator = page.locator(TestSelectors.homeHeroSection);

// ❌ WRONG
const heroSection = page.locator(TestSelectors.homeHeroSection); // Still OK, but prefer explicit types when helpful
```

### Rule 2: Async/Await

**REQUIRED**: Always use `async/await`, never use `.then()` chains.

**Example**:
```typescript
// ✅ CORRECT
const text = await element.textContent();

// ❌ WRONG
element.textContent().then(text => { /* ... */ });
```

### Rule 3: Error Handling

**REQUIRED**: Use `continueOnError` for non-critical checks.

**Example**:
```typescript
{
  name: 'Verify decorative elements (optional)',
  action: async () => {
    // This may not exist, but test should continue
  },
  options: { continueOnError: true }
}
```

### Rule 4: Comments

**REQUIRED**: Add comments for complex logic, timing, or non-obvious behavior.

**Example**:
```typescript
// Wait 5 seconds for carousel auto-advance (slides change every 5s)
await page.waitForTimeout(5000);

// Parallax effect applies transform on mouse move
const transform = await slide.evaluate((el) => el.style.transform);
```

---

## 🌍 Environment Configuration

### Rule 1: Use Environment Variables

**REQUIRED**: Never hardcode URLs. Use `BASE_URL` environment variable.

**How**:
```typescript
// ✅ CORRECT - Uses navigation.ts which reads BASE_URL
await navigateToHome(page);

// ❌ WRONG - Hardcoded URL
await page.goto('http://localhost:3000/gmp-web-app/');
```

### Rule 2: Environment-Specific Scripts

**REQUIRED**: Use npm scripts for different environments.

**Available Scripts**:
- `npm run test:local` - Test against local server
- `npm run test:production` - Test against production
- `npm run test:local:ui` - Test with Playwright UI mode (local)
- `npm run test:production:ui` - Test with Playwright UI mode (production)

---

## 📈 Test Reporting

### Playwright HTML and JSON

The project uses the default **Playwright HTML** report and a **JSON** reporter (`playwright-report/results.json`) for each run. The HTML report is uploaded as an artifact in CI; the JSON report is used to push run results to Notion.

### Notion (Test Runs)

UI regression runs are reported to **Notion** via a "Test Runs" database. Each run creates one row (Run date, Run name, Environment, Passed, Failed, Duration, Status, Artifact link). The run page content order is:

- **Regression summary** (optional): brief AI-generated summary of failures when enabled (see below).
- **Failed tests** (first): one by one, each with a heading and the error in a **quote** block (`>`), without attachment paths.
- **Passed**: one **table** with columns Test, Duration, Status.

**Optional AI summary**: If there are failures, the script can call a free AI API to generate a short regression summary (2–4 sentences). Set `AI_SUMMARY_ENABLED=1` and one of:
- **Groq** (free, no credit card): add secret `GROQ_API_KEY` (get key at https://console.groq.com/keys).
- **Google Gemini** (free tier): add secret `GEMINI_API_KEY` (get key at https://aistudio.google.com/apikey).

**CI**: After "Run Playwright tests", the workflow runs `scripts/notion-report-run.js` (with `if: always()` so failed runs are still reported). Required GitHub Secrets: `NOTION_API_KEY`, `NOTION_DATABASE_ID`. Optional: `GROQ_API_KEY` or `GEMINI_API_KEY`, and set `AI_SUMMARY_ENABLED=1` in the workflow env to enable the AI summary. The script also needs `ENVIRONMENT` and `ARTIFACT_URL` (set by the workflow).

**One-time setup**: Create a Notion page (e.g. "GMP UI Test Reports"), add a database "Test Runs" with properties: Run date (Date), Run name (Title), Environment (Select: develop | production), Passed (Number), Failed (Number), Duration (Number), Status (Select: Pass | Fail | Partial), Artifact link (URL). Share the database with your Notion integration and add the integration token and database ID as repo secrets. Add a **Calendar** view on "Run date" to see runs by day.

**Local**: To test the script locally, run tests first so `playwright-report/results.json` exists, then set `NOTION_API_KEY`, `NOTION_DATABASE_ID`, and optionally `ENVIRONMENT`, `ARTIFACT_URL`, `RUN_NAME`, and run: `node scripts/notion-report-run.js [--report=path]`.

---

## 📊 Test Categories and Tags

### Test Categories

1. **Smoke Tests** (`tests/smoke/`)
   - Basic heartbeat tests
   - Quick validation
   - Tags: `@smoke`

2. **E2E Tests** (`tests/e2e/`)
   - Comprehensive tests
   - Full user flows
   - Tags: `@e2e`

### Required Tags

**Every test must include**:
- `@e2e` or `@smoke` (test category)
- `@public` or `@admin` (access level)
- `@desktop` (viewport - mobile in separate phase)
- `@[area]` (e.g., `@homepage`, `@catalog`)
- `@development`, `@staging`, `@production` (environments)

**Example**:
```typescript
test('should load home page', {
  tag: ['@e2e', '@public', '@homepage', '@desktop', '@development', '@staging', '@production'],
}, async ({ page }) => {
  // ...
});
```

---

## 🚫 Anti-Patterns (What NOT to Do)

### ❌ Don't Use Hardcoded URLs
```typescript
// ❌ WRONG
await page.goto('http://localhost:3000/gmp-web-app/');

// ✅ CORRECT
await navigateToHome(page);
```

### ❌ Don't Use Text Selectors as Primary
```typescript
// ❌ WRONG
const title = page.getByText('Artesanías en Cuero');

// ✅ CORRECT
const title = page.locator(TestSelectors.homeHeroTitle);
```

### ❌ Don't Skip Step Executor
```typescript
// ❌ WRONG
await expect(element).toBeVisible();

// ✅ CORRECT
await step('Verify element is visible', async () => {
  await expect(element).toBeVisible();
});
```

### ❌ Don't Create Tests Without data-testid Analysis
```typescript
// ❌ WRONG - Start writing test without checking what selectors are needed

// ✅ CORRECT - First analyze component, list required data-testid attributes, then write test
```

### ❌ Don't Use Generic Test Names
```typescript
// ❌ WRONG
test('test 1', async ({ page }) => { });

// ✅ CORRECT
test('should load home page and display all sections correctly', async ({ page }) => { });
```

---

## 📋 Test Implementation Checklist

### Before Writing a Test

- [ ] Read the QA ticket/requirements document
- [ ] Analyze the component(s) to be tested
- [ ] List all required `data-testid` attributes
- [ ] Create `DATA_TESTID_*` analysis document
- [ ] Check `selectors.ts` for existing selectors
- [ ] Plan test structure (step groups)

### While Writing a Test

- [ ] Use step executor pattern
- [ ] Use TestSelectors utility
- [ ] Add proper tags
- [ ] Add descriptive step names
- [ ] Use navigation helpers
- [ ] Add comments for complex logic
- [ ] Handle errors appropriately

### After Writing a Test

- [ ] Run test locally: `npm run test:local:ui`
- [ ] Verify all steps execute correctly
- [ ] Check test execution time (should match estimate)
- [ ] Update `selectors.ts` with new selectors
- [ ] Document missing `data-testid` attributes
- [ ] Update test plan if needed

---

## 🔍 data-testid Implementation Process

### Step 1: Analysis

**REQUIRED**: Before implementing a test, analyze the component and create a `DATA_TESTID_*` document.

**Document should include**:
- List of all required attributes
- Exact file locations and line numbers
- Before/after code examples
- Test usage examples
- Priority classification (P1, P2, P3)

### Step 2: Implementation Guide

**REQUIRED**: Create an implementation guide with:
- Step-by-step instructions
- Find/replace code snippets
- Verification checklist

### Step 3: Quick Reference

**OPTIONAL**: Create a quick reference checklist for easy tracking.

### Step 4: Update Selectors

**REQUIRED**: Add all new selectors to `tests/utils/selectors.ts`

### Step 5: Implementation

**REQUIRED**: Another agent/developer adds `data-testid` attributes to application components.

### Step 6: Test Update

**REQUIRED**: Update test to use new selectors (remove fallbacks).

---

## 🎯 Test Scope Rules

### Load/Display Tests

**Focus**: Verify content loads and displays correctly.

**DO**:
- ✅ Verify elements are visible
- ✅ Verify text content
- ✅ Verify images load
- ✅ Verify sections render
- ✅ Verify performance

**DON'T**:
- ❌ Test interactions (button clicks, modals)
- ❌ Test navigation flows
- ❌ Test form submissions

**Example**: `home-page-loads-and-displays-correctly.spec.ts`

### Interaction Tests

**Focus**: Verify user interactions work correctly.

**DO**:
- ✅ Test button clicks
- ✅ Test hover effects
- ✅ Test modal open/close
- ✅ Test navigation
- ✅ Test form interactions

**DON'T**:
- ❌ Test content loading (separate test)
- ❌ Test data validation (separate test)

**Example**: `home-page-hero-section-displays-correctly.spec.ts` (includes interactions)

---

## ⏱️ Timing and Performance

### Rule 1: Use Appropriate Waits

**REQUIRED**: Use proper wait strategies, not arbitrary timeouts.

**Preferred Order**:
1. `expect().toBeVisible()` (auto-waits)
2. `page.waitForLoadState('networkidle')`
3. `page.waitForTimeout()` (only when necessary)

**Example**:
```typescript
// ✅ CORRECT - Auto-wait
await expect(element).toBeVisible();

// ✅ CORRECT - Wait for network
await page.waitForLoadState('networkidle');

// ⚠️ ACCEPTABLE - Fixed timing (carousel, animations)
await page.waitForTimeout(5000); // Carousel advances every 5s
```

### Rule 2: Performance Checks

**REQUIRED**: Include performance checks in load tests.

**Example**:
```typescript
const loadTime = pageLoadEndTime - pageLoadStartTime;
if (loadTime > 5000) {
  throw new Error(`Page load time (${loadTime}ms) is too slow`);
}
```

---

## 🐛 Error Handling Best Practices

### Rule 1: Critical vs Non-Critical

**REQUIRED**: Distinguish between critical and non-critical checks.

**Critical** (test should fail):
- Main functionality
- Core user flows
- Data integrity

**Non-Critical** (use `continueOnError`):
- Decorative elements
- Optional features
- Nice-to-have validations

**Example**:
```typescript
{
  name: 'Verify hero section is visible', // CRITICAL
  action: async () => {
    await expect(heroSection).toBeVisible();
  }
},
{
  name: 'Verify decorative elements', // NON-CRITICAL
  action: async () => {
    // May not exist
  },
  options: { continueOnError: true }
}
```

### Rule 2: Error Messages

**REQUIRED**: Provide clear, actionable error messages.

**Example**:
```typescript
// ✅ CORRECT - Clear error message
throw new Error(`Hero section height (${heroHeight}px) is less than expected minimum (${minHeight}px)`);

// ❌ WRONG - Vague error
throw new Error('Hero section failed');
```

---

## 📚 Documentation Requirements

### Rule 1: Test Documentation

**REQUIRED**: Every test file must have:
- File header with description
- Based on QA ticket reference
- Test strategy summary
- Estimated execution time
- Tags list

### Rule 2: Analysis Documents

**REQUIRED**: Before implementing tests, create:
- `DATA_TESTID_*` analysis document
- Implementation guide
- Quick reference (optional)

### Rule 3: Update Test Plan

**REQUIRED**: Update `TEST_PLAN.md` when adding new test categories or changing structure.

---

## 🔄 Version Control Rules

### Rule 1: Commit Messages

**REQUIRED Format**: `[type]: [description]`

**Types**:
- `test:` - New test or test changes
- `feat:` - New feature/utility
- `fix:` - Bug fix
- `docs:` - Documentation updates
- `refactor:` - Code refactoring

**Examples**:
- ✅ `test: add hero section carousel test`
- ✅ `feat: add step executor utility`
- ✅ `fix: correct selector for location address`
- ✅ `docs: update test plan with new test structure`

### Rule 2: Branch Naming

**REQUIRED Format**: `[type]/[description]`

**Examples**:
- ✅ `test/hero-section-carousel`
- ✅ `feat/step-executor-utility`
- ✅ `fix/location-selector`

---

## 🎓 Learning Resources

### Key Documents to Read

1. **TEST_PLAN.md** - Overall test strategy and phases
2. **ROUTE_ANALYSIS.md** - Application routes and user flows
3. **ENVIRONMENT_CONFIGURATION.md** - How to run tests
4. **DATA_TESTID_IMPLEMENTATION_GUIDE.md** - How to add data-testid attributes

### Reference Examples

- `home-page-loads-and-displays-correctly.spec.ts` - Load/display test example
- `home-page-hero-section-displays-correctly.spec.ts` - Interaction test example
- `step-executor.ts` - Step executor pattern example
- `navigation.ts` - Navigation helper example

---

## ✅ Quality Checklist

Before submitting/merging code:

- [ ] All tests use step executor pattern
- [ ] All selectors use TestSelectors utility
- [ ] All navigation uses navigation helpers
- [ ] All tests have proper tags
- [ ] All tests have file headers with description
- [ ] All error messages are clear and actionable
- [ ] All timing uses appropriate wait strategies
- [ ] All data-testid attributes are documented
- [ ] All new selectors added to selectors.ts
- [ ] Tests run successfully locally
- [ ] Test execution time matches estimate
- [ ] No hardcoded URLs
- [ ] No text-based selectors (unless fallback)
- [ ] Code follows TypeScript best practices
- [ ] Comments added for complex logic

---

## 🚀 Quick Start for New Contributors

1. **Read this document** (you're doing it!)
2. **Read TEST_PLAN.md** - Understand overall strategy
3. **Read example tests** - See patterns in action
4. **Set up environment** - Follow ENVIRONMENT_CONFIGURATION.md
5. **Run existing tests** - `npm run test:local:ui`
6. **Start with a simple test** - Follow the checklist above

---

## 📞 Questions?

If you're unsure about:
- **Selector strategy** → Check `selectors.ts` and existing tests
- **Test structure** → Check example tests
- **data-testid naming** → Check `DATA_TESTID_IMPLEMENTATION_GUIDE.md`
- **Environment setup** → Check `ENVIRONMENT_CONFIGURATION.md`
- **Test plan** → Check `TEST_PLAN.md`

---

**Last Updated**: [Current Date]  
**Version**: 1.0  
**Maintained By**: GMP UI Test Team

