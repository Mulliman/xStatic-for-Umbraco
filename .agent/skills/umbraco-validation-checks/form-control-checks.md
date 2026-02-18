# Form Control Checks

## VF-1: Select/Combobox Behavior

**Common Symptom:** Dropdown not working, wrong value selected, or options not appearing

> **Key insight:** Empty or broken selects are a common cause of mysterious 400 API errors. When debugging 400 errors, **always check selects first** - if a select has no data or wrong data, the form submits invalid values that the API rejects.

**The select → 400 error trap:**

1. Select component renders but has no options (data didn't load)
2. User fills out form, select value is `null` or `undefined`
3. Form submits, API returns 400
4. Developer checks API payload, sees missing/wrong value
5. Goes in circles checking API, models, etc.
6. **Root cause was the select never populated**

**Before debugging 400 errors, check all selects:**

- [ ] Does the dropdown show options when clicked?
- [ ] Is the correct option selected?
- [ ] In DevTools Elements tab, inspect the select - does it have a value?

**UUI Select vs Combobox:**

| Component | Use Case |
|-----------|----------|
| `uui-select` | Simple dropdowns with predefined options |
| `uui-combobox` | Searchable/filterable dropdowns, typeahead |

**Common select issues:**

| Issue | Likely Cause |
|-------|--------------|
| Options don't appear | Options array is empty or malformed |
| Wrong item selected | Value binding uses wrong property |
| Selection doesn't persist | Event handler not updating state |
| Shows "[object Object]" | Display property not specified |

**Verify options format:**

```typescript
// uui-select expects this format
const options = [
  { name: 'Display Text', value: 'actual-value' },
  { name: 'Another Option', value: 'another-value' }
];

// In template
html`<uui-select .options=${this._options} @change=${this.#onChange}></uui-select>`
```

**Debug checklist for selects:**

- [ ] Check Console - any errors when clicking dropdown?
- [ ] Verify options array is populated (add `console.log` temporarily)
- [ ] Check `name` and `value` properties in options
- [ ] Verify change event handler is being called
- [ ] Check if value is being set correctly (`.value` vs `value` attribute)

**Property binding matters:**

```typescript
// WRONG - attribute binding for objects
<uui-select options=${this._options}>

// CORRECT - property binding with dot prefix
<uui-select .options=${this._options}>
```

**Anti-pattern: Child elements do NOT work:**

Unlike native HTML `<select>`, the `uui-select` component does **not** support child elements for options. This is a common mistake that results in an empty dropdown and 400 errors when the form submits with null/undefined values.

```typescript
// WRONG - child elements do NOT work
html`
  <uui-select>
    <uui-option value="draft">Draft</uui-option>
    <uui-option value="published">Published</uui-option>
  </uui-select>
`

// CORRECT - use .options property
html`
  <uui-select
    .options=${[
      { name: 'Draft', value: 'draft' },
      { name: 'Published', value: 'published' },
    ]}
    @change=${this.#onChange}
  ></uui-select>
`
```

---

## VF-2: Input Binding Issues

**Common Symptom:** Values not updating, not saving, or reverting

**Check binding direction:**

| Syntax | Direction | Use For |
|--------|-----------|---------|
| `.value=${x}` | JS to DOM | Setting input value |
| `@input=${fn}` | DOM to JS | Reacting to typing |
| `@change=${fn}` | DOM to JS | Reacting to value commit |

**Common input issues:**

| Issue | Likely Cause |
|-------|--------------|
| Value doesn't update | Missing `.` in property binding |
| Changes lost on re-render | State not being updated in event handler |
| Value reverts after typing | Two-way binding not implemented |
| Saves wrong value | Reading wrong property from event |

**Correct two-way binding pattern:**

```typescript
@state() private _name = '';

#onNameInput(e: UUIInputEvent) {
  this._name = e.target.value as string;
}

render() {
  return html`
    <uui-input
      .value=${this._name}
      @input=${this.#onNameInput}>
    </uui-input>
  `;
}
```

**Debug checklist for inputs:**

- [ ] Is the value property bound with dot prefix (`.value`)?
- [ ] Is there an event handler for `@input` or `@change`?
- [ ] Does the event handler update component state?
- [ ] Is the state decorated with `@state()`?
- [ ] Check event target - is it the input element or a wrapper?

**Getting value from event:**

```typescript
// For UUI components
#onInput(e: UUIInputEvent) {
  const value = e.target.value;  // Usually works
}

// If nested or wrapped, may need to cast
#onInput(e: Event) {
  const target = e.target as UUIInputElement;
  const value = target.value;
}
```
