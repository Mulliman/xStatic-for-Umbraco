# UI Pattern Checks

## UI-1: Custom Error Handling

**Severity:** High | **Auto-Fix:** Partial

Use Umbraco notification system, not browser alerts or custom error divs.

```typescript
// BAD
alert('Something went wrong!');
html`<div class="error">${this._errorMessage}</div>`

// GOOD
this._notificationContext?.peek('danger', {
  data: { message: 'Something went wrong!' }
});
```

**Detection:** `alert()`, `window.alert()`, custom error divs/spans

**Auto-Fix:** Replace simple `alert()` calls with notification context (requires context to be consumed)

**Reference:** `umbraco-notifications` skill

---

## UI-2: Layout Component Issues

**Severity:** High | **Auto-Fix:** No

Workspace elements should use `<umb-workspace-editor>` for proper layout.

```typescript
// BAD - Save button in content area
render() {
  return html`
    <div>
      <form>...</form>
      <uui-button @click=${this.#save}>Save</uui-button>
    </div>
  `;
}

// GOOD - Using workspace editor
render() {
  return html`
    <umb-workspace-editor alias="My.Workspace">
      <!-- content goes here -->
    </umb-workspace-editor>
  `;
}
```

**Detection:** Save buttons outside workspace editor, custom header/footer implementations

**Reference:** `umbraco-workspace` skill

---

## UI-3: Non-UUI Component Usage

**Severity:** Medium | **Auto-Fix:** Partial

Use UUI components instead of native HTML elements.

| Native HTML | UUI Replacement |
|-------------|-----------------|
| `<button>` | `<uui-button>` |
| `<input type="text">` | `<uui-input>` |
| `<input type="checkbox">` | `<uui-checkbox>` |
| `<select>` | `<uui-select>` or `<uui-combobox>` |
| `<textarea>` | `<uui-textarea>` |
| `<table>` | `<uui-table>` |
| `<dialog>` | Use Umbraco modal system |

**Detection:** Native form elements in templates

**Auto-Fix:** Suggest UUI replacements (binding syntax may differ)

---

## UI-4: Enum/Select Handling

**Severity:** Medium | **Auto-Fix:** Partial

Enums must be properly handled on both backend and frontend.

**Backend (C#):**
```csharp
// BAD - Enum serializes as integer
public MyEnum Status { get; set; }

// GOOD - Enum serializes as string
[JsonConverter(typeof(JsonStringEnumConverter))]
public MyEnum Status { get; set; }
```

**Frontend (TypeScript):**
```typescript
// BAD - Native select
html`<select><option value="draft">Draft</option></select>`

// GOOD - UUI select
html`<uui-select .options=${[{ name: 'Draft', value: 'draft' }]}></uui-select>`
```

**Detection:** Enum properties without `JsonStringEnumConverter`, native `<select>` elements

---

## UI-5: Missing Loading States

**Severity:** Low | **Auto-Fix:** No

Async operations should show loading indicators.

```typescript
// BAD - No loading state
async connectedCallback() {
  this._data = await this.#loadData();
}

// GOOD - Loading state
@state() private _loading = true;

async connectedCallback() {
  this._loading = true;
  this._data = await this.#loadData();
  this._loading = false;
}

render() {
  if (this._loading) return html`<uui-loader></uui-loader>`;
  return html`<div>${this._data?.name}</div>`;
}
```

**Detection:** Async data loading without loading state

---

## UI-6: Accessibility Issues

**Severity:** Medium | **Auto-Fix:** No

Extensions must be accessible.

```typescript
// BAD - Missing labels
html`<uui-input .value=${this._value}></uui-input>`

// BAD - Non-interactive element with click
html`<div @click=${this.#handleClick}>Click me</div>`

// GOOD
html`
  <uui-label for="my-input">Name</uui-label>
  <uui-input id="my-input" .value=${this._value}></uui-input>
`
```

**Detection:** Form inputs without labels, click handlers on non-interactive elements

---

## UI-7: Inline Styles

**Severity:** Low | **Auto-Fix:** Partial

Avoid inline styles; use CSS classes or UUI styling.

```typescript
// BAD
html`<div style="color: red; margin: 10px;">Error</div>`

// GOOD
static styles = css`
  .error { color: var(--uui-color-danger); }
`;

render() {
  return html`<div class="error">Error</div>`;
}
```

**Detection:** `style="..."` attributes in templates

**Auto-Fix:** Extract inline styles to static styles block
