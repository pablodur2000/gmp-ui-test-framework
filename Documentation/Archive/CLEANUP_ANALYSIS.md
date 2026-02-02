# Repository Cleanup Analysis

**Date:** January 17, 2026  
**Purpose:** Identify obsolete scripts and files that can be safely deleted

---

## Executive Summary

After analyzing the repository, I found **multiple duplicate scripts** for the same functionality. We now have a **clean Node.js solution** that should replace all the old PowerShell and Python scripts.

**Recommendation:** Delete all old scripts and keep only the active Node.js scripts.

---

## Script Analysis

### ✅ **ACTIVE Scripts (Keep These)**

These scripts are actively used and referenced in `package.json`:

| Script | Location | Purpose | Status |
|--------|----------|---------|--------|
| `update-jira-tickets.js` | `Repos/gmp-ui-test/` | Update Jira ticket descriptions from markdown | ✅ **ACTIVE** |
| `update-ticket-status.js` | `Repos/gmp-ui-test/` | Update ticket status to "Done" and assign | ✅ **ACTIVE** |
| `create-all-epics.js` | `Repos/gmp-ui-test/` | Create all QA Epics in Jira | ✅ **ACTIVE** |

**All three are referenced in `package.json` scripts:**
- `npm run update-jira` → `update-jira-tickets.js`
- `npm run update-ticket-status` → `update-ticket-status.js`
- `npm run create-epics` → `create-all-epics.js`

---

### ❌ **OBSOLETE Scripts (Delete These)**

These scripts are **duplicates** of the Node.js versions above and are **no longer needed**:

#### PowerShell Scripts (Root Directory)

| Script | Purpose | Why Obsolete |
|--------|---------|--------------|
| `update-jira-tickets.ps1` | Update Jira tickets (PowerShell) | ❌ Replaced by `update-jira-tickets.js` |
| `update_single_ticket.ps1` | Update single ticket (PowerShell) | ❌ Replaced by `update-jira-tickets.js` |
| `update_all_jira_tickets.ps1` | Update all tickets (PowerShell) | ❌ Replaced by `update-jira-tickets.js` |
| `convert_md_to_adf.ps1` | Convert markdown to ADF (PowerShell) | ❌ Functionality in `update-jira-tickets.js` |

**Issues with PowerShell scripts:**
- ❌ Complex manual markdown parsing
- ❌ Timeouts during execution
- ❌ Incomplete markdown support
- ❌ Hard to maintain
- ❌ Not referenced in package.json

#### Python Script

| Script | Purpose | Why Obsolete |
|--------|---------|--------------|
| `update_jira_tickets.py` | Update Jira tickets (Python) | ❌ Replaced by `update-jira-tickets.js` |

**Issues with Python script:**
- ❌ Requires Python installation
- ❌ Not referenced in package.json
- ❌ Duplicate functionality

---

## Temporary Files Analysis

### ❌ **Temporary JSON Files (Delete These)**

All these files are **temporary** and were used during ticket creation. They can be safely deleted:

#### Epic Temp Files (Root Directory)
- `epic-qa-homepage-temp.json`
- `epic-qa-navigation-temp.json`
- `epic-qa-smoke-tests-temp.json`

#### Story Temp Files (Root Directory)
- `story-qa-homepage-hero-temp.json`
- `story-qa-homepage-loads-temp.json`
- `story-qa-homepage-navigation-temp.json`
- `story-qa-navigation-links-temp.json`
- `story-qa-navigation-logo-temp.json`
- `story-qa-smoke-admin-paths-temp.json`
- `story-qa-smoke-navigation-temp.json`
- `story-qa-smoke-public-paths-temp.json`
- `story-catalog-inventory-filter-temp.json`
- `story-catalog-listing-temp.json`
- `story-catalog-loading-empty-temp.json`
- `story-catalog-main-category-temp.json`
- `story-catalog-search-temp.json`
- `story-catalog-subcategory-temp.json`
- `story-catalog-view-mode-temp.json`
- `story-dash-activity-temp.json`
- `story-dash-auth-temp.json`
- `story-dash-loading-notifications-temp.json`
- `story-dash-product-catalog-temp.json`
- `story-dash-product-crud-temp.json`
- `story-dash-sales-temp.json`
- `story-dash-search-filter-temp.json`
- `story-dash-stats-temp.json`
- `story-detail-error-handling-temp.json`
- `story-detail-inventory-status-temp.json`
- `story-detail-load-product-temp.json`
- `story-detail-product-info-temp.json`
- `story-detail-related-products-temp.json`

#### Issue Temp Files (Root Directory)
- `issue-4.json`
- `issue-5.json`
- `issue-6.json`
- `issue-7.json`
- `issue-8.json`
- `issue-9.json`
- `issue-10.json`
- `qa-test-ticket.json`

**Total:** ~35 temporary JSON files

**Why delete:**
- ✅ All tickets have been created in Jira
- ✅ These were only used during creation process
- ✅ No longer needed
- ✅ Clutter the repository

---

## Documentation Files Analysis

### ✅ **Keep These Documentation Files**

| File | Purpose | Status |
|------|---------|--------|
| `JIRA_UPDATE_APPROACH_ANALYSIS.md` | Analysis of different approaches | ✅ **KEEP** (useful reference) |
| `UPDATE_JIRA_INSTRUCTIONS.md` | Instructions for updating tickets | ✅ **KEEP** (useful reference) |
| `Repos/gmp-ui-test/TICKET_CREATION_GUIDE.md` | Guide for creating tickets | ✅ **KEEP** (active guide) |
| `Repos/gmp-web-app/Documentation/JIRA_USAGE_GUIDE.md` | Jira usage guide | ✅ **KEEP** (active guide) |

**Why keep:**
- Provide useful reference information
- Document the approach we chose
- Help future maintenance

---

## Cleanup Summary

### Files to Delete

#### Scripts (4 files)
1. ❌ `update-jira-tickets.ps1`
2. ❌ `update_single_ticket.ps1`
3. ❌ `update_all_jira_tickets.ps1`
4. ❌ `convert_md_to_adf.ps1`
5. ❌ `update_jira_tickets.py`

#### Temporary JSON Files (~35 files)
- All `*-temp.json` files in root directory
- All `issue-*.json` files in root directory
- `qa-test-ticket.json`

**Total files to delete:** ~40 files

---

## Cleanup Script

I can create a cleanup script to safely delete all these files. Would you like me to:

1. **Create a cleanup script** that lists all files to be deleted (dry-run first)
2. **Delete files directly** (after your confirmation)
3. **Create a backup** before deletion (optional)

---

## Benefits of Cleanup

1. ✅ **Cleaner Repository:** Remove ~40 obsolete files
2. ✅ **Less Confusion:** Only active scripts remain
3. ✅ **Easier Maintenance:** Clear which scripts are in use
4. ✅ **Better Organization:** Focus on active Node.js solution
5. ✅ **Reduced Clutter:** No temporary files

---

## Verification

After cleanup, the repository should only have:

### Active Scripts (3 files)
- ✅ `Repos/gmp-ui-test/update-jira-tickets.js`
- ✅ `Repos/gmp-ui-test/update-ticket-status.js`
- ✅ `Repos/gmp-ui-test/create-all-epics.js`

### Documentation (Keep)
- ✅ `JIRA_UPDATE_APPROACH_ANALYSIS.md` (reference)
- ✅ `UPDATE_JIRA_INSTRUCTIONS.md` (reference)
- ✅ `Repos/gmp-ui-test/TICKET_CREATION_GUIDE.md` (active)
- ✅ `Repos/gmp-web-app/Documentation/JIRA_USAGE_GUIDE.md` (active)

---

**Next Steps:**
1. Review this analysis
2. Confirm files to delete
3. Execute cleanup


