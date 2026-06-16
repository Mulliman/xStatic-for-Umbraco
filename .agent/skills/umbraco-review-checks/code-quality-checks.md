# Code Quality Checks

## CQ-1: Extension Type Usage

**Severity:** Critical | **Auto-Fix:** Yes

Extensions must use proper Umbraco types, not generic Lit/Web Component patterns.

```typescript
// BAD
@customElement('my-element')
export class MyElement extends LitElement { }

// GOOD
@customElement('my-element')
export class MyElement extends UmbLitElement { }
```

**Detection:** Elements extending `LitElement` instead of `UmbLitElement`

**Auto-Fix:** Replace `LitElement` with `UmbLitElement`, add import from `@umbraco-cms/backoffice/lit-element`

---

## CQ-2: Manifest Registration

**Severity:** High | **Auto-Fix:** No

Extensions must be properly registered in manifests.

```typescript
// BAD - No manifest registration
export class MyDashboard extends UmbLitElement { }

// GOOD - Registered in manifest
export const manifests: Array<ManifestDashboard> = [
  {
    type: 'dashboard',
    alias: 'My.Dashboard',
    name: 'My Dashboard',
    element: () => import('./my-dashboard.element.js'),
  }
];
```

**Detection:** Elements without corresponding manifest entries

**Reference:** `umbraco-dashboard`, `umbraco-workspace` skills

---

## CQ-3: Element Implementation

**Severity:** Medium | **Auto-Fix:** Partial

Elements must follow Umbraco patterns for lifecycle and rendering.

```typescript
// BAD - Direct property manipulation
this.data = newData;

// GOOD - Reactive property
@state()
private _data?: MyData;
```

**Detection:** Missing `@state()` or `@property()` decorators on reactive properties

**Auto-Fix:** Add `@state()` decorator to private reactive properties

---

## CQ-4: Context API Usage

**Severity:** High | **Auto-Fix:** No

Extensions must use Context API for shared state and services.

```typescript
// BAD - Direct service instantiation
const service = new MyService();

// GOOD - Context consumption
this.consumeContext(UMB_NOTIFICATION_CONTEXT, (context) => {
  this._notificationContext = context;
});
```

**Detection:** Direct service instantiation instead of context consumption

**Reference:** `umbraco-context-api` skill

---

## CQ-5: State Management

**Severity:** Medium | **Auto-Fix:** No

State must be managed reactively using Umbraco patterns.

```typescript
// BAD - Manual state updates
this.items = await this.fetchItems();
this.requestUpdate();

// GOOD - Observable state
this.observe(
  this._workspaceContext.data,
  (data) => { this._data = data; }
);
```

**Detection:** Manual `requestUpdate()` calls, missing `observe()` usage

**Reference:** `umbraco-state-management` skill

---

## CQ-6: Localization

**Severity:** Medium | **Auto-Fix:** Partial

User-facing text must use localization.

```typescript
// BAD - Hardcoded strings
html`<uui-button>Save</uui-button>`

// GOOD - Localized
html`<uui-button><umb-localize key="general_save"></umb-localize></uui-button>`
```

**Detection:** Hardcoded user-facing strings in templates

**Auto-Fix:** Wrap known strings with `<umb-localize>` for common terms

**Reference:** `umbraco-localization` skill

---

## CQ-7: Naming Conventions

**Severity:** Low | **Auto-Fix:** No

Extensions must follow Umbraco naming conventions.

| Type | File Pattern | Class Pattern | Alias Pattern |
|------|--------------|---------------|---------------|
| Element | `*.element.ts` | `*Element` | - |
| Context | `*.context.ts` | `*Context` | - |
| Controller | `*.controller.ts` | `*Controller` | - |
| Repository | `*.repository.ts` | `*Repository` | - |
| Manifest | `manifests.ts` | - | `Vendor.Name` |

**Detection:** Files/classes not following naming patterns

---

## CQ-8: Conditions

**Severity:** Low | **Auto-Fix:** No

Extensions using conditions must reference valid condition types.

```typescript
// BAD - Invalid condition
conditions: [{ alias: 'Umb.Condition.DoesNotExist' }]

// GOOD - Valid condition
conditions: [{ alias: 'Umb.Condition.SectionUserPermission' }]
```

**Detection:** Unknown condition aliases in manifests

**Reference:** `umbraco-conditions` skill

---

## CQ-9: Property Editor Schema Alias

**Severity:** Critical | **Auto-Fix:** No

Property editor UIs must reference schema aliases that exist on the server.

```typescript
// BAD - Custom alias without C# implementation
meta: {
  propertyEditorSchemaAlias: 'MyPackage.CustomSchema' // 404 error!
}

// GOOD - Built-in schema
meta: {
  propertyEditorSchemaAlias: 'Umbraco.Plain.String'
}
```

**Detection:** `propertyEditorSchemaAlias` value not in built-in list:
- `Umbraco.Plain.String`
- `Umbraco.Integer`
- `Umbraco.Decimal`
- `Umbraco.Plain.Json`
- `Umbraco.DateTime`
- `Umbraco.TrueFalse`
- `Umbraco.TextBox`
- `Umbraco.TextArea`

If custom alias used, verify corresponding C# `DataEditor` exists in project.

**Reference:** `umbraco-property-editor-ui`, `umbraco-property-editor-schema` skills
