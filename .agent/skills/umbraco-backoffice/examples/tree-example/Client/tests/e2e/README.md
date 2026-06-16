# E2E Tests (Real Umbraco Instance)

This directory contains tests that run against a **real Umbraco instance** with the extension installed.

## How It Works

1. The extension is built and installed on a real Umbraco instance
2. Tests authenticate using `@umbraco/playwright-testhelpers`
3. Tests interact with the real backoffice UI
4. The real backend API processes all requests

## When to Use

- **Full integration testing** - Test the complete stack
- **Production-like testing** - Closest to real user experience
- **API contract verification** - Ensure backend/frontend work together
- **Pre-release validation** - Final check before deploying

## When NOT to Use

- Fast iteration during development (use mock-repo instead)
- Testing UI-only changes (use mock-repo instead)
- Testing specific API error scenarios (use MSW instead)
- When no Umbraco instance is available

## Prerequisites

1. **Running Umbraco instance** with the tree-example extension installed
2. **Environment variables** set:
   - `URL` - Umbraco backoffice URL (default: https://localhost:44325)
   - `UMBRACO_USER_LOGIN` - Admin email
   - `UMBRACO_USER_PASSWORD` - Admin password

## Running Tests

```bash
# From the Client directory
URL=https://localhost:44325 \
UMBRACO_USER_LOGIN=admin@example.com \
UMBRACO_USER_PASSWORD=yourpassword \
npm run test:e2e

# Or run directly
npx playwright test --config=tests/e2e/playwright.config.ts
```

## Files

- `playwright.config.ts` - Playwright configuration with auth setup
- `auth.setup.ts` - Authentication setup (runs before tests)
- `tree.spec.ts` - Tree component E2E tests
- `.auth/` - Storage for authentication state (gitignored)

## Authentication

Tests use `@umbraco/playwright-testhelpers` for authentication:

1. `auth.setup.ts` runs first to log in and save session
2. Test projects depend on `setup` project
3. Session is stored in `.auth/user.json`
4. Subsequent tests reuse the authenticated session

## Key Differences from Other Approaches

| Aspect | Mock Repository | MSW | E2E |
|--------|----------------|-----|-----|
| Backend | None | None | Real |
| Network | None | Intercepted | Real |
| Speed | Fastest | Fast | Slowest |
| Realism | Lowest | Medium | Highest |
| Setup | Minimal | Minimal | Full Umbraco |
