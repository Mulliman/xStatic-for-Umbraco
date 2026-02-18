---
name: umbraco-backoffice
description: Umbraco backoffice extension customisation - complete working examples showing how extension types combine
version: 1.3.0
location: managed
allowed-tools: Read, Write, Edit, WebFetch
---

# Umbraco Backoffice Extensions Overview

## What This Skill Does

Backoffice customisations are **combinations of extension types** working together:
- A "custom admin area" = Section + Menu + Dashboard
- A "data management tool" = Section + Menu + Workspace
- A "hierarchical browser" = Section + Menu + Tree + Workspace

This skill provides complete working blueprints. The source code is in `./examples/` - copy and adapt for your needs.

For details on individual extension types, invoke the referenced sub-skills.

> **TIP**: If the Umbraco CMS source code is available in your workspace, use it as a reference and for inspiration. The backoffice client code in `src/Umbraco.Web.UI.Client/src/packages/` shows production implementations of all extension types - study how the core team structures sections, workspaces, trees, and other patterns.

---

## Required Workflow

**CRITICAL**: This workflow is MANDATORY for ALL extension development.

```
1. PLAN ──► Read PRE-BUILD-PLANNING.md FIRST
   │        Draw wireframe, label extension types, identify UUI components
   │        ⚠️ DO NOT write code until wireframe is approved
   ↓
2. BUILD ──► Use examples and sub-skills to create extension
   │
   │        ⛔ STOP - Do not skip validation
   ↓
3. VALIDATE ──► MANDATORY post-build steps:
               • npm run build (must pass)
               • Spawn umbraco-extension-reviewer agent
               • Fix High/Medium issues without asking
               • Browser test per POST-BUILD-VALIDATION.md
```

**If you skip planning**: You WILL build the wrong extension type.
**If you skip validation**: Bugs WILL reach the user.

This workflow applies whether invoked via `/umbraco-quickstart` or directly.
=======
**CRITICAL**: Follow this workflow for ALL extension development:

```
1. PLAN ──► Read PRE-BUILD-PLANNING.md, draw wireframes, identify extension types
      ↓
2. BUILD ──► Use examples and sub-skills to create extension
      ↓
3. VALIDATE ──► Read POST-BUILD-VALIDATION.md, run umbraco-extension-reviewer
```

- **Never skip planning** - Wireframes prevent building the wrong extension type
- **Never skip validation** - The reviewer catches issues before they reach users

---

## Available Examples

Each example has a detailed README.md with full documentation. See the `examples/` folder.

| Example | Complexity | What It Shows |
|---------|------------|---------------|
| **Blueprint** | Starter | Section + Menu + Dashboard + Workspace - the fundamental pattern |
| **tree-example** | Intermediate | Tree navigation in Settings section with Workspace |
| **TimeDashboard** | Advanced | 13+ extension types including Header Apps, Modals, Property Editors |
| **notes-wiki** | Full-stack | Complete C# backend with CRUD, hierarchical tree, multiple workspaces |

### Quick Reference

- **Need a new section?** Start with `Blueprint`
- **Need tree navigation?** See `tree-example`
- **Need specific extension type?** Check `TimeDashboard` for examples
- **Need full-stack with API?** Study `notes-wiki`

---

## Using the Examples

1. **Browse** the `examples/` folder and read the README.md for each example
2. **Copy** the example closest to your needs into your project
3. **Rename** aliases from the example namespace to your own (e.g., `Blueprint.*` to `MyApp.*`)
4. **Update** the `entityType` values to match your domain
5. **Customise** the UI components for your use case
6. **Register** with Umbraco via `umbraco-package.json`
7. **Add project reference** to the main Umbraco instance - use skill `umbraco-add-extension-reference`

---

## Reference Documentation

Detailed reference material is available in separate files for on-demand loading:

| Reference | When to Read |
|-----------|--------------|
| [PRE-BUILD-PLANNING.md](./PRE-BUILD-PLANNING.md) | Before building any extension - visual planning, wireframes, UUI components |
| [EXTENSION-MAP.md](./EXTENSION-MAP.md) | "Where does extension type X appear in the UI?" - ASCII diagram showing all extension locations |
| [SUB-SKILLS-REFERENCE.md](./SUB-SKILLS-REFERENCE.md) | "What skill do I need for X?" - Complete index of all sub-skills by category |
| [POST-BUILD-VALIDATION.md](./POST-BUILD-VALIDATION.md) | After building - complete validation workflow, browser testing, debugging |
