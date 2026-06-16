# Tests for tree-example

This example demonstrates three testing strategies for Umbraco backoffice extensions.

## Setup

### 1. Install dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Configure environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your local paths:

```bash
# Path to Umbraco.Web.UI.Client source
UMBRACO_CLIENT_PATH=/path/to/Umbraco-CMS/src/Umbraco.Web.UI.Client

# E2E test configuration (only needed for test:e2e)
URL=https://localhost:44325
UMBRACO_USER_LOGIN=admin@example.com
UMBRACO_USER_PASSWORD=your-password
```

---

## Running Tests

### Using helper scripts (recommended)

```bash
# Run all tests
./scripts/test.sh

# Run specific test suite
./scripts/test.sh mock-repo
./scripts/test.sh msw
./scripts/test.sh e2e
```

### Using npm directly

```bash
npm run test:mock-repo    # In-memory mock repository
npm run test:msw          # MSW network interception
npm run test:e2e          # Real Umbraco instance
```

Add `:headed` or `:ui` suffix for debugging:

```bash
npm run test:mock-repo:headed   # See the browser
npm run test:mock-repo:ui       # Interactive Playwright UI
```

---

## Running Dev Server

Use the helper script to start the dev server in different modes:

```bash
# Mock repository mode (no API calls)
./scripts/dev.sh mock-repo

# MSW mode (network interception)
./scripts/dev.sh msw

# Real mode (connect to real Umbraco backend)
./scripts/dev.sh real
```

Then open http://localhost:5173/umbraco in your browser.

---

## Directory Structure

```
src/
├── msw/
│   └── handlers.ts      # MSW handlers (registered via addMockHandlers)

tests/
├── mock-repo/           # In-memory mock repository tests
│   ├── mock/            # Mock repository & data
│   ├── playwright.config.ts
│   ├── tree.spec.ts
│   └── README.md
├── msw/                 # MSW network interception tests
│   ├── mocks/           # Re-exports handlers from src/msw
│   ├── playwright.config.ts
│   ├── tree.spec.ts
│   └── README.md
├── e2e/                 # Real Umbraco instance tests
│   ├── playwright.config.ts
│   ├── auth.setup.ts
│   ├── tree.spec.ts
│   └── README.md
└── README.md            # This file
```

---

## When to Use Each Approach

| Approach | Speed | Realism | Backend | Best For |
|----------|-------|---------|---------|----------|
| Mock Repo | Fastest | Low | None | UI iteration, offline dev |
| MSW | Fast | Medium | None | API contracts, error scenarios |
| E2E | Slow | High | Required | Integration, pre-release |

---

## CI/CD

```yaml
# Fast feedback (no backend required)
- ./scripts/test.sh mock-repo
- ./scripts/test.sh msw

# Full integration (requires Umbraco instance)
- ./scripts/test.sh e2e
```
