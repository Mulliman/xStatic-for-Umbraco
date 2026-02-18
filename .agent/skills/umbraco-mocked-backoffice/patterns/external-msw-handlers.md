# External MSW Handlers

Add MSW handlers in `src/msw/handlers.ts` and load them from your entry point when `VITE_UMBRACO_USE_MSW=on`. Your production code stays unchanged.

> **Note**: For extensions using hey-api/OpenAPI clients, consider the [Mock Repository Pattern](./mock-repository-pattern.md) instead - it's simpler and avoids cross-origin issues.

## Limitations

1. **Cross-Origin Requests**: MSW can only intercept same-origin requests. If your API client uses an absolute `baseUrl` (e.g., `https://localhost:44348`), you must configure it to use relative URLs in mock mode.

2. **TypeScript Source Loading**: When loading TypeScript source directly via `VITE_EXAMPLE_PATH`, dynamic imports with `.js` extensions may not resolve. This affects extensions with lazy-loaded repositories.

3. **hey-api Client**: The generated client uses CommonJS files that need an ESM wrapper for Vite.

## Directory Structure

```
my-extension/Client/
├── src/
│   ├── index.ts          # Entry point (loads handlers when MSW enabled)
│   ├── manifests.ts      # Your extension manifests
│   ├── api/
│   │   ├── client.gen.ts # hey-api generated client
│   │   └── client/
│   │       ├── index.cjs # CommonJS (generated)
│   │       └── index.js  # ESM wrapper (you create this)
│   ├── msw/              # MSW handlers
│   │   └── handlers.ts   # Exports createHandlers() function
│   └── ...
└── tests/
    └── msw/
        ├── playwright.config.ts
        └── my-extension.spec.ts
```

## Step 1: Create ESM Wrapper for hey-api Client

If using hey-api, create `src/api/client/index.js`:

```typescript
// ESM wrapper for hey-api client (CommonJS)
import cjs from './index.cjs';

export const {
  createClient,
  createConfig,
  formDataBodySerializer,
  jsonBodySerializer,
  urlSearchParamsBodySerializer,
} = cjs;

export default cjs;
```

## Step 2: Configure Client for Mock Mode

In your entrypoint, detect mock mode and use relative URLs:

```typescript
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import type { UmbEntryPointOnInit } from "@umbraco-cms/backoffice/extension-api";
import { client } from "../api";

// Detect mock mode - not on the real backend port
const isMockMode = () => {
  const isBackendPort = window.location.port === '44348' ||
                        window.location.port === '443' ||
                        window.location.port === '';
  return !isBackendPort;
};

export const onInit: UmbEntryPointOnInit = (_host) => {
  if (isMockMode()) {
    // Use relative URLs so MSW can intercept same-origin requests
    client.setConfig({ baseUrl: '' });
    console.log('🎭 Mock mode - using relative URLs');
    return;
  }

  // Production mode - use auth context
  _host.consumeContext(UMB_AUTH_CONTEXT, (_auth) => {
    if (!_auth) return;
    const config = _auth.getOpenApiConfiguration();
    client.setConfig({
      baseUrl: config.base,
      credentials: config.credentials,
    });
    // ... add auth interceptor
  });
};
```

## Step 3: Create MSW Handlers

Create `src/msw/handlers.ts`:

```typescript
// Handler factory - gets http/HttpResponse from Umbraco's MSW instance at runtime
export function createHandlers() {
  const { http, HttpResponse } = (window as any).MockServiceWorker;

  // Mock data
  const items = [
    { id: 'item-1', name: '[MSW] Item 1', icon: 'icon-document' },
    { id: 'item-2', name: '[MSW] Item 2', icon: 'icon-folder' },
  ];

  // Use relative paths (same-origin)
  const API_PATH = '/umbraco/myextension/api/v1';

  return [
    http.get(`${API_PATH}/items`, () => {
      return HttpResponse.json({ total: items.length, items });
    }),

    http.post(`${API_PATH}/items`, async ({ request }: { request: Request }) => {
      const body = await request.json();
      return HttpResponse.json({ id: 'new-id', ...body }, { status: 201 });
    }),
  ];
}
```

## Step 4: Load Handlers from Entry Point

Update `src/index.ts` to register handlers when MSW is enabled:

```typescript
// Register MSW handlers when running in MSW mode
if (import.meta.env.VITE_UMBRACO_USE_MSW === 'on') {
  import('./msw/handlers.js').then(({ createHandlers }) => {
    const { addMockHandlers } = (window as any).MockServiceWorker;
    addMockHandlers(...createHandlers());
  });
}

// Export manifests
export const manifests = (await import('./manifests.js')).manifests;
```

## Running

```bash
cd /path/to/Umbraco-CMS/src/Umbraco.Web.UI.Client

# Point to the Client directory containing src/index.ts
VITE_EXAMPLE_PATH=/path/to/my-extension/Client VITE_UMBRACO_USE_MSW=on npm run dev
```

### Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_EXAMPLE_PATH` | `/path/to/extension/Client` | Path to extension directory |
| `VITE_UMBRACO_USE_MSW` | `on` | Enable MSW for core Umbraco APIs and your handlers |

You'll see in the browser console:
```
[MSW] Custom handlers registered
```

## Working Example

See **tree-example** in `umbraco-backoffice/examples/tree-example/Client/`:

| Path | Description |
|------|-------------|
| `src/index.ts` | Entry point with MSW handler registration |
| `src/msw/handlers.ts` | MSW handlers using `createHandlers()` pattern |
| `tests/msw/playwright.config.ts` | Playwright config with webServer |
| `tests/msw/tree.spec.ts` | Test suite (6 tests) |

### Running the Tree Example Tests

```bash
cd /path/to/tree-example/Client
export UMBRACO_CLIENT_PATH=/path/to/Umbraco-CMS/src/Umbraco.Web.UI.Client

npm run test:msw
```
