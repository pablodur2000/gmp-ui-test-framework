# QA Test Tickets - Phase 1

This folder contains all QA test ticket markdown files following the standardized structure defined in `TICKET_CREATION_GUIDE.md`.

---

## 📁 Files Overview

### Epic 1: Smoke Tests - Critical Path Verification (QA-2)

1. **QA_TICKET_QA_5_SMOKE_CRITICAL_PUBLIC_PATHS.md**
   - Jira: QA-5
   - Links to: GMP-4, GMP-26, GMP-34
   - Test File: `tests/smoke/critical-public-paths-load-correctly.spec.ts`
   - Tests: HomePage, CatalogPage, ProductDetailPage comprehensive loading

2. **QA_TICKET_QA_6_SMOKE_CRITICAL_ADMIN_PATHS.md**
   - Jira: QA-6
   - Links to: GMP-10, GMP-17
   - Test File: `tests/smoke/critical-admin-paths-require-authentication.spec.ts`
   - Tests: AdminLoginPage form, AdminDashboardPage redirect

3. **QA_TICKET_QA_7_SMOKE_CRITICAL_NAVIGATION.md**
   - Jira: QA-7
   - Links to: GMP-4
   - Test File: `tests/smoke/critical-navigation-elements-work-correctly.spec.ts`
   - Tests: Header, logo, dropdown menus, hover states

### Epic 2: Public Pages - HomePage Testing (QA-3)

4. **QA_TICKET_QA_8_HOMEPAGE_LOADS.md**
   - Jira: QA-8
   - Links to: GMP-4
   - Test File: `tests/e2e/public/home-page/home-page-loads-and-displays-correctly.spec.ts`
   - Tests: All HomePage sections with Intersection Observer animations

5. **QA_TICKET_QA_9_HOMEPAGE_HERO_SECTION.md**
   - Jira: QA-9
   - Links to: GMP-4
   - Test File: `tests/e2e/public/home-page/home-page-hero-section-displays-correctly.spec.ts`
   - Tests: Carousel, first-visit animation, parallax effects

6. **QA_TICKET_QA_10_HOMEPAGE_NAVIGATION_TO_CATALOG.md**
   - Jira: QA-10
   - Links to: GMP-4
   - Test File: `tests/e2e/public/home-page/home-page-navigation-to-catalog-works-correctly.spec.ts`
   - Tests: All CTA buttons navigate to catalog

### Epic 3: Public Pages - Navigation Testing (QA-4)

7. **QA_TICKET_QA_11_HEADER_NAVIGATION_LINKS.md**
   - Jira: QA-11
   - Links to: GMP-4
   - Test File: `tests/e2e/public/navigation/header-navigation-links-work-correctly.spec.ts`
   - Tests: Navigation links, dropdown menu, smooth scroll

8. **QA_TICKET_QA_12_HEADER_LOGO_NAVIGATION.md**
   - Jira: QA-12
   - Links to: GMP-4
   - Test File: `tests/e2e/public/navigation/header-logo-navigation-works-correctly.spec.ts`
   - Tests: Logo navigation from all pages, browser history

---

## 📊 Summary Statistics

- **Total Tickets:** 8
- **Total Epics:** 3
- **Total Test Files:** 8
- **Estimated Total Execution Time:** 3-5 minutes
- **Viewport:** Desktop (1920x1080) - All Phase 1 tests

---

## 🔗 Jira Links

### Epics
- [QA-2: Smoke Tests - Critical Path Verification](https://pablo-durandev.atlassian.net/browse/QA-2)
- [QA-3: Public Pages - HomePage Testing (Phase 1)](https://pablo-durandev.atlassian.net/browse/QA-3)
- [QA-4: Public Pages - Navigation Testing (Phase 1)](https://pablo-durandev.atlassian.net/browse/QA-4)

### Stories
- [QA-5: Smoke Test - Critical Public Paths](https://pablo-durandev.atlassian.net/browse/QA-5)
- [QA-6: Smoke Test - Critical Admin Paths](https://pablo-durandev.atlassian.net/browse/QA-6)
- [QA-7: Smoke Test - Critical Navigation](https://pablo-durandev.atlassian.net/browse/QA-7)
- [QA-8: HomePage Loads and Displays](https://pablo-durandev.atlassian.net/browse/QA-8)
- [QA-9: HomePage Hero Section](https://pablo-durandev.atlassian.net/browse/QA-9)
- [QA-10: HomePage Navigation to Catalog](https://pablo-durandev.atlassian.net/browse/QA-10)
- [QA-11: Header Navigation Links](https://pablo-durandev.atlassian.net/browse/QA-11)
- [QA-12: Header Logo Navigation](https://pablo-durandev.atlassian.net/browse/QA-12)

---

## 📝 File Structure

All ticket files follow the standardized structure:

1. Title with Jira ID
2. Project and Issue Type
3. Description with Context
4. Test Strategy
5. UI Test Implementation
6. Expected Behavior
7. Acceptance Criteria
8. Notes

See `../TICKET_CREATION_GUIDE.md` for complete structure details.

---

## ✅ Next Steps

1. **Review Tickets:** Review all ticket markdown files for accuracy
2. **Request Data-TestIds:** Request developers to add `data-testid` attributes as specified
3. **Implement Tests:** Start implementing test files as described in each ticket
4. **Update Jira:** Update Jira ticket descriptions with markdown content (convert to ADF)
5. **Track Progress:** Update ticket status as tests are implemented

---

**Last Updated:** 2025-12-01  
**Phase:** Phase 1 - Foundation Tests  
**Status:** All tickets created and documented

