# GMP Web App E2E Tests

This repository contains end-to-end tests for the GMP Web App using Playwright.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npm run test:install
```

## Running Tests

- Run all tests: `npm test`
- Run tests in UI mode: `npm run test:ui`
- Run tests in headed mode: `npm run test:headed`
- Run tests in debug mode: `npm run test:debug`
- Generate test code: `npm run test:codegen`
- View test report: `npm run test:report`

## Configuration

The test configuration is in `playwright.config.ts`. Tests use `BASE_URL` from the environment:
- **Production (default):** `https://pablodur2000.github.io/gmp-web-app` — use `npm run test:ui` or `npm run test:production:ui`
- **Local:** `http://localhost:3000/gmp-web-app` — use `npm run test:local:ui` (start the app locally first)
- Run on Chromium by default; HTML reports on failure. See `Documentation/Guides/ENVIRONMENT_CONFIGURATION.md` for details.

## Documentation

- **Rules and guides:** `Documentation/Guides/` — PROJECT_RULES_AND_GUIDELINES.md, TEST_CREATION_GUIDE.md, ENVIRONMENT_CONFIGURATION.md
- **Test patterns:** `Documentation/Tests/` — patterns, pitfalls, quick reference

## Jira scripts (optional)

Live in `scripts/`. Require `.env` with Jira credentials (`JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, etc.). See `.env.example`.

| Script | Command | Purpose |
|--------|---------|---------|
| update-jira | `npm run update-jira` | Update Jira ticket descriptions from markdown in `possible_tickets/` |
| update-ticket-status | `npm run update-ticket-status` | Set ticket status to Done and assign |
| create-epics | `npm run create-epics` | Create QA Epics in Jira |
| create-ticket | `npm run create-ticket -- <path-to-md>` | Create a Jira ticket from a markdown file |
| analyze-qa-board | `npm run analyze-qa-board` | Analyze QA board (duplicates, structure) |

## Test Structure

Tests are located in the `tests/` directory. Each test file should follow the naming convention `*.spec.ts`.

## Writing Tests

Use Playwright's codegen tool to help write tests:
```bash
npm run test:codegen
```

This will open a browser and record your interactions, generating test code.

