# Mock Mode for tree-example

Run the tree extension in the mocked Umbraco backoffice without a .NET backend.

## Run

```bash
cd /path/to/Umbraco-CMS/src/Umbraco.Web.UI.Client
VITE_EXTERNAL_EXTENSION=/path/to/tree-example/Client npm run dev:external
```

Open http://localhost:5173 and navigate to Settings section.

## What's Mocked

- Tree API calls replaced with mock data (no backend required)
- No authentication required (MSW mode)
- Tree items: Settings Group A, Settings Group B, Configuration
- Children available for Settings Group A and B

## How It Works

The mock setup replaces the real `OurTreeRepository` (which calls the C# backend API) with a `MockTreeRepository` that returns mock data directly. This allows the tree to render without any network calls.

### File Structure

```
Client/
├── index.ts              # Entry point - loads mock manifests
├── mock/
│   ├── index.ts          # Imports manifests from src/, replaces repository
│   ├── mock-repository.ts # Mock repository using mock data
│   └── mock-data.ts      # Mock tree items
└── src/                  # Original production code (unchanged)
```

The `Client/index.ts` file is the entry point that loads `mock/index.ts`, which in turn:
1. Imports all manifests from `../src/`
2. Filters out the original `OurTree.Repository`
3. Adds the mock repository instead

This approach keeps the mock code minimal - only the data layer is mocked while reusing all UI components from `src/`.
