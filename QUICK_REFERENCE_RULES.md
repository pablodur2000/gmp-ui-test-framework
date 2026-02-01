# Quick Reference - Project Rules

## 🚀 Quick Rules Checklist

### Before Writing Any Test

- [ ] Read QA ticket/requirements
- [ ] Analyze component(s) → Create `DATA_TESTID_*` analysis
- [ ] List all required `data-testid` attributes
- [ ] Create implementation guide
- [ ] Check `selectors.ts` for existing selectors

### Test File Structure

```typescript
import { step, stepGroup } from '../../../utils/step-executor';
import { navigateToHome } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';

/**
 * [Description]
 * Based on: [QA_TICKET].md
 * Tags: @e2e, @public, @[area], @desktop
 */
test.describe('[Suite]', () => {
  test('should [behavior]', {
    tag: ['@e2e', '@public', '@[area]', '@desktop'],
  }, async ({ page }) => {
    await stepGroup('Step 1: [What]', [
      {
        name: 'Verify [element]',
        action: async () => {
          const element = page.locator(TestSelectors.xxx);
          await expect(element).toBeVisible();
        }
      }
    ]);
  });
});
```

### Selector Rules

1. ✅ **Primary**: `page.locator(TestSelectors.xxx)`
2. ✅ **Fallback**: `.or(page.locator('fallback'))` (temporary)
3. ❌ **Avoid**: `page.getByText()` (unless unique/stable)

### Naming Conventions

- **Test files**: `[area]-[feature]-[action]-[expected-result].spec.ts`
- **data-testid**: `[area]-[component]-[element]` (kebab-case)
- **Examples**: 
  - `home-page-loads-and-displays-correctly.spec.ts`
  - `home-hero-title`

### Required Imports

```typescript
import { test, expect } from '@playwright/test';
import { step, stepGroup } from '../../../utils/step-executor';
import { navigateToHome } from '../../../utils/navigation';
import { TestSelectors } from '../../../utils/selectors';
```

### Navigation Rules

- ✅ `await navigateToHome(page)`
- ❌ `await page.goto('http://localhost...')`

### Error Handling

```typescript
{
  name: 'Non-critical check',
  action: async () => { /* ... */ },
  options: { continueOnError: true }
}
```

### Tags (Required)

```typescript
tag: ['@e2e', '@public', '@homepage', '@desktop', '@development', '@staging', '@production']
```

---

**See `PROJECT_RULES_AND_GUIDELINES.md` for complete rules!**

