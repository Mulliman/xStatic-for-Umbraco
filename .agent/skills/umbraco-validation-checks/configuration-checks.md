# Configuration Checks

## VC-1: Section Permissions

**Common Symptom:** New section not visible in the backoffice sidebar

When creating a new section, it won't appear unless the user's group has permission to access it.

**Before testing a new section:**

1. Go to **Users** > **User Groups** > **Administrators**
2. Scroll to **Sections** (or "Allowed Sections")
3. Ensure your new section is checked/enabled
4. Save the user group
5. **Refresh the page** (Ctrl+Shift+R / Cmd+Shift+R)

**Why this happens:** Umbraco's permission system hides sections by default. Even the admin user needs explicit group permission to see new sections.

**Code verification:** Check if the section manifest is registered:

```typescript
// Should be in umbraco-package.json or registered via entry point
{
  type: 'section',
  alias: 'My.Section',
  name: 'My Section',
  meta: {
    label: 'My Section',
    pathname: 'my-section'
  }
}
```

---

## VC-2: User Group Access

**Common Symptom:** Extension works for one user but not another

Different user groups have different permissions. When validating:

1. **Test with the admin account first** - this has the most permissions
2. If it works for admin but not other users, it's a permissions issue
3. Check the specific user group's allowed sections and permissions

**Debug checklist:**

- [ ] Is the user logged in with the correct account?
- [ ] Does the user's group have access to the section?
- [ ] Are there any `conditions` on the extension that might filter by user role?

**Example condition that limits access:**

```typescript
{
  type: 'dashboard',
  alias: 'My.Dashboard',
  conditions: [
    {
      alias: 'Umb.Condition.SectionAlias',
      match: 'My.Section'  // Only shows when in this section
    }
  ]
}
```
