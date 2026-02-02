# GMP Web App - Comprehensive E2E Test Plan

## Application Analysis Summary

### Routes Identified
- `/` - HomePage (public)
- `/catalogo` - CatalogPage (public)
- `/producto/:id` - ProductDetailPage (public)
- `/admin/login` - AdminLoginPage (protected)
- `/admin/dashboard` - AdminDashboardPage (protected, requires auth)

### Critical User Flows

#### Public User Flows
1. **Home Page Browsing**
   - View hero section
   - View featured products
   - View location information
   - Open map modal
   - Navigate to catalog

2. **Catalog Browsing**
   - View all products
   - Filter by main category (Cuero/Macramé)
   - Filter by subcategory
   - Filter by inventory status
   - Search products
   - Switch view mode (grid/list)
   - Navigate to product detail

3. **Product Detail**
   - View product information
   - View product images
   - Switch between images
   - Navigate back to catalog

#### Admin User Flows
1. **Admin Authentication**
   - Login with valid credentials
   - Login with invalid credentials
   - Login with non-admin user (should fail)
   - View error messages

2. **Admin Dashboard - Product Management**
   - View product count
   - Create new product
   - Edit existing product
   - Delete product
   - Search products
   - View product catalog

3. **Admin Dashboard - Sales Management**
   - View sales list
   - Search sales by customer name
   - Update sale status (pendiente/en_proceso/completado/cancelado)
   - View sale details

4. **Admin Dashboard - Activity Logs**
   - View recent activity
   - Search activity by resource name or email
   - Filter activity by action type (CREATE/UPDATE/DELETE)
   - Delete activity log

### Key Components to Test
- Header/Navigation (desktop & mobile)
- SearchBar
- CategoryFilter
- ProductCard
- ProductForm
- ProductEditForm
- DeleteConfirmationModal
- Map Modal (on home page)

---

## Recommended Test Folder Structure

```
tests/
├── e2e/
│   ├── public/
│   │   ├── home-page/
│   │   │   ├── home-page-loads-and-displays-correctly.spec.ts
│   │   │   ├── home-page-hero-section-displays-correctly.spec.ts
│   │   │   ├── home-page-featured-products-section-displays-correctly.spec.ts
│   │   │   ├── home-page-location-section-displays-correctly.spec.ts
│   │   │   ├── home-page-map-modal-opens-and-closes-correctly.spec.ts
│   │   │   └── home-page-navigation-to-catalog-works-correctly.spec.ts
│   │   │
│   │   ├── catalog-page/
│   │   │   ├── catalog-page-loads-and-displays-all-products.spec.ts
│   │   │   ├── catalog-page-main-category-filter-works-correctly.spec.ts
│   │   │   ├── catalog-page-subcategory-filter-works-correctly.spec.ts
│   │   │   ├── catalog-page-inventory-status-filter-works-correctly.spec.ts
│   │   │   ├── catalog-page-search-functionality-works-correctly.spec.ts
│   │   │   ├── catalog-page-view-mode-switch-works-correctly.spec.ts
│   │   │   ├── catalog-page-product-count-displays-correctly.spec.ts
│   │   │   └── catalog-page-navigation-to-product-detail-works-correctly.spec.ts
│   │   │
│   │   ├── product-detail-page/
│   │   │   ├── product-detail-page-loads-and-displays-product-information.spec.ts
│   │   │   ├── product-detail-page-image-gallery-works-correctly.spec.ts
│   │   │   ├── product-detail-page-breadcrumb-navigation-works-correctly.spec.ts
│   │   │   └── product-detail-page-back-to-catalog-navigation-works-correctly.spec.ts
│   │   │
│   │   └── navigation/
│   │       ├── header-navigation-links-work-correctly.spec.ts
│   │       ├── header-catalog-dropdown-menu-works-correctly.spec.ts
│   │       ├── header-mobile-menu-opens-and-closes-correctly.spec.ts
│   │       └── header-logo-navigation-works-correctly.spec.ts
│   │
│   └── admin/
│       ├── authentication/
│       │   ├── admin-login-with-valid-credentials-works-correctly.spec.ts
│       │   ├── admin-login-with-invalid-credentials-shows-error.spec.ts
│       │   ├── admin-login-with-non-admin-user-shows-access-denied-error.spec.ts
│       │   └── admin-login-password-visibility-toggle-works-correctly.spec.ts
│       │
│       ├── dashboard/
│       │   ├── admin-dashboard-loads-and-displays-correctly.spec.ts
│       │   ├── admin-dashboard-product-count-displays-correctly.spec.ts
│       │   ├── admin-dashboard-sign-out-works-correctly.spec.ts
│       │   └── admin-dashboard-unauthorized-access-redirects-to-login.spec.ts
│       │
│       ├── product-management/
│       │   ├── admin-dashboard-create-new-product-works-correctly.spec.ts
│       │   ├── admin-dashboard-edit-existing-product-works-correctly.spec.ts
│       │   ├── admin-dashboard-delete-product-works-correctly.spec.ts
│       │   ├── admin-dashboard-delete-product-confirmation-modal-works-correctly.spec.ts
│       │   ├── admin-dashboard-product-search-works-correctly.spec.ts
│       │   ├── admin-dashboard-view-products-catalog-works-correctly.spec.ts
│       │   └── admin-dashboard-product-form-validation-works-correctly.spec.ts
│       │
│       ├── sales-management/
│       │   ├── admin-dashboard-view-sales-list-works-correctly.spec.ts
│       │   ├── admin-dashboard-search-sales-by-customer-name-works-correctly.spec.ts
│       │   ├── admin-dashboard-update-sale-status-to-pendiente-works-correctly.spec.ts
│       │   ├── admin-dashboard-update-sale-status-to-en-proceso-works-correctly.spec.ts
│       │   ├── admin-dashboard-update-sale-status-to-completado-works-correctly.spec.ts
│       │   └── admin-dashboard-update-sale-status-to-cancelado-works-correctly.spec.ts
│       │
│       └── activity-logs/
│           ├── admin-dashboard-view-recent-activity-works-correctly.spec.ts
│           ├── admin-dashboard-search-activity-by-resource-name-works-correctly.spec.ts
│           ├── admin-dashboard-search-activity-by-email-works-correctly.spec.ts
│           ├── admin-dashboard-filter-activity-by-create-action-works-correctly.spec.ts
│           ├── admin-dashboard-filter-activity-by-update-action-works-correctly.spec.ts
│           ├── admin-dashboard-filter-activity-by-delete-action-works-correctly.spec.ts
│           └── admin-dashboard-delete-activity-log-works-correctly.spec.ts
│
├── smoke/
│   ├── critical-public-paths-load-correctly.spec.ts
│   ├── critical-admin-paths-require-authentication.spec.ts
│   └── critical-navigation-elements-work-correctly.spec.ts
│
└── integration/
    ├── complete-product-browsing-flow-from-home-to-detail.spec.ts
    ├── complete-admin-product-management-flow-create-edit-delete.spec.ts
    └── complete-admin-sales-management-flow-view-and-update-status.spec.ts
```

---

## Implementation Order (Priority-Based)

### Phase 1: Foundation Tests (Week 1)
**Goal:** Establish basic test infrastructure and verify critical paths work

1. **Smoke Tests** (Start here - fastest feedback)
   - `smoke/critical-public-paths-load-correctly.spec.ts`
   - `smoke/critical-admin-paths-require-authentication.spec.ts`
   - `smoke/critical-navigation-elements-work-correctly.spec.ts`

2. **Public - Home Page** (Simple, no auth needed)
   - `e2e/public/home-page/home-page-loads-and-displays-correctly.spec.ts`
   - `e2e/public/home-page/home-page-hero-section-displays-correctly.spec.ts`
   - `e2e/public/home-page/home-page-navigation-to-catalog-works-correctly.spec.ts`

3. **Public - Navigation** (Core functionality)
   - `e2e/public/navigation/header-navigation-links-work-correctly.spec.ts`
   - `e2e/public/navigation/header-logo-navigation-works-correctly.spec.ts`

### Phase 2: Public Catalog Tests (Week 2)
**Goal:** Test product browsing and filtering

1. **Catalog Basic**
   - `e2e/public/catalog-page/catalog-page-loads-and-displays-all-products.spec.ts`
   - `e2e/public/catalog-page/catalog-page-product-count-displays-correctly.spec.ts`

2. **Catalog Filtering**
   - `e2e/public/catalog-page/catalog-page-main-category-filter-works-correctly.spec.ts`
   - `e2e/public/catalog-page/catalog-page-subcategory-filter-works-correctly.spec.ts`
   - `e2e/public/catalog-page/catalog-page-inventory-status-filter-works-correctly.spec.ts`

3. **Catalog Search & View**
   - `e2e/public/catalog-page/catalog-page-search-functionality-works-correctly.spec.ts`
   - `e2e/public/catalog-page/catalog-page-view-mode-switch-works-correctly.spec.ts`

4. **Product Detail**
   - `e2e/public/product-detail-page/product-detail-page-loads-and-displays-product-information.spec.ts`
   - `e2e/public/product-detail-page/product-detail-page-image-gallery-works-correctly.spec.ts`

### Phase 3: Admin Authentication Tests (Week 3)
**Goal:** Test admin login and access control

1. **Admin Login**
   - `e2e/admin/authentication/admin-login-with-valid-credentials-works-correctly.spec.ts`
   - `e2e/admin/authentication/admin-login-with-invalid-credentials-shows-error.spec.ts`
   - `e2e/admin/authentication/admin-login-with-non-admin-user-shows-access-denied-error.spec.ts`

2. **Admin Dashboard Access**
   - `e2e/admin/dashboard/admin-dashboard-loads-and-displays-correctly.spec.ts`
   - `e2e/admin/dashboard/admin-dashboard-unauthorized-access-redirects-to-login.spec.ts`

### Phase 4: Admin Product Management (Week 4)
**Goal:** Test CRUD operations for products

1. **Product Creation**
   - `e2e/admin/product-management/admin-dashboard-create-new-product-works-correctly.spec.ts`

2. **Product Viewing**
   - `e2e/admin/product-management/admin-dashboard-view-products-catalog-works-correctly.spec.ts`
   - `e2e/admin/product-management/admin-dashboard-product-search-works-correctly.spec.ts`

3. **Product Editing**
   - `e2e/admin/product-management/admin-dashboard-edit-existing-product-works-correctly.spec.ts`

4. **Product Deletion**
   - `e2e/admin/product-management/admin-dashboard-delete-product-confirmation-modal-works-correctly.spec.ts`
   - `e2e/admin/product-management/admin-dashboard-delete-product-works-correctly.spec.ts`

### Phase 5: Admin Sales & Activity (Week 5)
**Goal:** Test sales and activity log management

1. **Sales Management**
   - `e2e/admin/sales-management/admin-dashboard-view-sales-list-works-correctly.spec.ts`
   - `e2e/admin/sales-management/admin-dashboard-search-sales-by-customer-name-works-correctly.spec.ts`
   - `e2e/admin/sales-management/admin-dashboard-update-sale-status-to-completado-works-correctly.spec.ts`

2. **Activity Logs**
   - `e2e/admin/activity-logs/admin-dashboard-view-recent-activity-works-correctly.spec.ts`
   - `e2e/admin/activity-logs/admin-dashboard-filter-activity-by-create-action-works-correctly.spec.ts`
   - `e2e/admin/activity-logs/admin-dashboard-delete-activity-log-works-correctly.spec.ts`

### Phase 6: Integration Tests (Week 6)
**Goal:** Test complete user flows end-to-end

1. **Public Flow**
   - `integration/complete-product-browsing-flow-from-home-to-detail.spec.ts`

2. **Admin Flow**
   - `integration/complete-admin-product-management-flow-create-edit-delete.spec.ts`
   - `integration/complete-admin-sales-management-flow-view-and-update-status.spec.ts`

---

## Test File Naming Convention

### Pattern
`[area]-[feature]-[action/behavior]-[expected-result].spec.ts`

### Examples with Explanations

1. **`home-page-loads-and-displays-correctly.spec.ts`**
   - **Area:** `home-page`
   - **Feature:** Page load
   - **Action:** Loads and displays
   - **Expected:** Correctly
   - **Tests:** Page loads, all main sections visible, no errors

2. **`catalog-page-main-category-filter-works-correctly.spec.ts`**
   - **Area:** `catalog-page`
   - **Feature:** Main category filter
   - **Action:** Works
   - **Expected:** Correctly
   - **Tests:** Filter buttons work, products filter correctly, counts update

3. **`admin-dashboard-create-new-product-works-correctly.spec.ts`**
   - **Area:** `admin-dashboard`
   - **Feature:** Create new product
   - **Action:** Works
   - **Expected:** Correctly
   - **Tests:** Form opens, fields work, submission succeeds, product appears in list

4. **`admin-login-with-invalid-credentials-shows-error.spec.ts`**
   - **Area:** `admin-login`
   - **Feature:** Invalid credentials
   - **Action:** Shows error
   - **Expected:** Error message displayed
   - **Tests:** Error message appears, user not logged in, stays on login page

---

## Critical Information Captured

### Routes & URLs
- Base path: `/gmp-web-app` (from BrowserRouter basename)
- Public routes: `/`, `/catalogo`, `/producto/:id`
- Admin routes: `/admin/login`, `/admin/dashboard`

### Authentication
- Uses Supabase Auth (`supabase.auth.signInWithPassword`)
- Requires admin_users table check
- Redirects to `/admin/login` if not authenticated

### Key Selectors (to be identified during test writing)
- Navigation elements
- Form fields
- Buttons and actions
- Product cards
- Modal dialogs

### Data Requirements
- Test admin user credentials (need to be configured)
- Test products (can be created via admin)
- Test categories (from database)
- Test sales (from database)

### Key Interactions
- Form submissions
- Modal open/close
- Dropdown menus
- Search with debounce (500ms)
- Status updates
- Delete confirmations

---

---

## CI/CD Pipeline Strategy

### Overview
Based on reference project analysis, the CI/CD pipeline will support:
- **Parallel test execution** via sharding
- **Multiple environments** (development, staging, production)
- **Test tagging** for selective execution
- **Artifact management** (reports, videos, screenshots)
- **Result reporting** (JUnit XML, HTML reports)
- **Notification system** (Slack integration)

### Test Tagging Strategy

Tests should be tagged to enable selective execution in CI/CD:

#### Tag Categories

1. **Environment Tags**
   - `@development` - Safe to run in development
   - `@staging` - Safe to run in staging
   - `@production` - Safe to run in production

2. **Test Type Tags**
   - `@smoke` - Critical path tests (fast, essential)
   - `@regression` - Full regression suite
   - `@integration` - End-to-end integration tests

3. **Feature Tags**
   - `@public` - Public-facing features
   - `@admin` - Admin features
   - `@authentication` - Auth-related tests
   - `@product-management` - Product CRUD operations
   - `@sales-management` - Sales operations
   - `@activity-logs` - Activity log features

4. **Stability Tags**
   - `@stable` - Stable, reliable tests
   - `@flaky` - Known flaky tests (to be fixed)

#### Tag Usage Examples

```typescript
// Smoke test - runs in all environments
test('critical path test', { 
  tag: ['@smoke', '@development', '@staging', '@production'] 
}, async ({ page }) => {
  // Test code
});

// Admin test - only development and staging
test('admin product creation', { 
  tag: ['@admin', '@product-management', '@development', '@staging'] 
}, async ({ page }) => {
  // Test code
});

// Full regression - all environments
test('complete product flow', { 
  tag: ['@regression', '@integration', '@development', '@staging', '@production'] 
}, async ({ page }) => {
  // Test code
});
```

### Test Sharding Strategy

**Recommended:** 4 shards for parallel execution

- **Shard 1/4:** Public routes (home, catalog, product detail)
- **Shard 2/4:** Admin authentication + dashboard
- **Shard 3/4:** Admin product management
- **Shard 4/4:** Admin sales + activity logs + integration tests

**Benefits:**
- Faster execution (4x parallel)
- Better resource utilization
- Isolated failures per shard

### CI/CD Pipeline Structure

#### Workflow: Daily Regression Tests

**Triggers:**
- Scheduled: Daily at configured time
- Manual: `workflow_dispatch` with environment selection

**Jobs:**

1. **Test Execution (Sharded)**
   - Run tests in 4 parallel shards
   - Each shard runs subset of tests
   - Generate JUnit XML reports
   - Capture videos/screenshots on failure
   - Upload artifacts per shard

2. **Result Merging**
   - Download all shard artifacts
   - Merge JUnit XML files
   - Combine test-results (videos, screenshots)
   - Generate unified HTML report

3. **Reporting & Notifications**
   - Analyze test results
   - Detect flaky tests
   - Send Slack notifications
   - Upload merged artifacts

#### Environment Configuration

**Development:**
- Base URL: `http://localhost:5173` (local dev server)
- API URL: (if applicable)
- Test data: Fresh test data per run

**Staging:**
- Base URL: `https://staging.gmp-web-app.com` (example)
- API URL: (if applicable)
- Test data: Stable test data

**Production:**
- Base URL: `https://gmp-web-app.com` (example)
- API URL: (if applicable)
- Test data: Read-only operations only

### Artifact Management

**Artifacts to Upload:**
- `playwright-report/` - HTML test reports
- `test-results/` - Videos, screenshots, traces
- `playwright-report/results.xml` - JUnit XML for CI integration
- `flaky-analysis.json` - Flaky test analysis results

**Retention:**
- Test reports: 30 days
- Videos/screenshots: 30 days (only failures)
- Flaky analysis: 90 days

### Reporting Requirements

#### JUnit XML Format
- Required for CI/CD integration
- Must be generated by Playwright
- Should include test names, status, duration, errors

#### HTML Reports
- Playwright's built-in HTML reporter
- Includes test results, videos, screenshots
- Accessible via GitHub Actions artifacts

#### Test Results Summary
- Total tests run
- Passed/Failed/Skipped counts
- Execution time
- Flaky test detection

### GitHub Actions Workflow Structure

```yaml
name: UI Tests Pipeline

on:
  schedule:
    - cron: '0 8 * * *'  # Daily at 8 AM UTC
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [development, staging, production]
        default: development

jobs:
  test-execution:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Install Playwright browsers
      - Run tests (sharded)
      - Upload artifacts

  merge-results:
    needs: test-execution
    steps:
      - Download all shard artifacts
      - Merge JUnit XML
      - Merge test-results
      - Upload merged artifacts

  report:
    needs: merge-results
    steps:
      - Analyze results
      - Detect flaky tests
      - Send Slack notification
      - Upload final artifacts
```

### Environment Variables Required

**Secrets (GitHub Secrets):**
- `ADMIN_EMAIL` - Test admin email
- `ADMIN_PASSWORD` - Test admin password
- `SLACK_WEBHOOK_URL` - Slack notification webhook (optional)
- `APP_URL_DEVELOPMENT` - Development base URL
- `APP_URL_STAGING` - Staging base URL
- `APP_URL_PRODUCTION` - Production base URL

**Variables (GitHub Variables):**
- `APP_ENV` - Current environment (development/staging/production)
- `NODE_VERSION` - Node.js version (e.g., '20')

### Test Execution Commands

**Local Development:**
```bash
# Run all tests
npm test

# Run smoke tests only
npm run test:smoke

# Run tests for specific environment
APP_ENV=development npm test

# Run specific tag
npx playwright test --grep "@smoke"
```

**CI/CD:**
```bash
# Run sharded tests with tags
npx playwright test \
  --project=chromium \
  --grep "@regression" \
  --shard=${{ matrix.shard }}/4 \
  --reporter=html,junit
```

### Flaky Test Management

**Detection:**
- Analyze test results over multiple runs
- Identify tests with inconsistent results
- Tag flaky tests automatically

**Handling:**
- Tag flaky tests with `@flaky`
- Exclude from critical runs
- Prioritize fixing flaky tests
- Retry mechanism for known flaky tests

### Notification Strategy

**Slack Notifications Include:**
- Test execution summary (passed/failed/total)
- Execution time
- Failed test list
- Link to test report
- Flaky test warnings
- Environment information

**Notification Triggers:**
- Test run completion (success or failure)
- Critical test failures
- Flaky test detection

---

## Next Steps

1. **Set up test infrastructure** (utilities, fixtures, config)
2. **Implement test tagging** in all test files
3. **Set up GitHub Actions workflow** (basic structure)
4. **Start with smoke tests** (Phase 1) - tagged appropriately
5. **Build up test coverage incrementally** (follow phases)
6. **Configure CI/CD pipeline** (sharding, artifacts, reporting)
7. **Set up Slack notifications** (optional)
8. **Implement flaky test detection** (after sufficient test runs)
9. **Refine selectors** as tests are written
10. **Add test data setup/teardown** as needed

---

## Notes

- All test files use **long, descriptive names** for clarity
- Tests are organized by **user type** (public/admin) and **feature area**
- **Smoke tests** provide quick feedback on critical paths
- **Integration tests** verify complete user flows
- Each test file should be **focused on one specific behavior**
- Test names clearly indicate **what is being tested** and **expected outcome**
- **All tests must be tagged** for CI/CD pipeline execution
- **Test sharding** enables parallel execution for faster feedback
- **Environment-specific tags** ensure tests run in appropriate environments
- **Artifact management** preserves test evidence for debugging

