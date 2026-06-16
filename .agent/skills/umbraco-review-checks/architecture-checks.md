# Architecture Checks

## AR-1: Direct API Client Access

**Severity:** High | **Auto-Fix:** No

UI elements should not call API services directly. Use the repository pattern.

```typescript
// BAD - Direct API call in UI element
export class MyDashboardElement extends UmbLitElement {
  async connectedCallback() {
    const response = await MyService.getAll();
    this._items = response.data;
  }
}

// GOOD - Using repository via context
export class MyDashboardElement extends UmbLitElement {
  constructor() {
    super();
    this.consumeContext(MY_WORKSPACE_CONTEXT, (context) => {
      this.#workspaceContext = context;
      this.observe(context.items, (items) => { this._items = items; });
    });
  }
}
```

**Detection:** `*Service.get*()`, `tryExecute()`, `tryExecuteAndNotify()` in `.element.ts` files

**Reference:** `umbraco-repository-pattern` skill

---

## AR-2: No Workspace Context

**Severity:** High | **Auto-Fix:** No

Workspace elements must use workspace context for data management.

```typescript
// BAD - Data loading directly in element
export class MyWorkspaceElement extends UmbLitElement {
  async connectedCallback() {
    const id = this.getRouteParam('id');
    this._data = await this.#repository.get(id);
  }
}

// GOOD - Using workspace context
export class MyWorkspaceElement extends UmbLitElement {
  constructor() {
    super();
    this.consumeContext(MY_WORKSPACE_CONTEXT, (context) => {
      this.#workspaceContext = context;
      this.observe(context.data, (data) => { this._data = data; });
    });
  }
}
```

**Detection:** Data loading in element `connectedCallback`, save handlers in elements

**Reference:** `umbraco-workspace` skill

---

## AR-3: Source Pattern Verification

**Severity:** Medium | **Auto-Fix:** No

Extensions should follow patterns established in Umbraco source code.

| Extension Type | Reference Pattern |
|----------------|-------------------|
| Dashboard | `src/packages/*/dashboards/` |
| Property Editor | `src/packages/*/property-editors/` |
| Workspace | `src/packages/*/workspace/` |
| Collection | `src/packages/*/collection/` |
| Tree | `src/packages/*/tree/` |

**Detection:** Compare file structure, class hierarchy, manifest structure against core

---

## AR-4: Inconsistent Persistence

**Severity:** Medium | **Auto-Fix:** No

Save/persistence patterns should follow Umbraco conventions.

```typescript
// BAD - Save in wrong location
render() {
  return html`
    <uui-button @click=${() => this.#repository.save(this._data)}>Save</uui-button>
  `;
}

// GOOD - Workspace context handles persistence
async #handleSubmit() {
  await this.#workspaceContext.submit();
}
```

**Detection:** Direct repository calls in render methods, missing error handling after save

---

## AR-5: Missing Repository Layer

**Severity:** High | **Auto-Fix:** No

Extensions with data persistence should implement the repository pattern.

```typescript
// BAD - Direct service usage
export class MyFeature {
  async getData() {
    return await MyDataService.get();
  }
}

// GOOD - Repository layer
export class MyDataRepository extends UmbControllerBase {
  async requestById(id: string) {
    return this.#source.get(id);
  }
}
```

**Detection:** Direct service calls without repository wrapper

**Reference:** `umbraco-repository-pattern` skill

---

## AR-6: Circular Context Dependencies

**Severity:** Critical | **Auto-Fix:** No

Context dependencies must not form cycles.

```typescript
// BAD - Circular dependency
// context-a.ts
consumeContext(CONTEXT_B, (b) => { ... });

// context-b.ts
consumeContext(CONTEXT_A, (a) => { ... });
```

**Detection:** Map context consume relationships, detect cycles
