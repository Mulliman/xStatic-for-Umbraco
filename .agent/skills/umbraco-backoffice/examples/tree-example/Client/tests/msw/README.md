# MSW (Mock Service Worker) Tests

This directory contains tests that use **MSW to intercept HTTP requests** at the network level.

## How It Works

1. The extension uses the **real repository** that makes actual HTTP requests
2. MSW intercepts those requests in the browser's service worker
3. MSW handlers return mock responses without hitting a real server
4. Tests verify the full HTTP request/response cycle

## When to Use

- **Integration testing** - Test the actual HTTP layer
- **API contract testing** - Verify your code handles API responses correctly
- **Error scenario testing** - Test loading states, errors, retries
- **Realistic testing** - Closer to production behavior than mock repository

## When NOT to Use

- When you want the fastest possible tests (use mock-repo instead)
- When testing pure UI logic with no API interaction

## Running Tests

```bash
# From the Client directory
npm run test:msw

# Or run directly
npx playwright test --config=tests/msw/playwright.config.ts
```

## Files

- `playwright.config.ts` - Playwright configuration
- `tree.spec.ts` - Tree component tests
- `debug.spec.ts` - Debug/diagnostic tests

## MSW Handlers Location

The MSW handlers are defined in:
- `src/msw/handlers.ts` - HTTP request handlers (registered via `addMockHandlers()`)

The extension's `index.ts` registers these handlers when `VITE_UMBRACO_USE_MSW=on` is set.

## Key Differences from Mock Repository

| Aspect | Mock Repository | MSW |
|--------|----------------|-----|
| Network requests | None | Intercepted |
| Repository | Swapped | Real |
| Speed | Faster | Slightly slower |
| Realism | Lower | Higher |
| Error testing | Limited | Full control |
