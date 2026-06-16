---
name: umbraco-validation-checks
description: Browser validation checks for testing Umbraco backoffice extensions manually
version: 1.0.0
location: managed
allowed-tools: Read
---

# Umbraco Extension Validation Checks

Reference skill containing validation checks for manual browser testing of Umbraco backoffice extensions. Load this skill before beginning validation testing.

## Check Categories

| Category | File | Checks |
|----------|------|--------|
| Configuration | `configuration-checks.md` | VC-1 to VC-2 |
| Navigation | `navigation-checks.md` | VN-1 to VN-3 |
| API Debugging | `api-debugging-checks.md` | VA-1 to VA-3 |
| Form Controls | `form-control-checks.md` | VF-1 to VF-2 |
| Workspace | `workspace-checks.md` | VW-1 to VW-3 |

## Quick Reference

| ID | Check | Common Symptom |
|----|-------|----------------|
| **Configuration** |||
| VC-1 | Section Permissions | New section not visible |
| VC-2 | User Group Access | Extension appears for some users only |
| **Navigation** |||
| VN-1 | Tree Complexity | Tree not rendering or items missing |
| VN-2 | Hidden Tree Actions | Cannot find expected button/action |
| VN-3 | Menu Item Visibility | Menu items not appearing |
| **API Debugging** |||
| VA-1 | 400 Error Investigation | API calls failing silently |
| VA-2 | Request Payload Validation | Wrong data structure being sent |
| VA-3 | CORS and Auth Issues | Requests blocked or unauthorized |
| **Form Controls** |||
| VF-1 | Select/Combobox Behavior | Select not populating and causing 400 errors |
| VF-2 | Input Binding Issues | Values not updating or saving |
| **Workspace** |||
| VW-1 | Missing Save Button | Editable workspace has no Save button |
| VW-2 | Data Not Loading | Workspace opens but shows empty values |
| VW-3 | Submit Not Working | Save clicked but nothing happens |

## Usage

**Always load this skill before starting manual browser validation.**

Read all check files when validating a new extension, or focus on specific categories based on the symptoms you observe.

| Symptom | Load Files |
|---------|------------|
| "Can't see my extension" | configuration-checks, navigation-checks |
| "API not working" | api-debugging-checks |
| "Form doesn't work" | form-control-checks |
| "Tree issues" | navigation-checks |
| "Workspace issues" | workspace-checks |
| "No Save button" | workspace-checks |

## Validation Workflow

1. **Before testing**: Ensure the extension is built and the browser cache is cleared
2. **Check DevTools Console**: Open Chrome DevTools (F12) before interacting
3. **Check Network tab**: Filter by `Fetch/XHR` to see API calls
4. **Read relevant check files** based on what you observe

## Capturing New Issues

When you encounter a validation issue not covered by existing checks:

1. **Log it immediately** in `discovered-issues.md`
2. Include: symptom, root cause, solution, suggested category
3. Issues will be reviewed and promoted to proper checks

This compounds knowledge over time - every validation session improves future sessions.

## Related Skills

| Pattern Area | Skill |
|--------------|-------|
| Tree implementation | `umbraco-tree` |
| Section setup | `umbraco-sections` |
| API client setup | `umbraco-openapi-client` |
| Workspace structure | `umbraco-workspace` |
