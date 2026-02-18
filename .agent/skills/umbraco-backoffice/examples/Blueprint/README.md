# Blueprint - Section with Menu, Dashboard & Workspace

A starter template demonstrating the fundamental Umbraco backoffice extension pattern: a custom section with sidebar navigation, dashboard, and workspace.

## What This Example Shows

This is the simplest complete example of a custom section. Use it as a starting point when you need:

- A new top-level navigation item in the backoffice
- A sidebar with menu items
- A dashboard that shows when nothing is selected
- A workspace that opens when clicking menu items

## Extension Types Used

| Extension Type | Alias | Purpose |
|----------------|-------|---------|
| Section | `Blueprint.Section` | Top-level navigation in header bar |
| SectionSidebarApp | `Blueprint.SidebarApp` | Container for menu in sidebar |
| Menu | `Blueprint.Menu` | Menu container in sidebar |
| MenuItem | `Blueprint.MenuItem` | Clickable item that opens workspace |
| Dashboard | `Blueprint.Dashboard` | Welcome panel (shows when nothing selected) |
| Workspace | `Blueprint.Workspace` | Editing view (opens when item clicked) |
| WorkspaceView | `Blueprint.WorkspaceView.*` | Tabs within the workspace |
| WorkspaceContext | `Blueprint.WorkspaceContext.Counter` | Shared state for workspace |

## Visual Structure

```
+--------------------------------------------------+
| Content | Media | Settings | [BLUEPRINT]          |  <- Section in top nav
+--------------------------------------------------+
| SIDEBAR          |  MAIN AREA                     |
| +-------------+  |  +-------------------------+   |
| | Items       |  |  | Dashboard               |   |  <- Shows when no item selected
| | - My Item   |  |  | "Welcome to Blueprint"  |   |
| +-------------+  |  +-------------------------+   |
|      ^           |                                |
|      |           |  +-------------------------+   |
|   Menu +         |  | Workspace               |   |  <- Shows when item clicked
|   MenuItem       |  | [Another] [Counter]     |   |      (tabs = WorkspaceViews)
|                  |  +-------------------------+   |
+--------------------------------------------------+
```

## How Components Connect

```
Section (alias: "Blueprint.Section")
    |
    +-- Dashboard
    |   └── conditions: SectionAlias = "Blueprint.Section"
    |
    +-- SectionSidebarApp
        └── conditions: SectionAlias = "Blueprint.Section"
        └── meta.menu: "Blueprint.Menu"
                |
                +-- Menu (alias: "Blueprint.Menu")
                        |
                        +-- MenuItem
                            └── meta.entityType: "blueprint-entity"
                                        |
                                        v
                                  Workspace
                                  └── meta.entityType: "blueprint-entity"  (MUST MATCH!)
                                          |
                                          +-- WorkspaceView (via condition)
                                          +-- WorkspaceContext (via condition)
```

## Key Pattern: entityType Linking

The critical connection between menu items and workspaces is the `entityType`:

```typescript
// In MenuItem
meta: {
  entityType: "blueprint-entity",  // <-- This value...
  menus: ["Blueprint.Menu"],
}

// In Workspace
meta: {
  entityType: "blueprint-entity",  // <-- ...must match this!
}
```

When you click the MenuItem, Umbraco looks for a Workspace with matching `entityType` and opens it.

## Project Structure

```
Blueprint/
├── Client/
│   ├── src/
│   │   ├── bundle.manifests.ts      # Aggregates all manifests
│   │   ├── entrypoints/
│   │   │   ├── entrypoint.ts        # Extension lifecycle
│   │   │   └── manifest.ts
│   │   ├── sections/
│   │   │   └── manifest.ts          # Section + SidebarApp + Menu + MenuItem
│   │   ├── dashboards/
│   │   │   ├── dashboard.element.ts # Dashboard UI
│   │   │   └── manifest.ts
│   │   └── workspaces/
│   │       ├── workspace.element.ts # Workspace container
│   │       ├── context.ts           # Workspace context (shared state)
│   │       ├── context-token.ts     # Context token for DI
│   │       ├── manifest.ts          # Workspace + Views registration
│   │       └── views/
│   │           ├── defaultWorkspace.element.ts  # Counter tab
│   │           └── anotherWorkspace.element.ts  # Another tab
│   │   └── api/                     # Generated OpenAPI client
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── public/
│       └── umbraco-package.json
│
├── Controllers/                     # C# API (if needed)
├── Composers/                       # DI setup
├── Blueprint.csproj
└── wwwroot/App_Plugins/Blueprint/   # Built output
```

## How to Use

### Building the Client

```bash
cd Client
npm install
npm run build
```

This builds the client to `wwwroot/App_Plugins/Blueprint/`.

### Running with Umbraco

1. Add a reference to `Blueprint.csproj` in your Umbraco project
2. Build and run
3. Navigate to the backoffice - you'll see "Blueprint" in the top navigation

### File Watching (Development)

```bash
cd Client
npm run watch
```

Changes to TypeScript files will auto-rebuild and refresh the browser.

## Skills Referenced

| Skill | What It Covers |
|-------|----------------|
| `umbraco-sections` | Section, SectionSidebarApp registration |
| `umbraco-menu` | Menu container |
| `umbraco-menu-items` | MenuItem configuration |
| `umbraco-dashboard` | Dashboard with conditions |
| `umbraco-workspace` | Workspace, WorkspaceView, WorkspaceContext |
| `umbraco-conditions` | SectionAlias condition |
| `umbraco-context-api` | Workspace context pattern |
| `umbraco-bundle` | Manifest aggregation |
| `umbraco-entry-point` | Extension lifecycle |

## Learning Path

1. **Beginner**: Start with `sections/manifest.ts` and `dashboards/manifest.ts`
2. **Intermediate**: Study `workspaces/manifest.ts` and understand entityType linking
3. **Advanced**: Explore `workspaces/context.ts` for state management

## When to Use This Example

Use Blueprint when you need:

- **New Section**: Custom top-level area in backoffice
- **Simple Navigation**: Menu items without tree hierarchy
- **Dashboard + Workspace**: Welcome view and editing view

For tree navigation, see `tree-example`.
For more extension types, see `TimeDashboard`.
For full-stack with C# backend, see `notes-wiki`.
