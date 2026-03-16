# Test Utilities

This directory contains reusable utilities for writing maintainable, well-structured tests.

## Available Utilities

- **Navigation Helpers** (`navigation.ts`) - Centralized navigation functions
- **Selectors** (`selectors.ts`) - Centralized test selectors using data-testid
- **Console Monitoring** (`console-monitor.ts`) - Monitor and check console errors
- **Performance Tracking** (`performance-tracker.ts`) - Track page load times and redirects
- **API Listeners** (`api-listener.ts`) - Listen for API responses
- **API Verification** (`api-verification.ts`) - Verify API responses and content
- **Image Verification** (`image-verification.ts`) - Verify images load correctly
- **Wait Helpers** (`wait-helpers.ts`) - Wait for animations, scrolls, elements
- **Catalog Helpers** (`catalog-helpers.ts`) - Catalog-specific helper functions
- **Supabase Cleanup** (`supabase-cleanup.ts`) - Cleanup test data from Supabase

## Test Structure Pattern

All tests use **section comments** for organization:

```typescript
// ============================================================================
// SETUP: [Description]
// ============================================================================

// ============================================================================
// SECTION 1: [Description]
// ============================================================================

// ============================================================================
// SECTION 2: [Description]
// ============================================================================
```

This pattern provides clear organization without requiring additional utilities.
