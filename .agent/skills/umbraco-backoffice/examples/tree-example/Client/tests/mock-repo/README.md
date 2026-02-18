# Mock Repository Tests

This directory contains tests that use an **in-memory mock repository** instead of making real API calls.

## How It Works

1. The extension's `index.ts` checks for `VITE_USE_MOCK_REPO=true`
2. When enabled, it swaps the real repository with `mock/mock-repository.ts`
3. The mock repository returns static data from `mock/mock-data.ts`
4. No network requests are made - everything runs in-memory

## When to Use

- **Fast iteration** - Tests run quickly without network latency
- **UI testing** - Focus on component rendering and interactions
- **Offline development** - No backend needed

## When NOT to Use

- Testing API integration
- Testing error handling from network failures
- Testing exact API response formats

## Running Tests

```bash
# From the Client directory
npm run test:mock-repo

# Or run directly
npx playwright test --config=tests/mock-repo/playwright.config.ts
```

## Files

- `playwright.config.ts` - Playwright configuration
- `tree.spec.ts` - Tree component tests

## Mock Data Location

The mock data is defined in:
- `Client/mock/mock-data.ts` - Static tree items
- `Client/mock/mock-repository.ts` - In-memory repository implementation
