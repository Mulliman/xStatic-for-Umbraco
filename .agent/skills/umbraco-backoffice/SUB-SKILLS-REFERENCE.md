# Sub-Skills Reference

Complete index of all available sub-skills for Umbraco backoffice development.

## UI Extension Skills

Invoke these skills for detailed documentation on each extension type:

| Extension Type | Sub-Skill | Where It Appears |
|----------------|-----------|------------------|
| Section | `umbraco-sections` | Top navigation bar |
| Dashboard | `umbraco-dashboard` | Main content area |
| Menu | `umbraco-menu` | Sidebar container |
| MenuItem | `umbraco-menu-items` | Sidebar navigation items |
| Tree | `umbraco-tree` | Hierarchical sidebar navigation |
| TreeItem | `umbraco-tree-item` | Individual tree nodes |
| Workspace | `umbraco-workspace` | Entity editing views |
| Header App | `umbraco-header-apps` | Top-right header area |
| Modal | `umbraco-modals` | Overlay dialogs |
| Collection | `umbraco-collection` | List/grid views |
| CollectionView | `umbraco-collection-view` | Custom collection layouts |
| CollectionAction | `umbraco-collection-action` | Collection toolbar buttons |

## Action Skills

| Action Type | Sub-Skill | What It Does |
|-------------|-----------|--------------|
| Entity Action | `umbraco-entity-actions` | Context menu & workspace actions |
| Entity Bulk Action | `umbraco-entity-bulk-actions` | Multi-select operations |
| Entity Create Option | `umbraco-entity-create-option-action` | Create menu options |
| Property Action | `umbraco-property-action` | Buttons on property editors |
| Current User Action | `umbraco-current-user-action` | User profile menu items |

## Property Editor Skills

| Component | Sub-Skill | Purpose |
|-----------|-----------|---------|
| Property Editor UI | `umbraco-property-editor-ui` | Visual editor component |
| Property Editor Schema | `umbraco-property-editor-schema` | Data validation |
| Property Value Preset | `umbraco-property-value-preset` | Default value templates |
| Block Editor Custom View | `umbraco-block-editor-custom-view` | Custom block rendering |

## Rich Text Editor Skills

| Component | Sub-Skill | Purpose |
|-----------|-----------|---------|
| Tiptap Extension | `umbraco-tiptap-extension` | Core editor behavior |
| Tiptap Toolbar | `umbraco-tiptap-toolbar-extension` | Toolbar buttons |
| Tiptap Statusbar | `umbraco-tiptap-statusbar-extension` | Status bar items |
| Monaco Markdown Action | `umbraco-monaco-markdown-editor-action` | Markdown editor buttons |

## Search & Global Features

| Feature | Sub-Skill | Purpose |
|---------|-----------|---------|
| Search Provider | `umbraco-search-provider` | Global search integration |
| Search Result Item | `umbraco-search-result-item` | Custom result rendering |
| Health Check | `umbraco-health-check` | System health checks |
| Theme | `umbraco-theme` | Custom backoffice themes |
| Icons | `umbraco-icons` | Custom icon sets |

## Authentication Skills

| Component | Sub-Skill | Purpose |
|-----------|-----------|---------|
| Auth Provider | `umbraco-auth-provider` | External login (OAuth) |
| MFA Login Provider | `umbraco-mfa-login-provider` | Two-factor authentication |

## User & Package Skills

| Component | Sub-Skill | Purpose |
|-----------|-----------|---------|
| User Profile App | `umbraco-user-profile-app` | User profile tabs |
| Granular Permissions | `umbraco-granular-user-permissions` | Fine-grained access control |
| Package View | `umbraco-package-view` | Package configuration UI |
| File Upload Preview | `umbraco-file-upload-preview` | Custom upload previews |
| Preview App Provider | `umbraco-preview-app-provider` | Content preview apps |

## Advanced Configuration

| Component | Sub-Skill | Purpose |
|-----------|-----------|---------|
| Dynamic Root | `umbraco-dynamic-root` | Content picker root configuration |
| Kinds | `umbraco-kinds` | Reusable manifest templates |
| UFM Component | `umbraco-ufm-component` | Umbraco Flavored Markdown |
| Global Context | `umbraco-global-context` | App-wide shared state |

## Foundation Concepts

Essential patterns used across all extensions:

| Concept | Sub-Skill | When Needed |
|---------|-----------|-------------|
| **OpenAPI Client** | `umbraco-openapi-client` | **REQUIRED for all custom API calls** |
| Context API | `umbraco-context-api` | Accessing services, sharing data |
| Umbraco Element | `umbraco-umbraco-element` | Base class for components |
| Conditions | `umbraco-conditions` | Controlling where things appear |
| State Management | `umbraco-state-management` | Reactive UI with @state |
| Repository Pattern | `umbraco-repository-pattern` | Data access layer |
| Extension Registry | `umbraco-extension-registry` | Dynamic registration |
| Routing | `umbraco-routing` | URL structure, navigation |
| Localization | `umbraco-localization` | Multi-language support |
| Notifications | `umbraco-notifications` | Toast messages, events |
| Controllers | `umbraco-controllers` | C# API endpoints |

> **CRITICAL**: When calling custom C# API endpoints from the backoffice, **NEVER use raw `fetch()`**. This will result in 401 Unauthorized errors. Always use a generated OpenAPI client configured with Umbraco's auth context. See the `umbraco-openapi-client` skill.

## Build & Structure

| Component | Sub-Skill | Purpose |
|-----------|-----------|---------|
| Bundle | `umbraco-bundle` | Manifest aggregation |
| Entry Point | `umbraco-entry-point` | Runtime initialization |
| Extension Template | `umbraco-extension-template` | Project scaffolding |
| **Add Extension Reference** | `umbraco-add-extension-reference` | **Register extension in Umbraco instance** |
