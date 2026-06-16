# Backoffice Extension Map

This diagram shows where ALL extension types appear in the Umbraco backoffice UI.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ HEADER BAR                                                                       │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           ┌───────────────────┐ │
│ │ Content │ │  Media  │ │Settings │ │ Section │  ...      │    Header Apps    │ │
│ │         │ │         │ │         │ │  ****   │           │ (umbraco-header-  │ │
│ │         │ │         │ │         │ │         │           │     apps)         │ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘           └───────────────────┘ │
│      ^                        ^                                    ^            │
│      │                        │                                    │            │
│  (umbraco-sections)      Your Section                    User menu, search,     │
│                                                          notifications          │
├─────────────────────────────────────────────────────────────────────────────────┤
│ SIDEBAR                    │  MAIN CONTENT AREA                                 │
│ ┌────────────────────────┐ │ ┌─────────────────────────────────────────────────┐│
│ │ SectionSidebarApp      │ │ │ Dashboard (umbraco-dashboard)                   ││
│ │ (part of sections)     │ │ │ Shows when nothing selected in tree             ││
│ │                        │ │ │ ┌─────────────────────────────────────────────┐ ││
│ │ ┌────────────────────┐ │ │ │ │ Your welcome content, stats, quick actions │ ││
│ │ │ Menu               │ │ │ │ └─────────────────────────────────────────────┘ ││
│ │ │ (umbraco-menu)     │ │ │ └─────────────────────────────────────────────────┘│
│ │ │                    │ │ │                                                    │
│ │ │ ┌────────────────┐ │ │ │ ┌─────────────────────────────────────────────────┐│
│ │ │ │ MenuItem       │ │ │ │ │ Workspace (umbraco-workspace)                   ││
│ │ │ │ (umbraco-menu- │ │ │ │ │ Shows when entity selected                      ││
│ │ │ │     items)     │ │ │ │ │ ┌─────────────────────────────────────────────┐ ││
│ │ │ │                │ │ │ │ │ │ WorkspaceView tabs (Content, Settings...)  │ ││
│ │ │ │ kind: "tree"───┼─┼─┼─┼─┤ │ ┌─────────┐ ┌─────────┐ ┌─────────┐       │ ││
│ │ │ └────────────────┘ │ │ │ │ │ │ View 1  │ │ View 2  │ │ View 3  │       │ ││
│ │ │                    │ │ │ │ │ └─────────┘ └─────────┘ └─────────┘       │ ││
│ │ │ ┌────────────────┐ │ │ │ │ └─────────────────────────────────────────────┘ ││
│ │ │ │ Tree           │ │ │ │ │                                                 ││
│ │ │ │ (umbraco-tree) │ │ │ │ │ WorkspaceActions (Save, Delete...)             ││
│ │ │ │                │ │ │ │ │ (umbraco-entity-actions)                        ││
│ │ │ │ ├─ Folder      │ │ │ │ └─────────────────────────────────────────────────┘│
│ │ │ │ │  └─ Item ────┼─┼─┼─┼──> entityType links to Workspace                  │
│ │ │ │ └─ Item        │ │ │ │                                                    │
│ │ │ │   (umbraco-    │ │ │ │ ┌─────────────────────────────────────────────────┐│
│ │ │ │    tree-item)  │ │ │ │ │ Collection (umbraco-collection)                 ││
│ │ │ └────────────────┘ │ │ │ │ List/grid view of items                         ││
│ │ └────────────────────┘ │ │ │ ┌─────────────────────────────────────────────┐ ││
│ └────────────────────────┘ │ │ │ CollectionView (umbraco-collection-view)    │ ││
│                            │ │ │ CollectionAction (umbraco-collection-action)│ ││
│                            │ │ └─────────────────────────────────────────────┘ ││
│                            │ └─────────────────────────────────────────────────┘│
├────────────────────────────┴────────────────────────────────────────────────────┤
│ MODALS & OVERLAYS (umbraco-modals)                                              │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Pickers, confirmations, custom dialogs - appear above main content          │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│ PROPERTY EDITORS (in Document/Media workspaces)                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ PropertyEditorUI (umbraco-property-editor-ui)  - The visual editor          │ │
│ │ PropertyEditorSchema (umbraco-property-editor-schema) - Data validation     │ │
│ │ PropertyAction (umbraco-property-action) - Buttons on property              │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│ RICH TEXT EDITOR (Tiptap)                                                       │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ TiptapExtension (umbraco-tiptap-extension) - Core editor behavior           │ │
│ │ TiptapToolbarExtension (umbraco-tiptap-toolbar-extension) - Toolbar buttons │ │
│ │ TiptapStatusbarExtension (umbraco-tiptap-statusbar-extension) - Status bar  │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────────┤
│ GLOBAL FEATURES                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ SearchProvider (umbraco-search-provider) - Global search results            │ │
│ │ SearchResultItem (umbraco-search-result-item) - Custom result rendering     │ │
│ │ HealthCheck (umbraco-health-check) - Settings > Health Check                │ │
│ │ Theme (umbraco-theme) - Custom backoffice themes                            │ │
│ │ Icons (umbraco-icons) - Custom icon sets                                    │ │
│ │ AuthProvider (umbraco-auth-provider) - External login buttons               │ │
│ │ MfaLoginProvider (umbraco-mfa-login-provider) - 2FA methods                 │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## How to Use This Map

- **Finding where an extension appears**: Locate the extension type in the diagram to see its position in the UI
- **Understanding relationships**: Arrows and containment show how extensions connect (e.g., MenuItem with `kind: "tree"` links to Tree)
- **Planning your extension**: Identify which extension types you need based on where your feature should appear
