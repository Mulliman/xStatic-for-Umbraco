# Navigation Checks

## VN-1: Tree Complexity

**Common Symptom:** Tree not rendering, items missing, or incorrect hierarchy

Trees in Umbraco are complex multi-part systems. When trees don't work:

**ALWAYS check these reference implementations first:**

1. **Use the `umbraco-tree` skill** - contains working examples
2. **Look at the notes-wiki example** if available in your project
3. **Check Umbraco CMS source** for reference tree implementations

**Tree requires multiple parts:**

| Part | Purpose |
|------|---------|
| Tree manifest | Registers the tree |
| Tree repository | Provides data to the tree |
| Tree store | Caches tree data |
| Tree item manifest | Renders individual items |
| Entity actions | Context menu items |

**Common tree issues:**

| Issue | Likely Cause |
|-------|--------------|
| Tree doesn't appear | Missing tree manifest or wrong section alias |
| Items don't load | Repository not returning correct data structure |
| Can't expand items | `hasChildren` not set correctly |
| No context menu | Entity actions not registered for this entity type |

**Debug steps:**

1. Check Console for errors when clicking tree
2. Check Network tab - is the API being called?
3. Verify tree alias matches in all related manifests

---

## VN-2: Hidden Tree Actions

**Common Symptom:** Cannot find expected button or action

**Buttons and actions can be in several places:**

| Location | How to Access |
|----------|---------------|
| Tree context menu | **Right-click** on tree item |
| Tree item actions | Look for **"..."** (three dots) button on tree item row |
| Workspace header | Actions bar at top of workspace |
| Entity actions tray | Expandable tray (often bottom or side) |

**If you can't find a button:**

1. **Right-click the tree item** - context menu may have the action
2. **Hover over tree items** - action buttons may appear on hover
3. **Look for "..." or kebab menu** on the tree item row
4. **Check workspace header** if you've opened an item
5. **Scroll the workspace** - action bars can be at bottom

**Tree actions vs Entity actions:**

- **Tree actions**: Appear in tree context menu
- **Entity actions**: Appear in workspace header or action tray
- **Collection actions**: Appear in collection/list view toolbar

---

## VN-3: Menu Item Visibility

**Common Symptom:** Menu items not appearing where expected

Menu items require:

1. **Correct `menus` array** in manifest
2. **Section must be visible** to user
3. **Any conditions must be satisfied**

**Check the manifest:**

```typescript
{
  type: 'menuItem',
  alias: 'My.MenuItem',
  name: 'My Menu Item',
  menus: ['Umb.Menu.StructureSettings'],  // Must match existing menu
  meta: {
    label: 'My Item',
    icon: 'icon-settings'
  }
}
```

**Common menu aliases:**

| Menu | Alias |
|------|-------|
| Settings structure | `Umb.Menu.StructureSettings` |
| Content menu | `Umb.Menu.Content` |
| Media menu | `Umb.Menu.Media` |

If menu item doesn't appear, verify the menu alias is correct and the user has access to the parent section.
