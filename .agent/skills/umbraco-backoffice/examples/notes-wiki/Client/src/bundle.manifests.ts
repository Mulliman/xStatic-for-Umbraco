/**
 * @fileoverview Notes Wiki Bundle Manifests
 *
 * This is the main entry point that aggregates all extension manifests.
 * The `umbraco-package.json` references this file to load the extension.
 *
 * **How Umbraco Loads Extensions:**
 *
 * 1. Umbraco reads `umbraco-package.json` in the App_Plugins folder
 * 2. The `extensions` property points to this bundle file
 * 3. Umbraco imports this file and reads the `manifests` export
 * 4. Each manifest is registered with the extension registry
 * 5. Extensions become active based on their conditions
 *
 * **Extension Loading Order:**
 *
 * Umbraco resolves dependencies automatically, but we organize logically:
 * 1. Entry point - Initializes API client before anything else
 * 2. Section & Sidebar - Creates the navigation structure
 * 3. Menu & Tree - Provides hierarchical navigation
 * 4. Dashboard & Workspace - Content viewing and editing
 * 5. Entity Actions - Context menu operations
 * 6. Localization - Translation strings
 *
 * **Learning Path for This Example:**
 *
 * BEGINNER: Start with section + dashboard to create a simple admin panel.
 * - Look at `section/manifests.ts` and `dashboard/manifests.ts`
 * - Learn how conditions link dashboards to sections
 *
 * INTERMEDIATE: Add tree navigation for hierarchical data.
 * - Look at `sidebar/manifests.ts`, `menu/manifests.ts`, `tree/manifests.ts`
 * - Understand how entityType links tree items to workspaces
 *
 * ADVANCED: Create full workspaces with contexts and views.
 * - Look at `workspace/manifests.ts` and workspace context files
 * - Learn the repository pattern for data operations
 *
 * **Key Connection Patterns:**
 *
 * ```
 * Section ─┬─> Dashboard (via SectionAlias condition)
 *          └─> SidebarApp (via SectionAlias condition)
 *                  │
 *                  └─> Menu (via meta.menu)
 *                        │
 *                        └─> MenuItem (via meta.menus)
 *                              │
 *                              └─> Tree (via meta.treeAlias)
 *                                    │
 *                                    └─> TreeItem click
 *                                          │
 *                                          └─> Workspace (via entityType match)
 *                                                │
 *                                                └─> WorkspaceView (via condition)
 * ```
 *
 * Skills demonstrated: umbraco-bundle, umbraco-extension-registry
 */

// =============================================================================
// IMPORT MANIFEST COLLECTIONS
// Each feature directory exports its manifests array
// =============================================================================

import { manifests as section } from "./section/manifests.js";
import { manifests as sidebar } from "./sidebar/manifests.js";
import { manifests as menu } from "./menu/manifests.js";
import { manifests as dashboard } from "./dashboard/manifests.js";
import { manifests as tree } from "./tree/manifests.js";
import { manifests as workspace } from "./workspace/manifests.js";
import { manifests as entityActions } from "./entity-actions/manifests.js";
import { manifests as localization } from "./localization/manifests.js";

// =============================================================================
// AGGREGATE ALL MANIFESTS
// =============================================================================

/**
 * All extension manifests for the Notes Wiki package.
 *
 * This array is exported and consumed by Umbraco's extension loader.
 * The loader reads this array and registers each manifest with the
 * extension registry.
 *
 * @remarks
 * The entry point is defined inline here to demonstrate that manifests
 * can be defined directly or imported from feature modules.
 *
 * @example
 * // In umbraco-package.json:
 * {
 *   "name": "Notes Wiki",
 *   "extensions": ["./notes-wiki.js"]
 * }
 * // notes-wiki.js imports and re-exports this manifests array
 */
export const manifests: Array<UmbExtensionManifest> = [
  // =========================================================================
  // ENTRY POINT
  // Runs first to initialize the API client with authentication
  // =========================================================================
  {
    type: "backofficeEntryPoint",
    alias: "Notes.EntryPoint",
    name: "Notes Wiki Entry Point",
    js: () => import("./entry-point.js"),
  },

  // =========================================================================
  // SECTION
  // Top-level navigation item in the backoffice header
  // =========================================================================
  ...section,

  // =========================================================================
  // SIDEBAR & NAVIGATION
  // Left panel structure with menu and tree
  // =========================================================================
  ...sidebar,
  ...menu,
  ...tree,

  // =========================================================================
  // CONTENT AREAS
  // Dashboard for welcome/overview, Workspaces for editing
  // =========================================================================
  ...dashboard,
  ...workspace,

  // =========================================================================
  // ENTITY ACTIONS
  // Context menu items for tree nodes (create, delete, rename)
  // =========================================================================
  ...entityActions,

  // =========================================================================
  // LOCALIZATION
  // Translation strings for UI labels
  // =========================================================================
  ...localization,
];
