# UUI Component Gotchas

Common issues when working with Umbraco UI Library (UUI) components in property editors.

---

## Selection Not Working with uui-combobox

**Symptom:**
- User searches for items in a combobox dropdown
- User clicks a search result to select it
- The dropdown closes but the selected item doesn't display
- No errors in the console

**Cause:** The `uui-combobox` component fires events in this order when a selection is made:

1. `@search` event fires when the dropdown closes (with empty search term)
2. `@change` event fires to handle the selection

If your `@search` handler clears the search results array when the search term is empty, the results are cleared *before* the `@change` event can look up the selected item.

```typescript
// PROBLEMATIC: Clearing results in search handler
#onSearch(event: UUIComboboxEvent) {
  const searchTerm = combobox.search?.trim() ?? "";
  if (!searchTerm) {
    this._searchResults = [];  // This clears results BEFORE @change fires!
    return;
  }
  // ...perform search
}
```

**Solution:** Maintain a separate cache of fetched items that persists independently of displayed search results:

```typescript
// Cache persists independently of displayed results
#itemCache = new Map<string, ItemDetails>();

async #performSearch(query: string): Promise<void> {
  // ... fetch results ...
  this._searchResults = results;

  // Cache all fetched items for later lookup
  for (const item of results) {
    this.#itemCache.set(item.id.toString(), item);
  }
}

#onSelect(event: UUIComboboxEvent) {
  const selectedId = combobox.value as string;

  // Look up from cache, NOT from _searchResults
  const selectedItem = this.#itemCache.get(selectedId);

  if (selectedItem) {
    this.value = selectedItem;
    this._searchResults = [];  // Safe to clear now
    this.dispatchEvent(new UmbChangeEvent());
  }
}
```
