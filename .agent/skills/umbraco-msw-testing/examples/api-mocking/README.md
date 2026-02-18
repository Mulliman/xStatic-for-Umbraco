# API Mocking Example - MSW Testing

This example demonstrates how to use MSW (Mock Service Worker) to mock Umbraco APIs for testing backoffice extensions without a running Umbraco instance.

## What This Example Shows

This example demonstrates:

- **MSW Handler Setup** - Creating handlers for Umbraco API endpoints
- **Mock Database** - Stateful mock data management
- **Error Simulation** - Testing error states and edge cases
- **Handler Override** - Per-test handler customization

## Files Included

| File | Description |
|------|-------------|
| `mocks/handlers.ts` | API handlers using MSW v2 syntax |
| `mocks/items.db.ts` | Mock database for items |
| `mocks/setup.ts` | MSW worker setup |
| `items-list.element.ts` | Element that fetches from API |
| `items-list.element.test.ts` | Tests with mocked API |

## Project Structure

```
api-mocking/
├── src/
│   ├── mocks/
│   │   ├── handlers.ts         # MSW handlers
│   │   ├── items.db.ts         # Mock database
│   │   └── setup.ts            # Worker setup
│   ├── items-list.element.ts   # Component using API
│   └── items-list.element.test.ts # Tests
├── web-test-runner.config.mjs
├── package.json
└── README.md
```

## Key Patterns

### 1. MSW Handler (v2 Syntax)

```typescript
const { http, HttpResponse } = window.MockServiceWorker;
import { umbracoPath } from '@umbraco-cms/backoffice/utils';

export const handlers = [
  http.get(umbracoPath('/items'), () => {
    return HttpResponse.json({
      total: items.length,
      items: items,
    });
  }),
];
```

### 2. Mock Database

```typescript
class ItemsMockDb {
  private items: Item[] = [...initialItems];

  getAll() { return [...this.items]; }
  getById(id: string) { return this.items.find(i => i.id === id); }
  create(item: Item) { this.items.push(item); }
  delete(id: string) { this.items = this.items.filter(i => i.id !== id); }
}
```

### 3. Error Simulation

```typescript
http.get(umbracoPath('/items/:id'), ({ params }) => {
  const id = params.id as string;

  // Simulate forbidden access
  if (id === 'forbidden') {
    return new HttpResponse(null, { status: 403 });
  }

  // Simulate not found
  const item = db.getById(id);
  if (!item) {
    return new HttpResponse(null, { status: 404 });
  }

  return HttpResponse.json(item);
}),
```

### 4. Delay Simulation (Loading States)

```typescript
http.get(umbracoPath('/slow-endpoint'), async () => {
  await delay(2000); // 2 second delay
  return HttpResponse.json({ data: 'loaded' });
}),
```

## Running the Tests

```bash
npm install  # Automatically runs 'msw init' to create mockServiceWorker.js
npm test
```

**Note**: The `postinstall` script runs `npx msw init . --save` to generate the `mockServiceWorker.js` file required for browser-based MSW testing.

## Skills Referenced

| Skill | What It Covers |
|-------|----------------|
| `umbraco-msw-testing` | MSW handler patterns |
| `umbraco-unit-testing` | @open-wc/testing integration |
