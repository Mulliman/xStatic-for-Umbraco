# Notes Wiki - Full-Stack Umbraco Extension Example

A comprehensive example demonstrating how multiple Umbraco backoffice extension types work together with a C# backend to create a real-world feature.

## What This Example Shows

This example creates an internal wiki/notes system that demonstrates:

- Full hierarchical tree with folders and notes
- Multiple workspace types (Note, Folder)
- C# API controllers with JSON persistence
- Dashboard with search and recent items
- Entity actions (Create, Delete, Rename)
- Collection view for browsing notes

## Extension Types Used

| Extension Type | Alias | Purpose |
|----------------|-------|---------|
| Section | `Notes.Section` | Top-level navigation in backoffice header |
| SectionSidebarApp | `Notes.SidebarApp` | Sidebar container for the section |
| Menu | `Notes.Menu` | Menu container in sidebar |
| MenuItem | `Notes.MenuItem` | Tree navigation (kind: "tree") |
| Dashboard | `Notes.Dashboard`, `Notes.BrowseDashboard` | Welcome panel and browse view |
| Tree | `Notes.Tree` | Hierarchical navigation of notes/folders |
| TreeItem | `Notes.TreeItem.*` | Individual tree nodes |
| Workspace | `Notes.Workspace.Note`, `Notes.Workspace.Folder` | Editing views for notes and folders |
| WorkspaceView | `Notes.WorkspaceView.*` | Multiple tabs within workspaces |
| Collection | `Notes.Collection` | List view of notes |
| Entity Action | Multiple | Create, Delete, Rename actions |
| Localization | en-us | Multi-language support |

## Visual Structure

```
+--------------------------------------------------+
| Content | Media | Settings | [NOTES]              |  <- Section in top nav
+--------------------------------------------------+
| SIDEBAR          |  MAIN AREA                     |
| +-------------+  |  +-------------------------+   |
| | Notes       |  |  | Dashboard               |   |  <- Shows when no item selected
| | ├─ Folder   |  |  | Search, Recent notes    |   |
| | │  ├─ Note  |  |  +-------------------------+   |
| | │  └─ Note  |  |                                |
| | └─ Note     |  |  +-------------------------+   |
| +-------------+  |  | Note Workspace          |   |  <- Shows when note clicked
|      ^           |  | [Content] [Settings]    |   |
|      |           |  | Title: ___________      |   |
|   Tree with      |  | Content: __________     |   |
|   folders        |  +-------------------------+   |
+--------------------------------------------------+
```

## How Components Connect

```
Section (alias: "Notes.Section")
    │
    ├── Dashboard
    │   └── conditions: SectionAlias = "Notes.Section"
    │
    └── SectionSidebarApp
        └── conditions: SectionAlias = "Notes.Section"
        └── meta.menu: "Notes.Menu"
                │
                └── MenuItem (kind: "tree")
                    ├── meta.treeAlias: "Notes.Tree"
                    └── meta.entityType: "notes-root"
                            │
                            └── Tree
                                ├── TreeItem (notes-folder) → Folder Workspace
                                └── TreeItem (notes-note) → Note Workspace
                                        │
                                        └── entityType links to Workspace
```

## Key Pattern: Multiple Entity Types

This example uses three entity types for different item types:

```typescript
// constants.ts
export const NOTES_ROOT_ENTITY_TYPE = 'notes-root';    // Tree root
export const NOTES_FOLDER_ENTITY_TYPE = 'notes-folder'; // Folders
export const NOTES_NOTE_ENTITY_TYPE = 'notes-note';     // Notes
```

Each entity type has its own workspace:

```typescript
// Folder workspace
meta: { entityType: NOTES_FOLDER_ENTITY_TYPE }

// Note workspace
meta: { entityType: NOTES_NOTE_ENTITY_TYPE }
```

## Key Pattern: Tree with Folders

The tree supports nested folders with different icons:

```typescript
// tree/manifests.ts
const treeItemManifest: UmbExtensionManifest = {
  type: 'treeItem',
  kind: 'default',
  forEntityTypes: [
    NOTES_ROOT_ENTITY_TYPE,
    NOTES_FOLDER_ENTITY_TYPE,
    NOTES_NOTE_ENTITY_TYPE
  ],
};
```

## Project Structure

```
notes-wiki/
├── Client/
│   ├── src/
│   │   ├── constants.ts         # Central aliases & entity types
│   │   ├── bundle.manifests.ts  # Aggregator with learning comments
│   │   │
│   │   ├── section/             # Section registration
│   │   ├── sidebar/             # SectionSidebarApp
│   │   ├── menu/                # Menu + MenuItem (tree kind)
│   │   ├── dashboard/           # Welcome dashboard + browse
│   │   ├── tree/                # Tree + Repository + DataSource
│   │   ├── collection/          # Collection view
│   │   ├── entity-actions/      # Create, Delete, Rename
│   │   │
│   │   ├── workspace/
│   │   │   ├── note/            # Note workspace + views
│   │   │   └── folder/          # Folder workspace
│   │   │
│   │   ├── types/               # TypeScript interfaces
│   │   ├── localization/        # Multi-language support
│   │   └── api/                 # Generated OpenAPI client
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── public/umbraco-package.json
│
├── Composers/                   # DI and Swagger setup
├── Controllers/                 # API endpoints
├── Models/                      # Data models
├── Services/                    # Business logic + JSON persistence
├── Constants.cs                 # C# constants
│
├── wwwroot/App_Plugins/NotesWiki/  # Built client output
└── NotesWiki.csproj
```

## How to Use

### Building the Client

```bash
cd Client
npm install
npm run build
```

This builds the client to `wwwroot/App_Plugins/NotesWiki/`.

### Running with Umbraco

1. Add a reference to `NotesWiki.csproj` in your Umbraco project
2. Build and run
3. Navigate to the backoffice and look for the "Notes" section

### File Watching (Development)

```bash
cd Client
npm run watch
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/umbraco/notes/api/v1/tree/root` | Root tree items |
| GET | `/umbraco/notes/api/v1/tree/children/{parentId}` | Children of folder |
| GET | `/umbraco/notes/api/v1/tree/ancestors/{id}` | Ancestor path |
| GET | `/umbraco/notes/api/v1/notes/{id}` | Get note |
| POST | `/umbraco/notes/api/v1/notes` | Create note |
| PUT | `/umbraco/notes/api/v1/notes/{id}` | Update note |
| DELETE | `/umbraco/notes/api/v1/notes/{id}` | Delete note |
| GET | `/umbraco/notes/api/v1/notes/recent` | Recent notes |
| GET | `/umbraco/notes/api/v1/notes/search?q={query}` | Search notes |
| GET | `/umbraco/notes/api/v1/folders/{id}` | Get folder |
| POST | `/umbraco/notes/api/v1/folders` | Create folder |
| PUT | `/umbraco/notes/api/v1/folders/{id}` | Rename folder |
| DELETE | `/umbraco/notes/api/v1/folders/{id}` | Delete folder |

## Skills Referenced

| Skill | What It Covers |
|-------|----------------|
| `umbraco-sections` | Section and SidebarApp |
| `umbraco-dashboard` | Dashboard registration |
| `umbraco-menu` | Menu container |
| `umbraco-menu-items` | MenuItem with tree kind |
| `umbraco-tree` | Tree structure |
| `umbraco-tree-item` | Tree item rendering |
| `umbraco-workspace` | Workspace registration |
| `umbraco-context-api` | Workspace context pattern |
| `umbraco-state-management` | Observable state |
| `umbraco-repository-pattern` | Data access layer |
| `umbraco-collection` | Collection view |
| `umbraco-entity-actions` | Create, Delete actions |
| `umbraco-conditions` | Extension visibility |
| `umbraco-routing` | URL structure |
| `umbraco-localization` | Multi-language support |
| `umbraco-controllers` | C# API controllers |
| `umbraco-openapi-client` | Generated API client |
| `umbraco-umbraco-element` | Base element class |
| `umbraco-bundle` | Manifest aggregation |
| `umbraco-entry-point` | Initialization |

## Learning Path

1. **Beginner**: Start with `section/manifests.ts` and `dashboard/manifests.ts`
2. **Intermediate**: Study `tree/manifests.ts` and understand entityType linking
3. **Advanced**: Explore `workspace/` and the context pattern with multiple workspaces

## Data Storage

This example uses JSON file persistence in `App_Data/NotesWiki/data.json`.
Sample data is created automatically on first run.

For production use, replace `NotesService` with a proper database implementation.

## When to Use This Example

Use notes-wiki when you need:

- **Full-Stack**: C# backend with API endpoints
- **Hierarchical Data**: Folders containing items
- **Multiple Workspaces**: Different editors for different entity types
- **CRUD Operations**: Create, Read, Update, Delete
- **Collection View**: List/grid display of items

For simpler patterns without backend, see `Blueprint`.
For tree without full CRUD, see `tree-example`.
