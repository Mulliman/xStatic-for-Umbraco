# Pre-Build Planning

Before building any Umbraco backoffice extension, complete these planning steps.

## 1. Visual Planning - Draw First

**ALWAYS sketch the UI before writing code.** Use ASCII diagrams to visualize:

- Where UI elements appear in the backoffice
- Which extension types are needed
- How components connect

### Wireframe Annotation Format

```
┌─────────────────────────────────────────────────────┐
│ [Header]                          [headerApp]       │
├──────────┬──────────────────────────────────────────┤
│ [Section]│ [Dashboard/Workspace]                    │
│  │       │  ┌────────────────────────────────────┐  │
│  ├─[Menu]│  │                                    │  │
│  │  │    │  │   Your content area                │  │
│  │  └─[X]│  │                                    │  │
│  │       │  │   [uui-button] [uui-input]         │  │
│  └─[Tree]│  │   [uui-box]                        │  │
│          │  └────────────────────────────────────┘  │
└──────────┴──────────────────────────────────────────┘
```

Label each part with:
- **Extension type** in `[brackets]` - e.g., `[section]`, `[workspace]`, `[headerApp]`
- **UUI components** as `[uui-*]` - e.g., `[uui-button]`, `[uui-box]`

## 2. Extension Type Selection

Identify which extension types you need:

| UI Location | Extension Type | Sub-skill |
|-------------|----------------|-----------|
| Left sidebar tab | `section` | `umbraco-sections` |
| Section navigation | `menu` | `umbraco-menu` |
| Main content area | `dashboard` or `workspace` | `umbraco-dashboard`, `umbraco-workspace` |
| Hierarchical data | `tree` | `umbraco-tree` |
| Top right corner | `headerApp` | `umbraco-header-apps` |
| Popup dialogs | `modal` | `umbraco-modals` |

See [EXTENSION-MAP.md](./EXTENSION-MAP.md) for the complete visual reference.

## 3. UUI Component Selection

Identify `uui-*` components needed for your UI:

- **Layout**: `uui-box`, `uui-card`, `uui-table`
- **Forms**: `uui-input`, `uui-button`, `uui-checkbox`, `uui-select`
- **Feedback**: `uui-loader`, `uui-badge`, `uui-tag`
- **Navigation**: `uui-tab-group`, `uui-pagination`

**Reference**: Browse the Umbraco.UI source at `/Users/philw/Projects/Umbraco.UI/` for component implementations and available properties.

## 4. Data Flow Mapping

Document how data flows through your extension:

```
[Context Provider]
       │
       ▼
[Your Element] ──consume──► UmbContextToken
       │
       ▼
[Repository] ──fetch──► [API/Store]
```

Key questions to answer:
- What context do you need to consume? (e.g., `UMB_WORKSPACE_CONTEXT`)
- Do you need a custom repository or existing one?
- What API endpoints will you call? (requires `umbraco-openapi-client`)

## 5. Planning Checklist

Before writing code, confirm:

- [ ] Wireframe drawn with extension types labeled
- [ ] UUI components identified
- [ ] Data sources/APIs identified
- [ ] Sub-skills to invoke identified
- [ ] File structure planned (element, context, repository as needed)

## 6. Include Validation Steps in Your Plan

**Every plan MUST include a "Post-Build Validation" section.** This ensures validation travels WITH the plan, not just in documentation.

Add this to your implementation plan:

```markdown
## Post-Build Validation (REQUIRED)

After implementation is complete:
- [ ] Run `npm run build` - must compile without errors
- [ ] Spawn `umbraco-extension-reviewer` agent for code review
- [ ] Fix all High/Medium severity issues
- [ ] Browser test: extension loads, UI renders, interactions work
```

---

> **TIP**: Time spent planning saves debugging time. A clear wireframe prevents building the wrong extension type.
