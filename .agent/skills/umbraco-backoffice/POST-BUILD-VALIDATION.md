# Post-Build Review & Validation

After creating or modifying an extension, follow this complete validation workflow.

## Build Verification

Before any other validation, ensure the code compiles:

```bash
# In the extension project directory
npm run build
```

**Requirements:**
- TypeScript compiles without errors
- No unresolved imports
- Output files generated in `dist/` or configured output directory

## Code Review (MANDATORY)

**ALWAYS run the extension reviewer after generating code:**

```
Spawn agent: umbraco-extension-reviewer
```

This agent checks for:
- Correct extension type usage
- Proper context consumption patterns
- Import path correctness
- UUI component usage
- Manifest registration

### Auto-Fix Policy

| Severity | Action |
|----------|--------|
| **High** | Fix immediately without asking |
| **Medium** | Fix immediately without asking |
| **Low** | Note for user, fix if straightforward |
| **Info** | Ignore unless user requests |

## Agent Triggering Flow

```
Extension Built
        ↓
┌───────────────────────────────────────┐
│  Build Verification                   │
│  - npm run build                      │
│  - Check for TypeScript errors        │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│  AGENT: umbraco-extension-reviewer    │
│  - Review code patterns               │
│  - Check best practices               │
│  - Auto-fix High/Medium issues        │
└───────────────────────────────────────┘
        ↓
┌───────────────────────────────────────┐
│  AGENT: skill-quality-reviewer        │
│  - Fix outdated imports/types         │
│  - Apply documentation-based fixes    │
└───────────────────────────────────────┘
        ↓
Browser Testing
        ↓
Run validate-skills
```

## Agent Summary

| Agent | Purpose | Trigger Point |
|-------|---------|---------------|
| `umbraco-extension-reviewer` | QA review for best practices | After any umbraco-* skill generates code |
| `skill-quality-reviewer` | Fix code patterns, imports, types | After extension build/load, before validation |

## Browser Testing Workflow

After code review passes, test in the browser:

### 1. Start Umbraco

```bash
# From Umbraco project root
dotnet run
```

### 2. Navigate to Extension

Open the backoffice and navigate to where your extension should appear.

### 3. What to Verify

| Check | How to Verify |
|-------|---------------|
| **Extension loads** | No console errors on page load |
| **UI renders** | Visual elements appear as designed |
| **Interactions work** | Buttons, inputs, navigation function |
| **Data flows** | API calls succeed, data displays |
| **Context available** | No "context not found" errors |

### 4. Browser DevTools Checks

Open DevTools (F12) and verify:

- **Console**: No red errors related to your extension
- **Network**: API calls return 200/successful responses
- **Elements**: Your custom elements render in the DOM

## When Tests Fail

### Build Errors

1. Read the error message carefully
2. Check import paths match actual file locations
3. Verify types are correctly imported from `@umbraco-cms/backoffice/*`

### Extension Not Loading

1. Check `umbraco-package.json` has correct paths
2. Verify the extension is registered with correct alias
3. Check browser console for manifest loading errors

### Context Not Found

1. Ensure parent element provides the context
2. Check you're consuming the correct context token
3. Verify context is available at the DOM level where you consume it

### API Errors

1. Check authentication - use `umbraco-openapi-client` skill
2. Verify endpoint URL matches backend controller
3. Check request/response payload format

## Complete Workflow Summary

```
1. Create extension ──► Use appropriate umbraco-* skill
        ↓
2. Build ──► npm run build (must pass)
        ↓
3. Code review ──► Spawn umbraco-extension-reviewer (MANDATORY)
        ↓
4. Fix issues ──► Auto-fix High/Medium severity
        ↓
5. Browser test ──► Verify extension works
        ↓
6. Validate ──► Run validate-skills
```

> **TIP**: The `umbraco-extension-reviewer` agent should run automatically after any umbraco-* skill generates code. This ensures extensions follow Umbraco's architecture and best practices.
