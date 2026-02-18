# Property Editor UI Troubleshooting

Common issues and solutions when building property editor UIs.

---

## 404 Error When Creating Data Type

**Symptom:** Data Type fails to save, browser DevTools shows 404 when fetching schema.

**Cause:** The `propertyEditorSchemaAlias` references a schema that doesn't exist on the server.

**Solution:**
1. **Use a built-in schema** (recommended) - Change to `Umbraco.Plain.String`, `Umbraco.Integer`, etc.
2. **Create a C# DataEditor** - If you need custom behavior, implement the schema server-side:

```csharp
[DataEditor(
    alias: "MyPackage.CustomSchema",
    ValueType = ValueTypes.Integer)]
public class MyCustomPropertyEditor : DataEditor
{
    public MyCustomPropertyEditor(IDataValueEditorFactory dataValueEditorFactory)
        : base(dataValueEditorFactory)
    { }
}
```

See skill: `umbraco-property-editor-schema` for full details on creating custom schemas.

---

## Value Not Persisting with Umbraco.Plain.Json

**Symptom:**
- User selects/enters a value in the property editor
- Value appears correct in console logs
- After save or page reload, the field is empty
- No errors in the console

**Cause:** The `Umbraco.Plain.Json` schema stores **JavaScript objects directly**, not JSON strings.

Common mistake - treating the value as a JSON string:

```typescript
// WRONG: Trying to work with JSON strings
@property({ type: String })
public value = "";

#parseValue(): MyObject | null {
  return this.value ? JSON.parse(this.value) : null;
}

#onChange(event: Event) {
  const obj = event.target.value;
  this.value = JSON.stringify(obj);  // Umbraco expects an object, not a string!
  this.dispatchEvent(new UmbChangeEvent());
}
```

When you do this:
- Umbraco passes an object to your component
- You try to `JSON.parse()` an object (fails silently or returns wrong type)
- You `JSON.stringify()` and save a string
- Umbraco may store it, but the round-trip breaks

**Solution:** Work with objects directly when using `Umbraco.Plain.Json`:

```typescript
// CORRECT: Work with objects directly
@property({ type: Object })
public value: MyObject | null = null;

#onChange(event: CustomEvent & { target: MyInputElement }) {
  this.value = event.target.value;  // Pass object directly
  this.dispatchEvent(new UmbChangeEvent());
}

override render() {
  return html`
    <my-input
      .value=${this.value}
      @change=${this.#onChange}>
    </my-input>
  `;
}
```

### Schema Value Type Reference

| Schema Alias | Value Type | `@property()` Type |
|--------------|------------|-------------------|
| `Umbraco.Plain.String` | `string` | `{ type: String }` |
| `Umbraco.Plain.Integer` | `number` | `{ type: Number }` |
| `Umbraco.Plain.Json` | `object` | `{ type: Object }` |
| `Umbraco.TextBox` | `string` | `{ type: String }` |

### Debugging Tip

Add console logs to your value setter to see what Umbraco is actually passing:

```typescript
set value(val: unknown) {
  console.log('[my-editor] value setter:', typeof val, val);
  this._value = val as MyObject;
}
```

---

## UUI Component Issues

See [UUI-GOTCHAS.md](./UUI-GOTCHAS.md) for issues specific to Umbraco UI Library components (combobox, input, etc.).
