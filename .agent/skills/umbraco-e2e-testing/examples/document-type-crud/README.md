# Document Type CRUD - E2E Testing Example

This example demonstrates how to write E2E tests for Umbraco backoffice using Playwright with `@umbraco/playwright-testhelpers`.

## What This Example Shows

This example demonstrates:

- **Test Setup** - Using `@umbraco/playwright-testhelpers` fixtures
- **API Helpers** - Fast test data creation via `umbracoApi`
- **UI Helpers** - Page interactions via `umbracoUi`
- **AAA Pattern** - Arrange-Act-Assert test structure
- **Idempotent Cleanup** - Using `ensureNameNotExists` for reliable teardown
- **Authentication Setup** - Separate setup project for login

## Files Included

| File | Description |
|------|-------------|
| `tests/auth.setup.ts` | Authentication setup (runs first) |
| `tests/document-type.spec.ts` | Document type CRUD tests |
| `playwright.config.ts` | Playwright configuration with auth |
| `umbraco.config.ts` | Umbraco instance configuration |
| `package.json` | Dependencies and scripts |

## Project Structure

```
document-type-crud/
├── tests/
│   ├── auth.setup.ts           # Login and save auth state
│   └── document-type.spec.ts   # Document type tests
├── playwright/
│   └── .auth/
│       └── user.json           # Saved auth state (generated)
├── playwright.config.ts
├── umbraco.config.ts
├── package.json
└── README.md
```

## Prerequisites

1. **Running Umbraco instance** - Tests run against a real Umbraco backoffice
2. **Admin credentials** - Valid username/password for the instance
3. **Matching testhelpers version** - The `@umbraco/playwright-testhelpers` version must match your Umbraco version

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `URL` | Umbraco backoffice URL | `https://localhost:44325` |
| `UMBRACO_USER_LOGIN` | Admin email | `admin@example.com` |
| `UMBRACO_USER_PASSWORD` | Admin password | `1234567890` |

## Running the Tests

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Run tests (with environment variables)
URL=https://localhost:44325 \
UMBRACO_USER_LOGIN=admin@example.com \
UMBRACO_USER_PASSWORD=yourpassword \
npm test

# Run with UI mode for debugging
npm run test:ui

# Run in debug mode
npm run test:debug
```

## Critical Configuration

### Test ID Attribute

Umbraco uses `data-mark` as its test ID attribute (not the Playwright default `data-testid`). This **must** be configured in `playwright.config.ts`:

```typescript
export default defineConfig({
  use: {
    // CRITICAL: Umbraco uses 'data-mark' for test IDs
    testIdAttribute: 'data-mark',
    ignoreHTTPSErrors: true,
  },
});
```

Without this setting, the testhelpers' `getByTestId()` calls will fail to find elements.

### Storage State Path

The testhelpers need to know where the auth state is stored. Set the `STORAGE_STAGE_PATH` environment variable in your config:

```typescript
export const STORAGE_STATE = join(__dirname, 'playwright/.auth/user.json');
process.env.STORAGE_STAGE_PATH = STORAGE_STATE;
```

## Test Patterns

### Authentication Setup

The `auth.setup.ts` file uses testhelpers to log in and save the session:

```typescript
import { test as setup } from '@playwright/test';
import { STORAGE_STATE } from '../playwright.config';
import { ConstantHelper, UiHelpers } from '@umbraco/playwright-testhelpers';

setup('authenticate', async ({ page }) => {
  const umbracoUi = new UiHelpers(page);

  await umbracoUi.goToBackOffice();
  await umbracoUi.login.enterEmail(process.env.UMBRACO_USER_LOGIN);
  await umbracoUi.login.enterPassword(process.env.UMBRACO_USER_PASSWORD);
  await umbracoUi.login.clickLoginButton();
  await umbracoUi.login.goToSection(ConstantHelper.sections.settings);
  await umbracoUi.page.context().storageState({ path: STORAGE_STATE });
});
```

### Test with Fixtures

```typescript
import { ConstantHelper, test } from '@umbraco/playwright-testhelpers';
import { expect } from '@playwright/test';

const documentTypeName = 'TestDocumentType';

test.beforeEach(async ({ umbracoApi, umbracoUi }) => {
  await umbracoApi.documentType.ensureNameNotExists(documentTypeName);
  await umbracoUi.goToBackOffice();
});

test.afterEach(async ({ umbracoApi }) => {
  await umbracoApi.documentType.ensureNameNotExists(documentTypeName);
});

test('can create a document type', { tag: '@smoke' }, async ({ umbracoApi, umbracoUi }) => {
  // Arrange
  await umbracoUi.documentType.goToSection(ConstantHelper.sections.settings);

  // Act
  await umbracoUi.documentType.clickActionsMenuAtRoot();
  await umbracoUi.documentType.clickCreateActionMenuOption();
  await umbracoUi.documentType.clickCreateDocumentTypeButton();
  await umbracoUi.documentType.enterDocumentTypeName(documentTypeName);
  await umbracoUi.documentType.clickSaveButton();

  // Assert
  await umbracoUi.documentType.waitForDocumentTypeToBeCreated();
  expect(await umbracoApi.documentType.doesNameExist(documentTypeName)).toBeTruthy();
});
```

### Idempotent Cleanup

```typescript
test.afterEach(async ({ umbracoApi }) => {
  // Won't fail if item doesn't exist
  await umbracoApi.documentType.ensureNameNotExists('TestDocType');
});
```

## Version Compatibility

The `@umbraco/playwright-testhelpers` package is versioned to match Umbraco:

| Umbraco Version | Testhelpers Version |
|-----------------|---------------------|
| Umbraco 17.1.x | `@umbraco/playwright-testhelpers@17.1.0-beta.x` |
| Umbraco 17.0.x | `@umbraco/playwright-testhelpers@^17.0.x` |
| Umbraco 14.x | `@umbraco/playwright-testhelpers@^14.x` |

**Important**: Use the testhelpers version that matches your Umbraco instance. For pre-release Umbraco versions, use the corresponding beta testhelpers.

## Troubleshooting

### "Error refreshing access token"

This usually means there's a version mismatch between the testhelpers and your Umbraco instance, or the authentication state is invalid. Try:

1. Delete `playwright/.auth/user.json` and re-run tests
2. Verify your Umbraco instance is running
3. Check that credentials are correct
4. Ensure `STORAGE_STAGE_PATH` is set correctly

### "Invalid character in header content"

This is a known issue with certain testhelpers versions. Ensure you're using a compatible version for your Umbraco instance.

### Tests timeout waiting for selectors

The testhelpers use specific selectors that may change between Umbraco versions. If you see locator timeouts:

1. **Check `testIdAttribute`** - Must be set to `'data-mark'` in playwright.config.ts
2. Check the Umbraco UI has loaded correctly
3. Verify you're using the correct testhelpers version
4. Check the Umbraco acceptance tests in the source for current patterns

### "element(s) not found" errors

Most likely the `testIdAttribute` is not set correctly. Umbraco uses `data-mark`, not `data-testid`.

## Reference

- **Umbraco Acceptance Tests**: `Umbraco-CMS/tests/Umbraco.Tests.AcceptanceTest`
- **Testhelpers Repo**: https://github.com/umbraco/Umbraco.Playwright.Testhelpers
- **Playwright Docs**: https://playwright.dev/docs/intro

## Skills Referenced

| Skill | What It Covers |
|-------|----------------|
| `umbraco-e2e-testing` | E2E test patterns |
| `umbraco-playwright-testhelpers` | Full testhelpers reference |
| `umbraco-test-builders` | Test data builders |
