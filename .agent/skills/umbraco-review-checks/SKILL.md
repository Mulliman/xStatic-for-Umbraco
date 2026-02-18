---
name: umbraco-review-checks
description: Review checks reference for validating Umbraco backoffice extensions
version: 1.1.0
location: managed
allowed-tools: Read
---

# Umbraco Extension Review Checks

Reference skill containing all review checks for the `umbraco-extension-reviewer` agent.

## Check Categories

| Category | File | Checks |
|----------|------|--------|
| Code Quality | `code-quality-checks.md` | CQ-1 to CQ-9 |
| Architecture | `architecture-checks.md` | AR-1 to AR-6 |
| UI Patterns | `ui-pattern-checks.md` | UI-1 to UI-7 |

## Quick Reference

| ID | Check | Severity | Auto-Fix |
|----|-------|----------|----------|
| **Code Quality** ||||
| CQ-1 | Extension Type Usage | Critical | Yes |
| CQ-2 | Manifest Registration | High | No |
| CQ-3 | Element Implementation | Medium | Partial |
| CQ-4 | Context API Usage | High | No |
| CQ-5 | State Management | Medium | No |
| CQ-6 | Localization | Medium | Partial |
| CQ-7 | Naming Conventions | Low | No |
| CQ-8 | Conditions | Low | No |
| CQ-9 | Property Editor Schema Alias | Critical | No |
| **Architecture** ||||
| AR-1 | Direct API Client Access | High | No |
| AR-2 | No Workspace Context | High | No |
| AR-3 | Source Pattern Verification | Medium | No |
| AR-4 | Inconsistent Persistence | Medium | No |
| AR-5 | Missing Repository Layer | High | No |
| AR-6 | Circular Context Dependencies | Critical | No |
| **UI Patterns** ||||
| UI-1 | Custom Error Handling | High | Partial |
| UI-2 | Layout Component Issues | High | No |
| UI-3 | Non-UUI Component Usage | Medium | Partial |
| UI-4 | Enum/Select Handling | Medium | Partial |
| UI-5 | Missing Loading States | Low | No |
| UI-6 | Accessibility Issues | Medium | No |
| UI-7 | Inline Styles | Low | Partial |

## Usage

Read the relevant category file(s) based on extension type:

| Extension Type | Load Files |
|---------------|------------|
| Dashboard | All three |
| Workspace | All three |
| Property Editor | code-quality, ui-pattern |
| Entity Action | code-quality only |
| Context/Repository | code-quality, architecture |

## Related Skills

| Pattern Area | Skill |
|--------------|-------|
| Repository pattern | `umbraco-repository-pattern` |
| Workspace context | `umbraco-workspace` |
| Notifications | `umbraco-notifications` |
| Context API | `umbraco-context-api` |
| Localization | `umbraco-localization` |

## Source References

### UUI Library

For UI pattern checks, refer to the UUI (Umbraco UI) library for component best practices.

**Check locally first** - The UUI source may be available in the workspace (e.g., `Umbraco.UI/packages/`). Use Glob to search for it.

**Online resources:**
- Storybook: https://uui.umbraco.com/
- GitHub: https://github.com/umbraco/Umbraco.UI

### Umbraco CMS Source

For architecture and pattern checks, compare against Umbraco CMS source implementations.

**Check locally first** - The Umbraco CMS source may be available in the workspace (e.g., `Umbraco-CMS/src/Umbraco.Web.UI.Client/`). Use Glob to search for reference implementations.

**Online resources:**
- GitHub: https://github.com/umbraco/Umbraco-CMS

When reviewing, prefer local source over web fetches for accuracy and speed.
