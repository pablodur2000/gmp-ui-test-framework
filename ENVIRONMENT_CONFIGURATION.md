# Environment Configuration Guide

## Overview

The test suite supports multiple environments for running tests:
- **Production** (default): `https://pablodur2000.github.io/gmp-web-app/`
- **Local**: `http://localhost:3000/gmp-web-app/`

## Quick Start

### Install Dependencies First
```bash
npm install
```
This will install `cross-env` which is needed for environment variable support.

### Run Tests Against Production (GitHub Pages)
```bash
npm run test:ui
# or
npm run test:production:ui
```

### Run Tests Against Local Development Server
```bash
npm run test:local:ui
```

**Note:** Make sure your local dev server is running on `http://localhost:3000/gmp-web-app/` before running local tests.

### Windows PowerShell Alternative (if cross-env doesn't work)
```powershell
# Local
npm run test:local:pwsh

# Production
npm run test:production:pwsh
```

## Available Commands

### Production (GitHub Pages) - Default
```bash
npm run test                    # Run tests (headless)
npm run test:ui                 # Run tests with UI mode
npm run test:headed             # Run tests in headed mode
npm run test:production          # Explicitly run against production
npm run test:production:ui       # Explicitly run against production with UI
```

### Local Development Server
```bash
npm run test:local              # Run tests against localhost:3000
npm run test:local:ui           # Run tests against localhost:3000 with UI
```

## Environment Variables

You can also set the base URL directly using environment variables:

### Using BASE_URL
```bash
# Windows PowerShell
$env:BASE_URL="http://localhost:3000/gmp-web-app"; npm run test:ui

# Windows CMD
set BASE_URL=http://localhost:3000/gmp-web-app && npm run test:ui

# Linux/Mac
BASE_URL=http://localhost:3000/gmp-web-app npm run test:ui
```

### Using APP_URL (alternative)
```bash
# Windows PowerShell
$env:APP_URL="http://localhost:3000/gmp-web-app"; npm run test:ui

# Linux/Mac
APP_URL=http://localhost:3000/gmp-web-app npm run test:ui
```

## Priority Order

The base URL is determined in this priority order:
1. `BASE_URL` environment variable
2. `APP_URL` environment variable
3. Default: `https://pablodur2000.github.io/gmp-web-app`

## Configuration Files

### playwright.config.ts
- Reads `BASE_URL` or `APP_URL` from environment
- Falls back to production URL if not set
- Logs the URL being used when tests start

### tests/utils/navigation.ts
- Uses the same environment variables
- Ensures consistency between config and navigation helpers

## Setting Up Local Development Server

To test against localhost, ensure your dev server is running:

```bash
# In gmp-web-app directory
cd ../gmp-web-app
npm run dev
# Server should be accessible at http://localhost:3000/gmp-web-app/
```

**Note:** The port and path may vary. Adjust `BASE_URL` accordingly if your local server uses a different configuration.

## Examples

### Test Against Local Development
```bash
# Terminal 1: Start dev server
cd ../gmp-web-app
npm run dev

# Terminal 2: Run tests
cd gmp-ui-test
npm run test:local:ui
```

### Test Against Production
```bash
# Just run tests (production is default)
npm run test:ui
```

### Custom URL
```bash
# Test against staging or custom URL
$env:BASE_URL="https://staging.example.com/gmp-web-app"; npm run test:ui
```

## Troubleshooting

### Tests Fail Against Localhost
1. **Check if server is running:**
   ```bash
   curl http://localhost:3000/gmp-web-app/
   ```

2. **Verify the URL in console:**
   - When tests start, you should see: `🌐 Testing against: http://localhost:3000/gmp-web-app/`

3. **Check port and path:**
   - Ensure your dev server matches the URL in the test command
   - Adjust `BASE_URL` if your server uses a different port/path

### Tests Use Wrong Environment
- Check environment variables: `echo $BASE_URL` (Linux/Mac) or `echo %BASE_URL%` (Windows)
- Use explicit commands: `npm run test:local:ui` or `npm run test:production:ui`
- Clear any `.env` files that might override settings

## Best Practices

1. **Use explicit commands** for clarity:
   - `npm run test:local:ui` for local testing
   - `npm run test:production:ui` for production testing

2. **Verify the URL** in the console output when tests start

3. **Keep environments separate:**
   - Don't mix local and production tests in the same run
   - Use different terminal sessions for different environments

4. **CI/CD:**
   - In CI, explicitly set `BASE_URL` environment variable
   - Don't rely on defaults in automated pipelines

