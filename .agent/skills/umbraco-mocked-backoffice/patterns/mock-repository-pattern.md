# Mock Repository Pattern

Replace the API-calling repository with a mock version that returns data directly. This approach:

- Bypasses the API client entirely for your extension's custom API
- Tests UI rendering and interactions without network calls
- Still requires MSW for core Umbraco management APIs (authentication, user data, etc.)

> **Alternative**: For testing with MSW intercepting all HTTP requests, see [External MSW Handlers](./external-msw-handlers.md).

## When to Use Each Approach

| Scenario | Recommended Approach |
|----------|---------------------|
| Want to test UI without any custom API calls | **Mock Repository Pattern** |
| Want to test full HTTP request/response cycle | MSW Handlers |
| Need fine-grained API control (errors, delays) | MSW Handlers |

## Directory Structure

```
my-extension/Client/
├── src/
│   ├── index.ts              # Entry point (loads mock or real manifests)
│   ├── manifests.ts          # Production manifests
│   └── ...                   # Production code
└── tests/
    └── mock-repo/
        ├── playwright.config.ts
        ├── my-extension.spec.ts
        └── mock/
            ├── index.ts          # Mock manifests (replaces repository)
            ├── mock-repository.ts # Repository returning mock data
            └── mock-data.ts      # Test data
```

## Step 1: Create Entry Point

Update `src/index.ts` to conditionally load mock manifests:

```typescript
// Entry point for external extension loading
// Run from Umbraco.Web.UI.Client with:
//   VITE_EXAMPLE_PATH=/path/to/extension/Client VITE_UMBRACO_USE_MSW=on npm run dev
//   VITE_EXAMPLE_PATH=/path/to/extension/Client VITE_USE_MOCK_REPO=on VITE_UMBRACO_USE_MSW=on npm run dev

// Register MSW handlers when running in MSW mode (but not mock-repo mode)
if (import.meta.env.VITE_UMBRACO_USE_MSW === 'on' && import.meta.env.VITE_USE_MOCK_REPO !== 'on') {
  import('./msw/handlers.js').then(({ createHandlers }) => {
    const { addMockHandlers } = (window as any).MockServiceWorker;
    addMockHandlers(...createHandlers());
  });
}

// Export manifests - use mock repository if VITE_USE_MOCK_REPO is set
export const manifests = import.meta.env.VITE_USE_MOCK_REPO === 'on'
  ? (await import('../tests/mock-repo/mock/index.js')).manifests
  : (await import('./manifests.js')).manifests;
```

## Step 2: Create Mock Manifests

Create `tests/mock-repo/mock/index.ts`:

```typescript
import { manifests as productionManifests } from '../../../src/manifests.js';

// Mock repository manifest (replaces the API-calling one)
const mockRepositoryManifest: UmbExtensionManifest = {
  type: 'repository',
  alias: 'MyExtension.Repository',  // Same alias as original
  name: 'MyExtension Repository (Mock)',
  api: () => import('./mock-repository.js'),
};

// Filter out original repository, keep everything else
const filteredManifests = productionManifests.filter(
  (m) => m.alias !== 'MyExtension.Repository'
);

export const manifests: Array<UmbExtensionManifest> = [
  mockRepositoryManifest,
  ...filteredManifests,
];
```

## Step 3: Create Mock Repository

Create `tests/mock-repo/mock/mock-repository.ts`:

```typescript
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import type { UmbApi } from '@umbraco-cms/backoffice/extension-api';
import { UmbTreeRepositoryBase } from '@umbraco-cms/backoffice/tree';

// Import types from original src files
import type { MyItemModel, MyRootModel } from '../../../src/feature/types.js';
import { rootItems, childrenByParent } from './mock-data.js';

class MockTreeDataSource {
  constructor(_host: UmbControllerHost) {}

  async getRootItems(args: { skip: number; take: number }) {
    const items = rootItems.slice(args.skip, args.skip + args.take);
    return { data: { total: rootItems.length, items: this.#mapItems(items) } };
  }

  async getChildrenOf(args: { parent: { unique: string | null } }) {
    if (!args.parent?.unique) {
      return this.getRootItems({ skip: 0, take: 100 });
    }
    const children = childrenByParent[args.parent.unique] || [];
    return { data: { total: children.length, items: this.#mapItems(children) } };
  }

  async getAncestorsOf() {
    return { data: [] };
  }

  #mapItems(items: any[]): MyItemModel[] {
    return items.map((item) => ({
      unique: item.id,
      name: item.name,
      hasChildren: item.hasChildren,
      icon: item.icon,
      // ... map other fields
    }));
  }
}

export class MockTreeRepository
  extends UmbTreeRepositoryBase<MyItemModel, MyRootModel>
  implements UmbApi
{
  constructor(host: UmbControllerHost) {
    super(host, MockTreeDataSource);
  }

  async requestTreeRoot() {
    return {
      data: {
        unique: null,
        name: 'My Tree Root',
        icon: 'icon-star',
        hasChildren: true,
        isFolder: true,
      },
    };
  }
}

export { MockTreeRepository as api };
```

## Step 4: Create Mock Data

Create `tests/mock-repo/mock/mock-data.ts`:

```typescript
export interface MockTreeItem {
  id: string;
  name: string;
  icon: string;
  hasChildren: boolean;
}

export const rootItems: MockTreeItem[] = [
  { id: 'item-1', name: '[Mock Repo] Group A', icon: 'icon-folder', hasChildren: true },
  { id: 'item-2', name: '[Mock Repo] Group B', icon: 'icon-folder', hasChildren: false },
];

export const childrenByParent: Record<string, MockTreeItem[]> = {
  'item-1': [
    { id: 'item-1-1', name: '[Mock Repo] Child 1', icon: 'icon-document', hasChildren: false },
  ],
};
```

**Important**: Keep mock data in a separate file that's NOT exported from `index.ts`. If arrays are exported directly, Umbraco will try to register them as extensions.

## Step 5: Create Playwright Config

Create `tests/mock-repo/playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const EXTENSION_PATH = resolve(__dirname, '../..');
const UMBRACO_CLIENT_PATH = process.env.UMBRACO_CLIENT_PATH;
if (!UMBRACO_CLIENT_PATH) {
  throw new Error('UMBRACO_CLIENT_PATH environment variable is required');
}

const DEV_SERVER_PORT = 5175;

export default defineConfig({
  testDir: '.',
  testMatch: ['*.spec.ts'],
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,

  // Start dev server with mock repository AND MSW (for core Umbraco APIs)
  webServer: {
    command: `VITE_EXAMPLE_PATH=${EXTENSION_PATH} VITE_USE_MOCK_REPO=on VITE_UMBRACO_USE_MSW=on npm run dev -- --port ${DEV_SERVER_PORT}`,
    cwd: UMBRACO_CLIENT_PATH,
    port: DEV_SERVER_PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  use: {
    baseURL: `http://localhost:${DEV_SERVER_PORT}`,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

## Running

```bash
# Set the path to Umbraco.Web.UI.Client
export UMBRACO_CLIENT_PATH=/path/to/Umbraco-CMS/src/Umbraco.Web.UI.Client

# Run mock-repo tests
npm run test:mock-repo
```

Or run the dev server manually:

```bash
cd /path/to/Umbraco-CMS/src/Umbraco.Web.UI.Client
VITE_EXAMPLE_PATH=/path/to/my-extension/Client VITE_USE_MOCK_REPO=on VITE_UMBRACO_USE_MSW=on npm run dev
```

## Important Notes

1. **MSW is still required** - The mock repository only replaces your extension's custom API. Core Umbraco management APIs (authentication, user data, sections, etc.) still need MSW to be enabled.

2. **Use consistent env var values** - Both `VITE_USE_MOCK_REPO=on` and `VITE_UMBRACO_USE_MSW=on` use `=on` (not `=true`).

3. **Vite's `/@fs/` prefix** - External extensions are loaded via Vite's `/@fs/` URL prefix for absolute paths.

## Working Example

See **tree-example** in `umbraco-backoffice-skills/examples/tree-example/Client/`:

| Path | Description |
|------|-------------|
| `src/index.ts` | Entry point with conditional manifest loading |
| `tests/mock-repo/mock/` | Mock repository implementation |
| `tests/mock-repo/playwright.config.ts` | Playwright test config |

```bash
cd tree-example/Client
export UMBRACO_CLIENT_PATH=/path/to/Umbraco-CMS/src/Umbraco.Web.UI.Client
npm run test:mock-repo
```
