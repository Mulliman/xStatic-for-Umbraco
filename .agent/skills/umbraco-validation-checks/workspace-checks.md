# Workspace Checks

## VW-1: Missing Save Button

**Common Symptom:** Custom workspace opens correctly, displays data, form fields work, but there is no Save button in the workspace footer. User cannot save changes.

**Note:** Not all workspaces need a Save button. Read-only workspaces, preview workspaces, and dashboard-style workspaces that don't edit data don't need one. This check only applies to workspaces intended to edit and persist entity data.

**Root cause:** Missing `workspaceAction` manifest. The workspace context may implement `submit()` correctly, but without registering a `workspaceAction` using `UmbSubmitWorkspaceAction`, no button appears.

**Debug checklist:**

- [ ] Is there a `workspaceAction` manifest registered?
- [ ] Does it use `UmbSubmitWorkspaceAction` as the `api`?
- [ ] Does the condition's `match` value exactly match your workspace alias?
- [ ] Is the manifest included in your bundle/entry point?

**Solution:** Add a workspaceAction manifest to your workspace manifests:

```typescript
import { UMB_WORKSPACE_CONDITION_ALIAS, UmbSubmitWorkspaceAction } from '@umbraco-cms/backoffice/workspace';

// In your manifests array:
{
  type: 'workspaceAction',
  kind: 'default',
  alias: 'My.WorkspaceAction.Save',
  name: 'Save Workspace Action',
  weight: 90,
  api: UmbSubmitWorkspaceAction,
  meta: {
    label: 'Save',
    look: 'primary',
    color: 'positive',
  },
  conditions: [
    {
      alias: UMB_WORKSPACE_CONDITION_ALIAS,
      match: 'My.Workspace.Alias',  // Must match your workspace alias
    },
  ],
}
```

**Why this happens:** Unlike some frameworks where save behavior is implicit, Umbraco workspaces require explicit registration of UI actions. The workspace context's `submit()` method handles the data persistence logic, but the button to trigger it must be separately registered as a `workspaceAction` extension.

---

## VW-2: Workspace Data Not Loading

**Common Symptom:** Workspace opens but shows empty/default values, even though data exists

**Debug checklist:**

- [ ] Check Network tab - is the GET request being made?
- [ ] Is the workspace context's `load()` method being called?
- [ ] Does the route include the correct entity ID parameter?
- [ ] Is the observable data being consumed correctly in the workspace view?

**Common causes:**

1. **Route mismatch** - The workspace route doesn't capture the ID parameter
2. **Context not requesting data** - `load()` not called or called with wrong ID
3. **Observable not subscribed** - Data loads but view doesn't react to it

**Verification:**

```typescript
// Check your workspace context implements load correctly
async load(unique: string) {
  // Should make API call and update state
  const { data } = await this.#repository.requestByUnique(unique);
  if (data) {
    this.#data.setValue(data);
  }
}
```

---

## VW-3: Workspace Submit Not Working

**Common Symptom:** Save button exists and can be clicked, but nothing happens or data doesn't persist

**Debug checklist:**

- [ ] Check Network tab - is a POST/PUT request being made when Save is clicked?
- [ ] If request is made, what is the response? (check for 400/500 errors)
- [ ] Does the workspace context implement `IUmbSubmittableWorkspaceContext`?
- [ ] Does the `submit()` method call the repository's create/save method?

**Common causes:**

1. **Submit not implemented** - Context doesn't implement `IUmbSubmittableWorkspaceContext`
2. **Repository method not called** - `submit()` exists but doesn't persist data
3. **Validation failing silently** - Form validation blocks submission

**Verification:**

```typescript
// Workspace context must implement submit
export class MyWorkspaceContext
  extends UmbEntityWorkspaceContextBase<MyEntityModel>
  implements IUmbSubmittableWorkspaceContext {

  async submit() {
    const data = this.#data.getValue();
    if (!data) return;

    if (this.getIsNew()) {
      await this.#repository.create(data);
    } else {
      await this.#repository.save(data);
    }
  }
}
```
