# Notes/Wiki Demo for umbraco-backoffice Skill

## Overview

Create a comprehensive **Notes/Wiki** demonstration for the `umbraco-backoffice` skill that shows how multiple Umbraco backoffice extension types work together to create a real-world feature.

**Concept**: An internal wiki/notes system for content editors - universally understood, naturally hierarchical, and demonstrates all key patterns.

**Key Decisions**:
- Create new `notes-wiki` example alongside existing `Section_Sidebase_Menu_Workspace`
- Full-stack with C# backend API
- JSON file persistence (App_Data)
- Full hierarchical tree with nested folders

---

## Skills Reference

This demo leverages the following Umbraco backoffice skills. Use these when implementing each feature:

### Core Extension Skills (Direct Use)
| Skill | Purpose in Demo |
|-------|-----------------|
| `umbraco-sections` | Section registration, sidebar app |
| `umbraco-dashboard` | Welcome dashboard with search/recent |
| `umbraco-menu` | Menu container in sidebar |
| `umbraco-menu-items` | MenuItem with tree kind |
| `umbraco-tree` | Hierarchical tree navigation |
| `umbraco-tree-item` | Custom tree item rendering |
| `umbraco-workspace` | Note & Folder editing workspaces |
| `umbraco-entity-actions` | Save, Delete actions |
| `umbraco-modals` | Create note/folder dialogs |

### Foundational Concept Skills
| Skill | Purpose in Demo |
|-------|-----------------|
| `umbraco-context-api` | Workspace context, consuming contexts |
| `umbraco-state-management` | Observable state in workspace |
| `umbraco-repository-pattern` | Tree & detail repositories |
| `umbraco-conditions` | Section-based visibility |
| `umbraco-routing` | URL structure, path segments |
| `umbraco-extension-registry` | Understanding manifest registration |
| `umbraco-notifications` | Toast messages for save/delete |
| `umbraco-umbraco-element` | Base class for Lit elements |
| `umbraco-controllers` | C# API controllers |

### Build & Structure Skills
| Skill | Purpose in Demo |
|-------|-----------------|
| `umbraco-bundle` | Manifest aggregation |
| `umbraco-entry-point` | Runtime initialization (if needed) |
| `umbraco-icons` | Custom note/folder icons |
| `umbraco-localization` | Translatable strings |

### Enhancement Skills (Phase 4+)
| Skill | Purpose in Demo |
|-------|-----------------|
| `umbraco-search-provider` | Global search integration |
| `umbraco-search-result-item` | Custom search result rendering |
| `umbraco-collection` | List view of notes |
| `umbraco-collection-view` | Custom collection layout |
| `umbraco-entity-create-option-action` | Create note/folder options |

---

## Architecture

### Extension Types Demonstrated

```
Section: "Notes.Section"
    │
    ├── Dashboard: "Notes.Dashboard"
    │   └── Welcome view with search, recent notes, quick actions
    │
    ├── SectionSidebarApp: "Notes.SidebarApp"
    │   └── Menu: "Notes.Menu"
    │       └── MenuItem (kind: tree)
    │           └── Tree: "Notes.Tree"
    │               ├── TreeItem (notes-root)
    │               ├── TreeItem (notes-folder)
    │               └── TreeItem (notes-note)
    │
    ├── Workspace: "Notes.Workspace.Note" (entityType: notes-note)
    │   ├── WorkspaceView: Content (edit title/content)
    │   ├── WorkspaceView: Settings (tags, metadata)
    │   └── WorkspaceAction: Save
    │
    └── Workspace: "Notes.Workspace.Folder" (entityType: notes-folder)
        └── WorkspaceView: Settings (rename folder)
```

### Connection Patterns (Educational Focus)

**Pattern 1: SectionAlias Condition**
```
Section.alias: "Notes.Section"  →  Dashboard.conditions[].match: "Notes.Section"
```

**Pattern 2: Menu Reference**
```
Menu.alias: "Notes.Menu"  →  SidebarApp.meta.menu: "Notes.Menu"
```

**Pattern 3: entityType (The Critical Link)**
```
TreeItem click  →  entityType: "notes-note"  →  Workspace.meta.entityType: "notes-note"
```

---

## File Structure

### Client-Side (TypeScript/Lit)

```
notes-wiki/
├── Client/
│   ├── src/
│   │   ├── constants.ts                    # Central aliases & entity types
│   │   ├── bundle.manifests.ts             # Aggregator with tiered learning comments
│   │   │
│   │   ├── section/
│   │   │   └── manifest.ts                 # Section registration
│   │   │
│   │   ├── sidebar/
│   │   │   └── manifest.ts                 # SectionSidebarApp
│   │   │
│   │   ├── menu/
│   │   │   └── manifest.ts                 # Menu + MenuItem (tree kind)
│   │   │
│   │   ├── dashboard/
│   │   │   ├── manifest.ts
│   │   │   └── notes-dashboard.element.ts  # Welcome UI with search/recent
│   │   │
│   │   ├── tree/
│   │   │   ├── manifest.ts                 # Tree + TreeItem + Repository
│   │   │   ├── notes-tree.repository.ts
│   │   │   ├── notes-tree.store.ts
│   │   │   ├── notes-tree.server.data-source.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── workspace/
│   │   │   ├── note/
│   │   │   │   ├── manifest.ts
│   │   │   │   ├── note-workspace.context.ts
│   │   │   │   ├── note-workspace.context-token.ts
│   │   │   │   ├── note-workspace-editor.element.ts
│   │   │   │   └── views/
│   │   │   │       ├── note-content.view.element.ts
│   │   │   │       └── note-settings.view.element.ts
│   │   │   │
│   │   │   └── folder/
│   │   │       ├── manifest.ts
│   │   │       ├── folder-workspace.context.ts
│   │   │       └── folder-workspace-editor.element.ts
│   │   │
│   │   ├── repository/
│   │   │   ├── detail/
│   │   │   │   ├── note-detail.repository.ts
│   │   │   │   ├── note-detail.store.ts
│   │   │   │   └── note-detail.server.data-source.ts
│   │   │   └── manifest.ts
│   │   │
│   │   └── types/
│   │       ├── note.model.ts
│   │       └── folder.model.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── umbraco-package.json
│
├── Server/
│   ├── NotesExtension.csproj
│   ├── Constants.cs
│   │
│   ├── Composers/
│   │   └── NotesApiComposer.cs
│   │
│   ├── Models/
│   │   ├── NoteModel.cs
│   │   ├── FolderModel.cs
│   │   ├── TreeItemModel.cs
│   │   ├── CreateNoteRequest.cs
│   │   └── UpdateNoteRequest.cs
│   │
│   ├── Controllers/
│   │   ├── NotesApiControllerBase.cs
│   │   ├── NotesController.cs
│   │   ├── FoldersController.cs
│   │   └── NotesTreeController.cs
│   │
│   └── Services/
│       ├── INotesService.cs
│       └── NotesService.cs              # JSON file persistence
│
└── wwwroot/App_Plugins/NotesWiki/       # Built output
```

---

## Data Model

### Note

```typescript
interface NoteModel {
  unique: string;              // GUID
  entityType: 'notes-note';
  parentUnique: string | null; // Folder GUID or null for root
  title: string;
  content: string;             // Rich text/markdown
  tags: string[];
  createdDate: string;
  modifiedDate: string;
  createdBy: string;
  modifiedBy: string;
}
```

### Folder

```typescript
interface FolderModel {
  unique: string;
  entityType: 'notes-folder';
  parentUnique: string | null; // Parent folder or null for root
  name: string;
  createdDate: string;
}
```

### Tree Item (API Response)

```typescript
interface TreeItemModel {
  unique: string;
  entityType: 'notes-root' | 'notes-folder' | 'notes-note';
  name: string;
  hasChildren: boolean;
  isFolder: boolean;
  icon: string;
  parent: {
    unique: string | null;
    entityType: string;
  };
}
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/umbraco/notes/api/v1/tree/root` | Root tree items |
| GET | `/umbraco/notes/api/v1/tree/children/{parentId}` | Children of folder |
| GET | `/umbraco/notes/api/v1/tree/ancestors/{id}` | Ancestor path |
| GET | `/umbraco/notes/api/v1/notes/{id}` | Get note detail |
| POST | `/umbraco/notes/api/v1/notes` | Create note |
| PUT | `/umbraco/notes/api/v1/notes/{id}` | Update note |
| DELETE | `/umbraco/notes/api/v1/notes/{id}` | Delete note |
| GET | `/umbraco/notes/api/v1/folders/{id}` | Get folder |
| POST | `/umbraco/notes/api/v1/folders` | Create folder |
| PUT | `/umbraco/notes/api/v1/folders/{id}` | Rename folder |
| DELETE | `/umbraco/notes/api/v1/folders/{id}` | Delete folder |
| GET | `/umbraco/notes/api/v1/notes/recent` | Recent notes (for dashboard) |
| GET | `/umbraco/notes/api/v1/notes/search?q={query}` | Search notes |

---

## Implementation Phases

### Phase 1: Foundation (Section + Dashboard)

1. Create project structure and build config
2. Implement `constants.ts` with all aliases
3. Create Section manifest
4. Create Dashboard with static welcome content
5. Create basic C# project with Swagger setup
6. Verify extension loads in Umbraco

**Files**:
- `constants.ts`
- `section/manifest.ts`
- `dashboard/manifest.ts`, `notes-dashboard.element.ts`
- `bundle.manifests.ts`
- `NotesExtension.csproj`, `NotesApiComposer.cs`

**Skills to Use**:
- `umbraco-sections` - Section manifest structure
- `umbraco-dashboard` - Dashboard manifest and element
- `umbraco-bundle` - Aggregating manifests
- `umbraco-umbraco-element` - Base element class
- `umbraco-conditions` - SectionAlias condition for dashboard
- `umbraco-controllers` - C# API controller setup

### Phase 2: Navigation (Sidebar + Menu + Tree)

1. Add SectionSidebarApp manifest
2. Add Menu + MenuItem (tree kind)
3. Implement Tree manifests with repository
4. Create tree data source calling backend
5. Implement tree API endpoints
6. Implement JSON file service for persistence

**Files**:
- `sidebar/manifest.ts`
- `menu/manifest.ts`
- `tree/manifest.ts`, `notes-tree.repository.ts`, `notes-tree.server.data-source.ts`
- `NotesTreeController.cs`
- `NotesService.cs` (JSON persistence)

**Skills to Use**:
- `umbraco-sections` - SectionSidebarApp manifest
- `umbraco-menu` - Menu manifest structure
- `umbraco-menu-items` - MenuItem with tree kind
- `umbraco-tree` - Tree manifest and repository
- `umbraco-tree-item` - TreeItem manifest for custom rendering
- `umbraco-repository-pattern` - Tree repository pattern
- `umbraco-icons` - Custom icons for notes/folders
- `umbraco-controllers` - Tree API endpoints

### Phase 3: Workspaces (Note + Folder editing)

1. Create Note workspace context extending `UmbEntityNamedDetailWorkspaceContextBase`
2. Create workspace editor element
3. Create Content view (title + rich text editor)
4. Create Settings view (tags + metadata)
5. Add Save workspace action
6. Implement note CRUD API endpoints
7. Create simpler Folder workspace

**Files**:
- `workspace/note/manifest.ts`, `note-workspace.context.ts`, views
- `workspace/folder/manifest.ts`, `folder-workspace.context.ts`
- `repository/detail/note-detail.repository.ts`
- `NotesController.cs`, `FoldersController.cs`

**Skills to Use**:
- `umbraco-workspace` - Workspace manifest, views, actions
- `umbraco-context-api` - Workspace context pattern
- `umbraco-state-management` - Observable state for editing
- `umbraco-repository-pattern` - Detail repository for CRUD
- `umbraco-entity-actions` - Save and Delete actions
- `umbraco-routing` - entityType linking to workspace
- `umbraco-notifications` - Success/error toast messages
- `umbraco-controllers` - CRUD API endpoints

### Phase 4: Dashboard Enhancement

1. Add search functionality (calls API)
2. Add recent notes section (calls API)
3. Add quick create buttons
4. Style with UUI components

**Files**:
- `dashboard/notes-dashboard.element.ts` (enhance)
- Add search/recent endpoints to `NotesController.cs`

**Skills to Use**:
- `umbraco-dashboard` - Enhanced dashboard patterns
- `umbraco-modals` - Create note/folder dialogs
- `umbraco-entity-create-option-action` - Quick create actions
- `umbraco-localization` - Translatable UI strings

### Phase 5: Polish & Documentation

1. Add educational comments to all manifests
2. Update SKILL.md with notes-wiki as primary example
3. Add sample seed data (JSON file with example notes)
4. Test all user journeys

**Skills to Use**:
- `umbraco-localization` - Ensure all strings are localized
- `umbraco-extension-registry` - Document registration patterns

### Phase 6: Advanced Features (Optional)

1. Integrate with global search
2. Add collection view for notes
3. Add bulk actions for notes

**Files**:
- `search/manifest.ts`, `notes-search.provider.ts`
- `collection/manifest.ts`, `notes-collection.view.ts`

**Skills to Use**:
- `umbraco-search-provider` - Global search integration
- `umbraco-search-result-item` - Custom search results
- `umbraco-collection` - Collection configuration
- `umbraco-collection-view` - Custom collection layout
- `umbraco-entity-bulk-actions` - Multi-select operations

---

## Key Patterns to Highlight (Educational)

### 1. Central Constants Pattern

```typescript
// constants.ts - THE source of truth for connections
export const NOTES_SECTION_ALIAS = 'Notes.Section';
export const NOTES_NOTE_ENTITY_TYPE = 'notes-note';  // Links MenuItem → Workspace
export const NOTES_WORKSPACE_ALIAS = 'Notes.Workspace.Note';
```

### 2. Condition-Based Visibility

```typescript
// Dashboard only shows in Notes section
conditions: [{
  alias: 'Umb.Condition.SectionAlias',
  match: NOTES_SECTION_ALIAS,
}]
```

### 3. entityType Linking

```typescript
// MenuItem meta
meta: { entityType: NOTES_NOTE_ENTITY_TYPE }

// Workspace meta
meta: { entityType: NOTES_NOTE_ENTITY_TYPE }  // MUST MATCH!
```

### 4. Workspace Context Pattern

```typescript
export class UmbNoteWorkspaceContext
  extends UmbEntityNamedDetailWorkspaceContextBase<UmbNoteDetailModel, UmbNoteDetailRepository> {

  readonly title = this._data.createObservablePartOfCurrent((data) => data?.title);

  setTitle(title: string) {
    this._data.updateCurrent({ title });
  }
}
```

---

## Reference Files to Study

Before implementation, read these Umbraco source files:

1. **Workspace Context Pattern**: `/Users/philw/Projects/Umbraco-CMS/src/Umbraco.Web.UI.Client/src/packages/dictionary/workspace/dictionary-workspace.context.ts`

2. **Tree Data Source**: `/Users/philw/Projects/Umbraco-CMS/src/Umbraco.Web.UI.Client/src/packages/dictionary/tree/dictionary-tree.server.data-source.ts`

3. **Section Constants**: `/Users/philw/Projects/Umbraco-CMS/src/Umbraco.Web.UI.Client/src/packages/user/section/constants.ts`

4. **Existing Blueprint Example**: `/Users/philw/Projects/UmbracoCMS_Skills/.claude/skills/umbraco-backoffice/examples/Section_Sidebase_Menu_Workspace/`

5. **MyExtension Tree Example**: `/Users/philw/Projects/UmbracoCMS_Skills/MyExtension/Client/src/trees/`

---

## Success Criteria

The demo is complete when:

1. **Functional**: All CRUD operations work (create/edit/delete notes and folders)
2. **Navigable**: Tree shows hierarchy, clicking items opens workspace
3. **Educational**: Each pattern is clearly named and commented
4. **Documented**: SKILL.md updated with notes-wiki as primary reference
5. **Self-contained**: Can be copied as starting point for new extensions
