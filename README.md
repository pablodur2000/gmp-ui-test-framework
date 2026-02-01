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

The test configuration is in `playwright.config.ts`. By default, tests will:
- Run against `http://localhost:5173` (the default Vite dev server port)
- Automatically start the dev server from the `gmp-web-app` directory
- Run on Chromium, Firefox, and WebKit browsers
- Generate HTML reports on failure

## Test Structure

Tests are located in the `tests/` directory. Each test file should follow the naming convention `*.spec.ts`.

## Writing Tests

Use Playwright's codegen tool to help write tests:
```bash
npm run test:codegen
```

This will open a browser and record your interactions, generating test code.

