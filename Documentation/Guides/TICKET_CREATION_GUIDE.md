# QA Ticket Creation Guide - GMP Project

## Purpose

This document serves as the **authoritative reference** for creating standardized QA test tickets for the GMP Web App. Follow this structure exactly to ensure consistency across all tickets.

---

## 📁 File Naming Convention

**Format:** `QA_TICKET_[FEATURE_NAME].md` or `QA_TICKET_[JIRA_ID]_FINAL.md`

**Examples:**
- `QA_TICKET_SMOKE_CRITICAL_PUBLIC_PATHS.md`
- `QA_TICKET_QA_5_FINAL.md`
- `QA_TICKET_HOMEPAGE_HERO_SECTION.md`

**Rules:**
- Use UPPERCASE for "QA_TICKET"
- Use underscores to separate words
- Use descriptive feature names
- Add `_FINAL` suffix if related to a Jira ticket that's been finalized
- **Location:** `Repos/gmp-ui-test/possible_tickets/`

---

## 🎯 Decision Tree: Which Template to Use?

### UI Test Template (Primary)
Use when testing:
- Browser interactions (clicks, forms, navigation)
- Visual elements (modals, buttons, styling)
- Frontend validation (error messages, field population)
- Page navigation and flows
- Component interactions
- Animations and transitions
- **Location:** `Repos/gmp-ui-test/possible_tickets/`

**Note:** Currently, all GMP tests are UI tests using Playwright. API tests may be added in the future.

---

## 📋 Template Structure - MANDATORY SECTIONS

The template follows this **FIXED ORDER**:

1. **Title** - H1 with feature name and Jira ID
2. **Project/Issue Type** - Jira metadata
3. **Description** - With Context bullets
4. **Test Strategy** - With Workflow/Test Cases overview
5. **Test Implementation** - UI Test section
6. **Expected Behavior** - Summarizes expected outcomes
7. **Acceptance Criteria** - Checklist format
8. **Notes** - Optional final notes

**⚠️ NEVER change this order or skip sections**

---

## 🔗 JIRA Ticket Linking - CRITICAL

When creating a QA test ticket that covers an existing feature/bug ticket, **you MUST link them** in Jira.

### Link Type to Use
- **"Relates to"** - Links QA test ticket to the original feature/bug ticket

### Examples
| QA Ticket | Link Type | Original Ticket |
|-----------|-----------|-----------------|
| QA-5 | relates to | GMP-4 |
| QA-5 | relates to | GMP-26 |
| QA-5 | relates to | GMP-34 |
| QA-6 | relates to | GMP-10 |
| QA-6 | relates to | GMP-17 |

### How to Link via API
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  --data '{"type":{"name":"Relates"},"inwardIssue":{"key":"QA-XXX"},"outwardIssue":{"key":"GMP-XXX"}}' \
  "https://pablo-durandev.atlassian.net/rest/api/3/issueLink"
```

### Why This Matters
- **Traceability:** Links test coverage to original requirements
- **Visibility:** Team can see which tickets have QA test coverage
- **Reporting:** Enables tracking of test coverage across features

**⚠️ NEVER create a QA ticket without linking it to the corresponding feature/bug ticket it covers.**

---

## 🖥️ UI Test Template

```markdown
# QA Ticket: [Feature Name] ([Jira-ID])

## Project
QA (QA)

## Issue Type
Story

UI Test - [Brief Description] (QA-XXX)

**Parent Epic:** [Epic Key, e.g., QA-2]

**Links to GMP Epics:** [GMP-XXX, GMP-YYY]

---

## 📋 Description

[1-2 sentences explaining what feature/functionality needs testing]

**Context:**
- [Key point 1]
- [Key point 2]
- [Key point 3]
- [Any important background info]

---

## 🎯 Test Strategy

**Focus:** [What aspects are being tested]

**Viewport:** Desktop (1920x1080) - Mobile testing in separate phase

**Estimated Execution Time:** [X-Y seconds/minutes]

**Tags:** [@smoke, @e2e, @public, @admin, @desktop, etc.]

**Note:** [Any important clarifications about test file location, isolation, etc.]

### Workflow to Test:
1. [High-level step 1]
2. [High-level step 2]
3. [High-level step 3]
4. [Cleanup]

---

## UI Test

**File:** `tests/[folder]/[test-file-name].spec.ts` ([new/existing] test)

**Test Structure:** [Single test with steps OR Multiple separate tests]

### Required Data-TestIds

Request the following `data-testid` attributes to be added (dev will define exact naming):

1. **[Element 1 Name]** - [Description of where/what element needs data-testid]
2. **[Element 2 Name]** - [Description of where/what element needs data-testid]
3. **[Element N Name]** - [Description of where/what element needs data-testid]

**Note:** If there are any flaky locators identified in the flow of the test, please add `data-testid` attributes as needed to ensure stable test automation.

---

### Test Steps

**Setup:**
- [Setup step 1: e.g., "Navigate to home page"]
- [Setup step 2: e.g., "Wait for networkidle"]
- [Setup step 3: e.g., "Verify page loads"]

**Step 1: [Step Name]**
- [Action 1: e.g., "Click button with data-testid='hero-cta-btn'"]
- [Action 2: e.g., "Wait for navigation"]
- [Verification 1: e.g., "Verify URL changes to /catalogo"]
- [Verification 2: e.g., "Verify catalog page loads"]

**Step 2: [Step Name]**
- [Action 1]
- [Verification 1]
- **Supabase Verification (if applicable):** Verify API call to Supabase endpoint and expected response

**Step N: [Final Step Name]**
- [Final actions]
- [Final verifications]

**Cleanup:**
- [Cleanup actions: e.g., "No cleanup needed (read-only test)" OR "Delete test data if created"]

---

## Expected Behavior

**[Section 1 Name]:**
- [Expected result 1]
- [Expected result 2]

**[Section 2 Name]:**
- [Expected result 1]
- [Expected result 2]

**[Section N Name]:**
- [Expected results]

---

## Acceptance Criteria

- [ ] [Criterion 1: e.g., "Button exists and is clickable"]
- [ ] [Criterion 2: e.g., "Navigation works correctly"]
- [ ] [Criterion 3: e.g., "Page loads within acceptable time"]
- [ ] [Criterion N]
- [ ] [Cleanup: e.g., "No test data cleanup needed"]

---

**Note:** [Any additional notes, scope exclusions, or future work]
```

---

## 🎨 Formatting Rules - STRICT

### Headers
- **H1 (Title):** `# QA Ticket: [Feature Name]`
- **H2 (Major sections):** Use emojis: `## 📋 Description`, `## 🎯 Test Strategy`
- **H3 (Subsections):** `### Test Steps`, `### Test Cases`

### Lists
- **Context bullets:** Use `-` (hyphens)
- **Test Cases/Workflow:** Use `1. 2. 3.` (numbered)
- **Acceptance Criteria:** Use `- [ ]` (checkboxes)

### Nested Bullets (Child Steps) - REQUIRED for Step Details

When a step has sub-steps (details), use **nested bullets** (child bullets) by indenting with **2 spaces**.

**Example (correct):**
```markdown
**Step 2: Verify Featured Products Load**
- Wait for Supabase API call:
  - Intercept: `GET /rest/v1/products?featured=eq.true`
  - Verify response status is `200`
- Verify products display:
  - At least one product card is visible
  - Product images load successfully
```

**Do not** flatten these into a single-level list—Jira ADF will render child bullets properly only when they are nested in the markdown.

### Bold Text
Use **bold** for:
- Section keywords: `**Context:**`, `**Focus:**`, `**Note:**`
- Test structure: `**Setup:**`, `**Step 1:**`, `**Test 1:**`, `**Cleanup:**`
- Special callouts: `**Supabase Verification:**`, `**Important:**`

### Dividers
- Use `---` between major sections (after Issue Type, after Test Strategy, before Notes)

### Code Formatting
- Application URLs: Use backticks: `https://pablodur2000.github.io/gmp-web-app/`
- Endpoints: Use backticks: `/rest/v1/products`
- File paths: Use backticks: `tests/smoke/critical-public-paths-load-correctly.spec.ts`
- Data-testids: Use format: `data-testid="hero-cta-btn"`
- Routes: Use backticks: `/catalogo`, `/producto/:id`

---

## 🧱 Jira Publishing (Markdown → ADF) - CRITICAL

This guide defines the **markdown source of truth**, but Jira descriptions must be sent as **ADF** (not raw markdown).

When publishing a ticket to Jira:
- **Convert `**bold**` into ADF strong marks** (do not leave literal `**` in text nodes).
- **Convert backticks into ADF code marks** (do not leave literal backticks in text nodes).
- **Avoid extra blank lines**: do not emit empty ADF `paragraph` nodes unless you intentionally want spacing.
- Preserve nested bullets as nested ADF lists (indentation matters).

If you skip this, Jira will display literal `**Step 1:**` / `` `data-testid="x"` `` and/or create large vertical gaps.

---

## 🔄 Step-by-Step Ticket Creation Process

### Step 1: Understand the Requirement
- Read the user's request carefully
- Identify if it's UI testing (all GMP tests are currently UI)
- Determine if it's a new test or extending existing test

### Step 2: Choose Template
- **UI Test:** Browser interactions, visual validation → Use UI template

### Step 3: Determine Test Structure
- **Multiple separate tests?** → Use "Test 1, Test 2, Test N" format
  - Example: Testing 3 different smoke test scenarios (each is independent)
- **Single test with sequential steps?** → Use "Step 1, Step 2, Step N" format
  - Example: Testing complete user flow from home to catalog

### Step 4: Fill in Title and Metadata
```markdown
# QA Ticket: [Feature Name from user request] ([Jira ID])

## Project
QA (QA)

## Issue Type
Story

UI Test - [Brief description of what's being tested] (QA-XXX)

**Parent Epic:** [QA-XXX]

**Links to GMP Epics:** [GMP-XXX, GMP-YYY]
```

### Step 5: Write Description
- 1-2 sentences explaining the feature
- Add **Context:** with 2-4 bullet points providing background

### Step 6: Define Test Strategy
- **Focus:** One sentence on what aspect is being tested
- **Viewport:** Desktop (1920x1080) - Mobile testing in separate phase
- **Estimated Execution Time:** Realistic time estimate
- **Tags:** Relevant Playwright tags
- **Note:** File location or strategy (isolated test, extending existing, etc.)
- List high-level test cases or workflow steps (numbered list)

### Step 7: Detail Test Implementation

**For UI Tests:**
- List all required data-testids FIRST
- Then write test steps (Setup → Step 1 → Step 2 → ... → Cleanup)
- Include Supabase verification if applicable

### Step 8: Document Expected Behavior
- Break into logical sections
- List concrete expected results (not just "should work")

### Step 9: Create Acceptance Criteria
- Convert each major verification into a checklist item
- Always include cleanup item at the end

### Step 10: Add Notes (if needed)
- Scope exclusions (what's NOT being tested)
- Future work references
- Important clarifications

### Step 11: Review
- Check all sections are present in correct order
- Verify formatting is consistent
- Ensure data-testids are requested (UI only)
- Confirm cleanup is included

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T:
- Skip sections (all sections are mandatory)
- Change the section order
- Mix "Test 1, Test 2" with "Step 1, Step 2" formats
- Forget to request data-testids (UI tests)
- Forget cleanup steps
- Use vague language ("verify it works" → be specific)
- Omit Supabase verification details when applicable
- Leave acceptance criteria empty
- Forget to specify viewport (Desktop 1920x1080)

### ✅ DO:
- Follow the exact template structure
- Be specific in verifications (exact field names, expected values)
- Include both positive and negative test cases when relevant
- Request data-testids BEFORE writing test steps (UI)
- Always include cleanup
- Use consistent formatting (bold, backticks, bullets)
- Match "Expected Behavior" format to test structure
- Specify viewport and tags
- Link to GMP feature Epics

---

## 📊 Format Decision Matrix

| Scenario | Format to Use | Example |
|----------|--------------|---------|
| 3 separate smoke tests in one file | Test 1, Test 2, Test 3 | QA_TICKET_SMOKE_CRITICAL_PUBLIC_PATHS.md |
| Single workflow with multiple actions | Step 1, Step 2, Step N | QA_TICKET_HOMEPAGE_NAVIGATION_TO_CATALOG.md |
| Multiple independent UI flows | Test 1, Test 2, Test N | (Rare for GMP tests) |

---

## 🎯 Quality Checklist

Before finalizing a ticket, verify:

- [ ] Title follows naming convention
- [ ] All mandatory sections present in correct order
- [ ] Description is clear and concise (1-2 sentences)
- [ ] Context has 2-4 bullet points
- [ ] Test Strategy includes Focus, Viewport, Tags, Note, and overview list
- [ ] data-testids requested BEFORE test steps (UI only)
- [ ] Test steps are specific and actionable
- [ ] Supabase verifications include endpoint paths and expected responses (if applicable)
- [ ] Expected Behavior matches test structure format
- [ ] Acceptance Criteria has checkboxes for all major validations
- [ ] Cleanup is included
- [ ] Formatting is consistent (bold, backticks, bullets)
- [ ] No placeholder text like "[TODO]" or "[FILL IN]"
- [ ] Links to GMP Epics are specified

---

## 📚 GMP Project Specifics

### Test File Structure
- **Smoke Tests:** `tests/smoke/`
- **E2E Tests:** `tests/e2e/public/` or `tests/e2e/admin/`
- **Integration Tests:** `tests/integration/`

### Test Utilities
- **Step Executor:** `tests/utils/step-executor.ts`
- **Navigation:** `tests/utils/navigation.ts`

### Base URL
- **Production:** `https://pablodur2000.github.io/gmp-web-app/`
- **Local:** `http://localhost:5173/gmp-web-app/` (if using local dev server)

### Viewport
- **Desktop:** 1920x1080 (default for all Phase 1 tests)
- **Mobile:** Separate phase (not in Phase 1)

### Tags
- `@smoke` - Smoke tests
- `@e2e` - End-to-end tests
- `@public` - Public pages
- `@admin` - Admin pages
- `@desktop` - Desktop viewport
- `@development` - Development environment
- `@staging` - Staging environment
- `@production` - Production environment

---

## 🤖 AI Instructions

When the user asks to create a QA ticket:

1. **Read this guide first** - Follow the structure exactly
2. **Ask clarifying questions** if needed (single vs multiple tests)
3. **Choose the correct template** (UI test for GMP)
4. **Use the correct format** (Test 1/2/N vs Step 1/2/N)
5. **Fill in all sections** - No placeholders or TODOs
6. **Review against Quality Checklist** before presenting
7. **Propose the ticket** - Don't create the file until user approves
8. **Create file in correct location:** `Repos/gmp-ui-test/possible_tickets/`

---

## 📝 Final Notes

- This is a **living document** - Update if new patterns emerge
- Templates are a **BASE** - Adapt details to fit the specific test, but NEVER change structure
- **Consistency is key** - Developers should instantly recognize the format
- When in doubt, **reference existing tickets** in the same folder
- All Phase 1 tests focus on **Desktop viewport (1920x1080)**
- Mobile testing will be in a **separate phase**

---

**Last Updated:** 2025-12-01  
**Maintained By:** AI Assistant (Cursor)  
**Project:** GMP Web App - QA Test Framework

