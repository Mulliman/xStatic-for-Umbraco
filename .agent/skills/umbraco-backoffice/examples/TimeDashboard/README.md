# TimeDashboard - Comprehensive Multi-Extension Example

A showcase example demonstrating 13+ different Umbraco backoffice extension types working together. Use this as a reference when you need to see how various extension types interact.

## What This Example Shows

This is the most comprehensive example in the collection, demonstrating:

- Multiple extension types in a single package
- How extensions interact with core Umbraco workspaces
- Global contexts for shared state
- Custom property editors
- Header apps and modals
- Workspace and entity actions
- Localization patterns

## Extension Types Used

| Extension Type | Alias | Purpose |
|----------------|-------|---------|
| Section | `TimeDashboard.Section.Main` | Custom "Time" section |
| Menu | `TimeDashboard.Menu` | Sidebar navigation |
| MenuItem | `TimeDashboard.MenuItem.*` | Navigation items |
| Dashboard | `TimeDashboard.Dashboard` | Welcome panel |
| Workspace | `TimeDashboard.Workspace.*` | Custom editing views |
| WorkspaceView | Multiple | Tabs within workspaces |
| WorkspaceContext | `TimeDashboard.WorkspaceContext` | Shared workspace state |
| Header App | `time.header.app` | Top-right header button |
| Modal | `time.custom.modal`, `time.header.modal` | Custom dialogs |
| Property Editor UI | `styled.textbox.ui` | Custom input component |
| Property Editor Schema | `styled.textbox` | Data type configuration |
| Document App | Custom | Tab in document workspace |
| Workspace Action | `time.workspace.action` | Button in document toolbar |
| Entity Action | `time.entity.action` | Context menu item |
| Global Context | `time.context` | App-wide shared state |
| Localization | en-us, en-gb | Multi-language strings |

## Key Pattern: Global Context

Share state across the entire backoffice:

```typescript
// contexts/manifest.ts
{
    type: 'globalContext',
    alias: 'time.context',
    name: 'Time context',
    api: () => import('./time.context.js')
}
```

Any component can consume this context to access shared data.

## Key Pattern: Header App with Modal

Add buttons to the top-right header area:

```typescript
// headerApps/manifest.ts
{
    type: 'headerApp',
    alias: 'time.header.app',
    name: 'time app',
    js: () => import('./time-header-element.js'),
    weight: 850,
    meta: {
        label: 'time',
        icon: 'icon-alarm-clock',
        pathname: 'time'
    }
}
```

## Key Pattern: Custom Property Editor

Create reusable data types with Schema + UI:

```typescript
// propertyEditors/manifest.ts
// Schema defines the data type configuration
{
    type: 'propertyEditorSchema',
    name: 'Styled textbox',
    alias: 'styled.textbox',
    meta: {
        defaultPropertyEditorUiAlias: 'styled.textbox.ui',
        settings: {
            properties: [
                {
                    alias: 'styleValue',
                    label: 'Styles',
                    propertyEditorUiAlias: 'Umb.PropertyEditorUi.TextArea'
                }
            ]
        }
    }
}

// UI defines the visual component
{
    type: 'propertyEditorUi',
    alias: 'styled.textbox.ui',
    name: 'styled textbox',
    js: () => import('./styledtext.ui.element.js'),
    meta: {
        propertyEditorSchemaAlias: 'styled.textbox',
    }
}
```

## Key Pattern: Workspace Action

Add buttons to document editing toolbar:

```typescript
// actions/workspace/manifest.ts
{
    type: 'workspaceAction',
    kind: 'default',
    alias: 'time.workspace.action',
    conditions: [
        {
            alias: UMB_WORKSPACE_CONDITION_ALIAS,
            match: 'Umb.Workspace.Document',  // Appears in document workspace
        },
    ],
}
```

## Project Structure

```
TimeDashboard/
├── Client/
│   ├── src/
│   │   ├── bundle.manifests.ts       # Aggregates 13 extension types
│   │   ├── sections/                 # Section registration
│   │   ├── menus/                    # Menu + MenuItems
│   │   ├── dashboards/               # Dashboard with time display
│   │   ├── workspaces/               # Multiple workspaces + views
│   │   ├── headerApps/               # Header app + modal
│   │   ├── modals/                   # Custom modal with token
│   │   ├── propertyEditors/          # Custom property editor
│   │   ├── documentApps/             # Document workspace tab
│   │   ├── actions/
│   │   │   ├── workspace/            # Document toolbar button
│   │   │   └── entity/               # Context menu item
│   │   ├── contexts/                 # Global context
│   │   ├── repository/               # Data access
│   │   ├── localization/             # Translations
│   │   ├── entrypoints/              # Extension lifecycle
│   │   └── api/                      # Generated OpenAPI client
│   │
│   ├── package.json
│   └── public/
│       └── umbraco-package.json
│
├── Controllers/                      # C# API endpoints
├── Composers/                        # DI setup
├── TimeDashboard.csproj
└── wwwroot/App_Plugins/TimeDashboard/
```

## How to Use

### Building the Client

```bash
cd Client
npm install
npm run build
```

This builds the client to `wwwroot/App_Plugins/TimeDashboard/`.

### Running with Umbraco

1. Add a reference to `TimeDashboard.csproj` in your Umbraco project
2. Build and run
3. You'll see:
   - "Time" section in top navigation
   - Clock icon in header bar
   - "Time Action" button when editing documents
   - "Styled textbox" data type available

### File Watching (Development)

```bash
cd Client
npm run watch
```

## Skills Referenced

| Skill | What It Covers |
|-------|----------------|
| `umbraco-sections` | Section registration |
| `umbraco-menu` | Menu configuration |
| `umbraco-menu-items` | MenuItem patterns |
| `umbraco-dashboard` | Dashboard setup |
| `umbraco-workspace` | Workspace + Views + Context |
| `umbraco-header-apps` | Header app pattern |
| `umbraco-modals` | Modal registration and tokens |
| `umbraco-property-editor-ui` | Custom property UI |
| `umbraco-property-editor-schema` | Data type schema |
| `umbraco-entity-actions` | Context menu actions |
| `umbraco-context-api` | Context consumption |
| `umbraco-global-context` | App-wide contexts |
| `umbraco-repository-pattern` | Data access layer |
| `umbraco-localization` | Translation files |
| `umbraco-entry-point` | Extension lifecycle |

## Learning Path

1. **Beginner**: Start with `sections/manifest.ts` and `dashboards/manifest.ts`
2. **Intermediate**: Study `headerApps/` for header integration and `modals/` for dialog patterns
3. **Advanced**: Explore `propertyEditors/` for custom data types and `contexts/` for global state

## When to Use This Example

Use TimeDashboard as reference when you need:

- **Header App**: Button in top-right area
- **Custom Property Editor**: New data type
- **Workspace Action**: Button in document toolbar
- **Global Context**: App-wide shared state
- **Multiple Modals**: Custom dialog patterns
- **Localization**: Multi-language support

For simpler patterns, start with `Blueprint`.
For tree navigation, see `tree-example`.
For full-stack with C# backend, see `notes-wiki`.
