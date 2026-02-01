# Test Utilities

This directory contains reusable utilities for writing maintainable, well-structured tests.

## Step Executor

The `step-executor` utility provides structured test step execution with clear error handling, logging, and support for auto-documentation.

### Why Use Step Executor?

1. **Clear Error Messages**: Know exactly which step failed
2. **Better Debugging**: Step-by-step logging shows test progress
3. **Auto-Documentation**: Structured steps can be parsed for documentation
4. **Consistent Error Handling**: All steps use the same error handling pattern
5. **Retry Logic**: Built-in retry support for flaky operations
6. **Timeout Control**: Per-step timeout configuration

### Basic Usage

```typescript
import { step } from '../utils/step-executor';

test('my test', async ({ page }) => {
  await step('Navigate to home page', async () => {
    await page.goto('/');
  });

  await step('Verify page title', async () => {
    await expect(page).toHaveTitle(/GMP/i);
  });
});
```

### Step Groups

Organize related steps into groups for better structure:

```typescript
import { stepGroup } from '../utils/step-executor';

await stepGroup('Navigation Setup', [
  {
    name: 'Navigate to home',
    action: async () => await page.goto('/')
  },
  {
    name: 'Wait for load',
    action: async () => await page.waitForLoadState('networkidle')
  }
]);
```

### Step Options

```typescript
await step('Step with options', async () => {
  // Your action
}, {
  continueOnError: false,  // Don't continue if this step fails
  retry: true,             // Retry on failure
  maxRetries: 3,           // Maximum retry attempts
  timeout: 5000,           // Step-specific timeout (ms)
  context: {               // Additional context for logging
    url: '/catalogo',
    expectedCount: 10
  }
});
```

### Multiple Steps

Execute multiple steps in sequence:

```typescript
import { steps } from '../utils/step-executor';

await steps([
  { name: 'Step 1', action: async () => { /* ... */ } },
  { name: 'Step 2', action: async () => { /* ... */ } },
  { name: 'Step 3', action: async () => { /* ... */ } }
]);
```

### Console Output

The step executor provides clear console output:

```
🔹 Step: Navigate to home page
✅ Step completed: Navigate to home page (234ms)

📦 Step Group: Navigation Setup
   Steps: 2
🔹 Step: Navigation Setup > Navigate to home
✅ Step completed: Navigation Setup > Navigate to home (156ms)
🔹 Step: Navigation Setup > Wait for load
✅ Step completed: Navigation Setup > Wait for load (1234ms)
✅ Step Group completed: Navigation Setup
```

### Error Handling

When a step fails, you get clear error information:

```
🔹 Step: Verify catalog link
❌ Step failed: Verify catalog link (456ms)
   Error: Locator not found: getByRole('link', { name: /catálogo/i })
   Stack: ...
```

### Auto-Documentation Support

The step executor includes utilities for extracting step information for documentation:

```typescript
import { extractStepsForDocumentation } from '../utils/step-executor';

const testFileContent = fs.readFileSync('test.spec.ts', 'utf-8');
const steps = extractStepsForDocumentation(testFileContent);
// Returns: [{ stepName: 'Navigate to home', lineNumber: 15 }, ...]
```

This can be used by documentation generators to automatically create test documentation from the structured steps.

### Best Practices

1. **Use descriptive step names**: Step names should clearly describe what the step does
   - ✅ Good: "Navigate to catalog page and wait for products to load"
   - ❌ Bad: "Go to page"

2. **Group related steps**: Use `stepGroup` for logical groupings
   ```typescript
   await stepGroup('Product Creation Flow', [
     { name: 'Open product form', action: ... },
     { name: 'Fill product details', action: ... },
     { name: 'Submit form', action: ... }
   ]);
   ```

3. **Use context for debugging**: Add context when steps might need additional info
   ```typescript
   await step('Search for product', async () => {
     await page.fill('#search', searchTerm);
   }, {
     context: { searchTerm: 'Billetera' }
   });
   ```

4. **Use retry for flaky operations**: Network requests, API calls, etc.
   ```typescript
   await step('Wait for API response', async () => {
     await page.waitForResponse(/\/api\/products/);
   }, {
     retry: true,
     maxRetries: 3
   });
   ```

5. **Use continueOnError sparingly**: Only for non-critical checks
   ```typescript
   await step('Check for console warnings', async () => {
     // Non-critical check
   }, {
     continueOnError: true
   });
   ```

### Example: Complete Test with Steps

```typescript
import { test, expect } from '@playwright/test';
import { step, stepGroup } from '../utils/step-executor';

test('product catalog loads correctly', async ({ page }) => {
  await stepGroup('Navigate to Catalog', [
    {
      name: 'Navigate to home page',
      action: async () => await page.goto('/')
    },
    {
      name: 'Click catalog link',
      action: async () => {
        const link = page.getByRole('link', { name: /catálogo/i });
        await link.click();
      }
    },
    {
      name: 'Wait for catalog page to load',
      action: async () => {
        await page.waitForLoadState('networkidle');
      }
    }
  ]);

  await stepGroup('Verify Catalog Content', [
    {
      name: 'Verify catalog heading is visible',
      action: async () => {
        const heading = page.getByRole('heading', { name: /catálogo/i });
        await expect(heading).toBeVisible();
      }
    },
    {
      name: 'Verify products are displayed',
      action: async () => {
        const products = page.locator('[data-testid="product-card"]');
        await expect(products.first()).toBeVisible();
      }
    }
  ]);
});
```

