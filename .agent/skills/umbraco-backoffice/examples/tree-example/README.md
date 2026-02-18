# Tree Example - Settings Tree with Workspace

By Kevin Jump - https://github.com/KevinJump/Umbraco-Tree-Example - Improved and standardised

A focused example showing how to add a custom tree navigation to an existing Umbraco section (Settings) and link tree items to a workspace.

## What This Example Shows

This example demonstrates:

- Adding a Tree to an existing section (Settings)
- Tree Repository + Store pattern for data management
- MenuItem with `kind: "tree"` to display hierarchical navigation
- Workspace connected via `entityType`
- WorkspaceContext for managing entity data

## Extension Types Used

| Extension Type | Alias | Purpose |
|----------------|-------|---------|
| SectionSidebarApp | `OurTree.SidebarApp` | Container in Settings sidebar |
| Menu | `OurTree.Menu` | Menu container |
| MenuItem | `OurTree.MenuItem` | Tree navigation (kind: "tree") |
| Tree | `OurTree.Tree` | Hierarchical tree structure |
| TreeItem | `OurTree.TreeItem` | Individual tree nodes |
| Repository | `OurTree.Repository` | Data access layer |
| TreeStore | `OurTree.Store` | Tree state caching |
| Workspace | `OurTree.Workspace` | Editing view for tree items |
| WorkspaceView | `OurTree.WorkspaceView.Details` | Details tab in workspace |

## Visual Structure

```
+--------------------------------------------------+
| Content | Media | [SETTINGS] | Users | ...       |  <- Using existing Settings section
+--------------------------------------------------+
| SIDEBAR          |  MAIN AREA                    |
| +-------------+  |                               |
| | Our Tree    |  |  +-------------------------+  |
| | ├─ Item 1   |  |  | Workspace               |  |  <- Opens when item clicked
| | ├─ Item 2   |  |  | [Details]               |  |
| | └─ Item 3   |  |  | Entity: Item 2          |  |
| +-------------+  |  +-------------------------+  |
|      ^           |                               |
|      |           |                               |
|   Tree appears   |                               |
|   in Settings    |                               |
+--------------------------------------------------+
```

## How Components Connect

```
Settings Section (Umb.Section.Settings)  <- Existing Umbraco section
    │
    └── SectionSidebarApp (conditions: match Settings)
            │
            └── meta.menu: "OurTree.Menu"
                    │
                    └── MenuItem (kind: "tree")
                        ├── meta.treeAlias: "OurTree.Tree"
                        └── meta.entityType: "ourtree-root"
                                │
                                └── Tree
                                    ├── meta.repositoryAlias: "OurTree.Repository"
                                    │
                                    └── TreeItem (forEntityTypes: ["ourtree-root", "ourtree-entity"])
                                            │
                                            └── Click item → entityType: "ourtree-entity"
                                                    │
                                                    v
                                              Workspace (meta.entityType: "ourtree-entity")
                                                    │
                                                    └── WorkspaceView (via condition)
```

## Key Pattern: Tree in Existing Section

Add your tree to any existing section using conditions:

```typescript
// settingsTree/manifest.ts
const sidebarManifest: UmbExtensionManifest = {
  type: "sectionSidebarApp",
  kind: "menu",
  alias: "OurTree.SidebarApp",
  meta: {
    label: "Our Tree",
    menu: "OurTree.Menu",
  },
  conditions: [
    {
      alias: "Umb.Condition.SectionAlias",
      match: "Umb.Section.Settings",  // Appears in Settings section
    },
  ],
};
```

## Key Pattern: MenuItem with Tree Kind

Use `kind: "tree"` to display a tree instead of a simple link:

```typescript
const menuItemManifest: UmbExtensionManifest = {
  type: "menuItem",
  kind: "tree",                           // <-- Tree kind!
  alias: "OurTree.MenuItem",
  meta: {
    label: "Our Tree",
    icon: "icon-bug",
    entityType: OUR_TREE_ROOT_ENTITY_TYPE,
    menus: ["OurTree.Menu"],
    treeAlias: "OurTree.Tree",            // <-- Links to tree
    hideTreeRoot: true,                   // Hide root node
  },
};
```

## Key Pattern: Tree Repository + Store

Trees require a repository and store for data management:

```typescript
// Repository: fetches data from API
const repositoryManifest: UmbExtensionManifest = {
  type: "repository",
  alias: "OurTree.Repository",
  api: () => import("./ourtree.repository.js"),
};

// Store: caches tree state
const storeManifest: UmbExtensionManifest = {
  type: "treeStore",
  alias: "OurTree.Store",
  api: () => import("./ourtree.store.js"),
};

// Tree references the repository
const treeManifest: UmbExtensionManifest = {
  type: "tree",
  kind: "default",
  alias: "OurTree.Tree",
  meta: {
    repositoryAlias: "OurTree.Repository",  // <-- Links to repository
  },
};
```

## Project Structure

```
tree-example/
├── Client/
│   ├── src/
│   │   ├── bundle.manifests.ts       # Aggregates tree + workspace
│   │   │
│   │   ├── settingsTree/
│   │   │   ├── manifest.ts           # Tree + TreeItem + Menu + Repository
│   │   │   ├── types.ts              # Entity type constants
│   │   │   ├── ourtree.repository.ts # Extends UmbTreeRepositoryBase
│   │   │   ├── ourtree.data-source.ts # API calls
│   │   │   └── ourtree.store.ts      # Tree state cache
│   │   │
│   │   ├── workspace/
│   │   │   ├── manifest.ts           # Workspace + WorkspaceView
│   │   │   ├── ourtree-workspace.context.ts       # Workspace context
│   │   │   ├── ourtree-workspace.context-token.ts # Context token
│   │   │   ├── ourtree-workspace-editor.element.ts
│   │   │   └── views/
│   │   │       └── ourtree-workspace-view.element.ts
│   │   │
│   │   ├── entrypoints/
│   │   │   ├── manifest.ts
│   │   │   └── entrypoint.ts
│   │   │
│   │   └── api/                      # Generated OpenAPI client
│   │
│   ├── package.json
│   └── public/
│       └── umbraco-package.json
│
├── Controllers/
│   └── Tree/                         # C# tree API endpoints
├── Composers/
├── TreeExample.csproj
└── wwwroot/App_Plugins/TreeExample/
```

## How to Use

### Building the Client

```bash
cd Client
npm install
npm run build
```

This builds the client to `wwwroot/App_Plugins/TreeExample/`.

### Running with Umbraco

1. Add a reference to `TreeExample.csproj` in your Umbraco project
2. Build and run
3. Navigate to Settings section - you'll see "Our Tree" in the sidebar

### File Watching (Development)

```bash
cd Client
npm run watch
```

## Skills Referenced

| Skill | What It Covers |
|-------|----------------|
| `umbraco-tree` | Tree manifest and registration |
| `umbraco-tree-item` | TreeItem configuration |
| `umbraco-menu` | Menu container |
| `umbraco-menu-items` | MenuItem with tree kind |
| `umbraco-workspace` | Workspace + Views |
| `umbraco-context-api` | Workspace context pattern |
| `umbraco-repository-pattern` | Tree repository + data source |
| `umbraco-state-management` | Tree store for caching |
| `umbraco-conditions` | SectionAlias condition |
| `umbraco-routing` | entityType linking |

## Learning Path

1. **Beginner**: Start with `settingsTree/manifest.ts` to see Tree + MenuItem registration
2. **Intermediate**: Study `settingsTree/ourtree.repository.ts` for the repository pattern
3. **Advanced**: Explore `workspace/ourtree-workspace.context.ts` for workspace data management

## When to Use This Example

Use tree-example when you need:

- **Tree Navigation**: Hierarchical item display
- **Extend Existing Section**: Add features to Settings, Content, etc.
- **Repository Pattern**: Proper data access layer for trees
- **Tree + Workspace**: Click tree item to open editor

For a simpler starting point (no tree), see `Blueprint`.
For more extension types, see `TimeDashboard`.
For a full-stack example with folders and C# backend, see `notes-wiki`.
