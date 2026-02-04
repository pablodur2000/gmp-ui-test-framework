# UI Regression Pipeline — Analysis (Reference: web-app-ui-test-framework)

**Date:** 2026-02-02  
**Reference:** `web-app-ui-test-framework/.github/workflows/daily-regression-develop.yml`  
**Goal:** Use this design as reference to plan the GMP UI regression run pipeline.

---

## 1. Reference workflow design (daily-regression-develop.yml)

### 1.1 Triggers

| Trigger | Config | Purpose |
|--------|--------|---------|
| **Schedule** | `cron: '0 8 * * *'` (daily 08:00 UTC) | Run regression automatically every day |
| **Manual** | `workflow_dispatch` with input `environment` | Run on demand; choose environment (development / staging / rc) |

### 1.2 Environment & inputs

- **Input:** `environment` (choice: development, staging, rc; default: development).
- **Env vars:** `APP_ENV`, `NODE_ENV`, `CI` set at workflow level.
- **URLs per environment:** `APP_URL` and `API_URL` are set in the “Run regression tests” step from the chosen environment (e.g. dev / staging / rc URLs).
- **Secrets:** TestRail (host, project/suite IDs, user, API key), Slack (webhook, bot token). Used in reporting steps.

### 1.3 Job 1: `regression-tests` (parallel shards)

| Aspect | Design |
|--------|--------|
| **Runner** | `ubuntu-latest` |
| **Strategy** | `fail-fast: false`, matrix `shard: [1, 2, 3, 4]` → 4 parallel jobs |
| **Steps** | Checkout → Setup Node 20 (npm cache) → `npm ci` → Install Playwright (chromium only) → Run tests |
| **Test command** | `npx playwright test --project=chromium --grep "$TEST_TAG" --grep-invert "@document-upload" --shard=${{ matrix.shard }}/4` |
| **Tag logic** | By `environment`: staging → `@staging-ready`, rc → `@rc-ready`, else → `@regression` |
| **Artifacts** | Upload `playwright-report/` and `test-results/` per shard; retention 30 days |

So: one job runs 1/4 of the tests; four jobs together = full suite, split by Playwright sharding.

### 1.4 Job 2: `merge-and-report` (after all shards)

| Aspect | Design |
|--------|--------|
| **Run** | `needs: regression-tests`, `if: always()` — runs even if some shards fail |
| **Steps** | Checkout → Setup Node → Download all shard artifacts → Merge → Post-process → Notify |
| **Merge** | Download artifacts by pattern `playwright-report-*-shard-*` into `all-reports/`; merge JUnit XML (`results.xml`) with Python `junitparser`; merge `test-results/` (videos, traces, etc.) |
| **Post-process** | `node scripts/normalize-junit-xml.js`; optional TestRail publish; optional TRCLI report; export TestRail PDF and attach videos; flaky analysis; Slack notification |
| **Artifacts** | Upload merged `playwright-report/`, `test-results/`, `flaky-analysis.json`; retention 30 days |

So: a single “merge” job aggregates results from all 4 shards, then runs reporting (TestRail, Slack, flaky tagging).

### 1.5 Reporting & integrations (reference)

- **TestRail:** Publish results via custom script (`publish-ui-results.js`); optional TRCLI report; export PDF and attach videos; uses repo secrets.
- **Slack:** One step sends notification with attachments (e.g. report link, flaky summary); uses webhook + bot token.
- **Flaky:** Scripts analyze JUnit XML and tag flaky tests in the repo.

---

## 2. GMP UI test framework — current state

| Item | GMP (gmp-ui-test) | Reference (web-app-ui-test-framework) |
|------|-------------------|----------------------------------------|
| **Runner** | — | ubuntu-latest |
| **Node** | — | 20, npm cache |
| **Install** | — | npm ci, Playwright chromium |
| **Test command** | `npx playwright test` (or with BASE_URL) | `npx playwright test --project=chromium --grep "@regression" --shard=…` |
| **Tags** | `@e2e`, `@smoke`, `@desktop`, `@development` / `@staging` / `@production` | `@regression`, `@staging-ready`, `@rc-ready` |
| **Environments** | Production (default), local (BASE_URL) | development, staging, rc (APP_URL / API_URL) |
| **Sharding** | Not used | 4 shards |
| **Merge job** | — | Yes (download artifacts, merge XML, report) |
| **TestRail** | No | Yes (optional) |
| **Slack** | No | Yes (optional) |
| **JUnit reporter** | No (only HTML) | Yes (for merge + TestRail) |
| **Flaky analysis** | No | Yes |

So for GMP we have: single env (production/local), tags by area (@smoke, @e2e) and env (@production etc.), no sharding, no merge, no JUnit, no TestRail/Slack.

---

## 3. What we need for a GMP regression pipeline

### 3.1 Minimal (first version)

- **Workflow file:** e.g. `.github/workflows/daily-regression.yml` (or `ui-regression.yml`).
- **Triggers:** Schedule (e.g. daily) + `workflow_dispatch` (optional: input for BASE_URL or “production” / “local” if we add multiple targets later).
- **Single job (no sharding):** Checkout → Node 20 → `npm ci` → `npx playwright install --with-deps chromium` → run tests with `BASE_URL` (production by default).
- **Test command:** e.g. `npx playwright test --project=chromium` (and optionally `--grep "@smoke|@e2e"` or a single `@regression` tag once we add it).
- **Artifacts:** Upload `playwright-report/` and `test-results/`; retention 7–14 days.
- **Reporter:** Keep default HTML; add JUnit only if we want merge/CI summary later.

No TestRail, no Slack, no merge job. This matches “run full UI regression on schedule and on demand, store reports.”

### 3.2 With sharding (when suite grows)

- Add a matrix job like the reference: e.g. `shard: [1, 2, 3, 4]`.
- Command: `npx playwright test --project=chromium --shard=${{ matrix.shard }}/4`.
- Add a second job that downloads all shard artifacts, merges JUnit XML (need to add JUnit reporter in `playwright.config.ts`), and uploads merged report.
- Optional: flaky analysis script on merged `results.xml`.

### 3.3 Tags for regression

- Today: tests use `@smoke`, `@e2e`, plus `@development` / `@staging` / `@production`.
- For pipeline: either
  - use `--grep "@smoke|@e2e"` (run all current tests), or
  - introduce a single `@regression` tag and add it to every test we want in the daily run; then use `--grep "@regression"` like the reference.
- Recommendation: add `@regression` to the same tests that are smoke/e2e so we can later exclude slow or experimental tests from the pipeline.

### 3.4 Environment (BASE_URL)

- **Production:** `BASE_URL=https://gmp-web-app.vercel.app` (Vercel, from `main`).
- **Develop:** `BASE_URL=https://pablodur2000.github.io/gmp-web-app` (GitHub Pages, from `develop`).
- **Pipeline:** Daily schedule runs against **develop**. Manual run lets you choose **develop** or **production**.
- No API_URL needed unless we add API-level checks later.

### 3.5 Secrets

- For minimal pipeline: no secrets.
- If we add Slack later: `SLACK_WEBHOOK_URL` (and optionally bot token) in repo secrets.
- No TestRail in scope for GMP unless we decide to add it.

---

## 4. Implementation status

- **Done:** `.github/workflows/ui-regression.yml` added with:
  - **Schedule:** `cron: '0 8 * * *'` (daily 08:00 UTC) → runs against **develop** (GitHub Pages).
  - **Manual:** `workflow_dispatch` with input `environment` (develop | production) → sets `BASE_URL` to Pages (dev) or Vercel (prod).
  - Single job: Node 20, `npm ci`, Playwright chromium, `--grep "@smoke|@e2e"`, uploads `playwright-report/` and `test-results/` (14 days).
- **Optional later:** Add `@regression` tag and use `--grep "@regression"`; sharding + merge job when suite grows; Slack/JUnit if needed.

---

## 5. Reference workflow — structure summary

```
Trigger: schedule (cron 08:00 UTC) + workflow_dispatch(environment)
  │
  ├─ Job: regression-tests (matrix: shard 1..4)
  │     Checkout → Node 20 → npm ci → Playwright chromium
  │     → npx playwright test --project=chromium --grep "@regression" --shard=shard/4
  │     → Upload playwright-report + test-results per shard
  │
  └─ Job: merge-and-report (needs: regression-tests, if: always())
        Checkout → Node → Download all shard artifacts
        → Merge JUnit XML (junitparser) + test-results dirs
        → normalize-junit-xml.js
        → [Optional] TestRail publish, TRCLI report, export PDF, attach videos
        → Flaky analysis + tag flaky tests
        → Slack notification
        → Upload merged artifacts
```

This document can live under `Documentation/Planning/` and be used when implementing the GMP UI regression pipeline.
