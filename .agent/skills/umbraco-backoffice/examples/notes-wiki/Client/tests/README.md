# Notes Wiki E2E Tests

End-to-end tests for the Notes Wiki extension using Playwright and a running Umbraco instance.

## Prerequisites

1. **Umbraco instance running** with the notes-wiki extension installed
2. **Backend API running** (the NotesWiki C# project)
3. **Dependencies installed**: Run `npm install` in the Client folder

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `URL` | No | Umbraco backoffice URL | `https://localhost:44325` (default) |
| `UMBRACO_USER_LOGIN` | Yes | Admin email | `admin@example.com` |
| `UMBRACO_USER_PASSWORD` | Yes | Admin password | `yourpassword` |
| `UMBRACO_DATA_PATH` | Optional | Path to Umbraco's App_Data folder | `/path/to/Umbraco.Web.UI/App_Data` |

## Running Tests

```bash
# Basic run (works with default sample data)
URL=https://localhost:44325 \
UMBRACO_USER_LOGIN=admin@example.com \
UMBRACO_USER_PASSWORD=yourpassword \
npm run test:e2e

# With data reset (recommended for CI)
URL=https://localhost:44325 \
UMBRACO_USER_LOGIN=admin@example.com \
UMBRACO_USER_PASSWORD=yourpassword \
UMBRACO_DATA_PATH=/path/to/App_Data \
npm run test:e2e

# With headed browser (see the browser)
npm run test:e2e:headed

# With Playwright UI (interactive debugging)
npm run test:e2e:ui
```

## Test Data

Tests are designed to work with the **default sample data** that Notes Wiki creates on first run:

- **Getting Started** folder containing:
  - "Welcome to Notes Wiki"
  - "How to Create Notes"
- **Project Notes** folder containing:
  - "Sample Project Note"

### Optional: Data Reset

When `UMBRACO_DATA_PATH` is set, the tests automatically reset the Notes Wiki data to the seed state before each test run. This is useful for CI pipelines.

The seed data (`test-seed-data.json`) mirrors the default sample data structure.

If `UMBRACO_DATA_PATH` is not set, a warning is shown and data reset is skipped - tests will run against whatever data exists.

## Test Structure

The tests are organized by functionality (16 tests total, using testhelpers where possible):

- **Tree Navigation** (4 tests) - Section visibility, tree items, folder expansion, navigation
- **Dashboard** (2 tests) - Welcome dashboard, recent notes display
- **Folder Operations** (3 tests) - Folder workspace, action buttons, actions menu
- **Create Operations** (2 tests) - Create Note button, new note workspace
- **Navigation** (2 tests) - Dashboard tabs, tree header
- **Workspace** (2 tests) - Folder and note workspace loading

## Key Testing Patterns

### Selecting Custom Sections
Umbraco sections are rendered as **tabs**, not buttons:
```typescript
// Correct - sections are tabs
await page.getByRole('tab', { name: 'Notes' }).click();

// Wrong - sections are NOT buttons
await page.getByRole('button', { name: 'Notes' }).click();
```

### Custom Element Selectors
Use the actual custom element tag names:
```typescript
// Note workspace
await page.locator('notes-note-workspace-editor').waitFor();

// Folder workspace
await page.locator('folder-workspace-editor-element').waitFor();
```

### Scoping to Specific Tree Items
When multiple tree items exist, scope selectors to avoid ambiguity:
```typescript
const folderMenu = page.getByRole('menu').filter({ hasText: 'Getting Started' });
const createButton = folderMenu.getByRole('button', { name: 'Create Note' });
```

## Troubleshooting

### Tests fail to find elements
- Ensure the extension is properly installed and built
- Check that the Umbraco instance is running
- Verify your credentials are correct

### Tests can't find tree items
- Tests expect "Getting Started" and "Project Notes" folders
- If data was deleted, restart Umbraco to recreate sample data
- Or set `UMBRACO_DATA_PATH` to reset data before tests

### Authentication issues
- Delete the `.auth/` folder and re-run tests
- Verify the user has access to the Notes section
