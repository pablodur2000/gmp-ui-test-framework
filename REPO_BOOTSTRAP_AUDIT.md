# Repository Bootstrap — Audit & Plan

**Date:** 2026-02-01  
**Scope:** Prepare gmp-ui-test for public/professional remote repo, clean Git history, CI/CD readiness.  
**Constraint:** Do not break working tests; keep simple but scalable.

---

## 1. Audit Summary

### 1.1 Current Structure

| Path | Purpose | Status |
|------|---------|--------|
| `tests/e2e/public/home-page/` | E2E specs (3 files) | ✅ Keep |
| `tests/smoke/` | Smoke specs (3 files) | ✅ Keep |
| `tests/utils/` | Shared utilities (step-executor, navigation, selectors, etc.) | ✅ Keep |
| `playwright.config.ts` | Playwright config, BASE_URL from env | ✅ Keep |
| `tsconfig.json` | TypeScript config | ✅ Keep |
| `package.json` | Scripts, deps | ⚠️ Add missing scripts (see below) |
| `.gitignore` | Ignore rules | ⚠️ Expand (see below) |
| `.env.example` | Env template | ⚠️ Verify/update (env vars inferred from code) |
| `README.md` | Onboarding | ⚠️ Outdated; expand for pro use |
| `Documentation/` | Test docs, patterns | ✅ Keep |
| `Progress reports/` | QA progress | ✅ Keep (or move under docs) |
| `possible_tickets/` | Ticket markdown | ✅ Already gitignored |
| Root `.md` files | Status, refactoring, rules, plan | ✅ Keep; consider grouping under `docs/` later |
| Root `.js` scripts | Jira (analyze-qa-board, create-epics, create-ticket, update-jira, update-ticket-status) | ✅ Keep; optional tooling, require `.env` for Jira |
| `.cursorrules` | Cursor AI rules | ✅ Keep for team consistency |

### 1.2 Gaps & Risks

- **.gitignore:** Missing `.env.*`, `.DS_Store`, `dist/`, `coverage/`, `.vscode/`. Consider `.cursor/` if using Cursor.
- **Secrets:** Jira scripts use `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN` (and `JIRA_USER_ACCOUNT_ID`, `JIRA_PROJECT_KEY`). Must never commit `.env`. `.env.example` should list placeholders only.
- **README:** Says "localhost:5173" and "Vite dev server" — actual default is production URL; local is `localhost:3000/gmp-web-app`. No test:smoke/test:regression/report, no CI/CD or contribution section.
- **package.json:** Missing `test:smoke`, `test:regression`, and `report` (alias for `test:report`). Duplicate intent: `e2e-test` / `e2e-ui` overlap with `test` / `test:ui`.
- **CI/CD:** No `.github/` yet. Plan: document only; no pipeline implementation in this bootstrap.
- **Reports:** Playwright uses default `reporter: 'html'` (output in `playwright-report/`). No change needed for bootstrap; CI doc will mention artifact upload of this folder.

### 1.3 Test Execution Model

- **Tags:** Tests use `@smoke` and `@e2e` in `test.describe(..., { tag: [...] })`.
- **Smoke:** `npx playwright test --grep @smoke` → smoke suite.
- **Regression / full:** `npx playwright test` (all) or `npx playwright test --grep @e2e` for e2e-only (optional).
- **Environments:** `BASE_URL` / `APP_URL`; scripts `test:local`, `test:production` set BASE_URL.

### 1.4 Environment Variables (for .env.example)

| Variable | Required | Used by | Notes |
|----------|----------|---------|--------|
| `BASE_URL` | No | playwright.config.ts, tests/utils/navigation.ts | Default: production URL |
| `APP_URL` | No | Same as BASE_URL | Alternative to BASE_URL |
| `JIRA_BASE_URL` | For Jira scripts | *.js | e.g. https://your-domain.atlassian.net |
| `JIRA_EMAIL` | For Jira scripts | *.js | Atlassian account email |
| `JIRA_API_TOKEN` | For Jira scripts | *.js | API token (secret) |
| `JIRA_USER_ACCOUNT_ID` | For update-ticket-status | update-ticket-status.js | Optional |
| `JIRA_PROJECT_KEY` | No | Jira scripts | Default: QA |
| `JIRA_TICKETS_PATH` | No | update-jira-tickets.js | Default: possible_tickets |

---

## 2. Step-by-Step Bootstrap Plan

### Phase A — Ignore & secrets

1. **Update `.gitignore`**  
   Add: `.env.*`, `.DS_Store`, `dist/`, `coverage/`, `.vscode/`, optionally `.cursor/`.  
   Keep: `node_modules/`, `test-results/`, `playwright-report/`, `playwright/.cache/`, `.env`, `.env.local`, `*.log`, `possible_tickets`.

2. **Create or update `.env.example`**  
   List all variables with placeholder values and short comments. No real secrets.  
   Ensure `.env` and `.env.*` remain in `.gitignore`.

### Phase B — Package scripts

3. **Add/align `package.json` scripts**  
   - `test` — keep (full suite).  
   - Add `test:smoke`: `npx playwright test --grep @smoke` (after install if desired).  
   - Add `test:regression`: `npx playwright test` (or `--grep @e2e` if you want regression = e2e-only; recommend full suite as regression).  
   - Keep `test:headed`, `test:debug`.  
   - Add `report`: `npx playwright show-report` (alias for `test:report`).  
   - Keep `test:report`, `test:local`, `test:production`, etc.  
   - Optional: trim `e2e-test` / `e2e-ui` if redundant with `test` / `test:ui` (document in README).

### Phase C — Documentation

4. **Rewrite `README.md`**  
   Sections: Project purpose, Tech stack, Prerequisites, Installation, Local execution (including test:local/test:production), Test types (smoke vs full/regression), Reports (where they are, `npm run report`), CI/CD overview (placeholder: e.g. “CI/CD: see docs/CI_CD.md”), Contribution guidelines (short). Keep it concise and professional.

5. **Add `docs/CI_CD.md`**  
   Prepare for GitHub Actions: manual trigger, scheduled runs, HTML report artifact upload, BASE_URL in CI. Do not implement the workflow yet—only document intended layout and env vars.

### Phase D — Repo hygiene & Git

6. **Light repo hygiene**  
   - No new file deletions unless obviously junk.  
   - Ensure no committed `.env` or secrets.  
   - If any temporary or experiment files exist at root, remove or gitignore.

7. **Git: first-commit readiness**  
   - Ensure working tree clean after steps 1–6.  
   - Propose: single initial commit message and a short branch strategy (e.g. `main` as default, `develop` optional; PRs from feature branches).

---

## 3. Out of Scope (This Bootstrap)

- Implementing GitHub Actions workflows.
- Moving all internal docs into `docs/` (can be a follow-up).
- Removing or refactoring Jira scripts (keep as optional tooling).
- Changing test code or Playwright config beyond what’s necessary for scripts/docs.

---

## 4. Approval Checklist

- [ ] Phase A (`.gitignore`, `.env.example`) approved  
- [ ] Phase B (`package.json` scripts) approved  
- [ ] Phase C (README, CI_CD.md) approved  
- [ ] Phase D (hygiene, Git strategy) approved  

After approval, implementation will be done incrementally (phase by phase).
