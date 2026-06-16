/**
 * @fileoverview Notes Dashboard Manifests
 *
 * Registers dashboard views for the Notes section.
 * Dashboards appear as tabs when entering a section, before any item is selected.
 *
 * **What are Dashboards?**
 *
 * Dashboards are landing pages for sections. They provide:
 * - Welcome/overview information
 * - Quick access to common tasks
 * - Search and filtering interfaces
 * - Statistics and reporting
 *
 * **Multiple Dashboard Tabs:**
 *
 * A section can have multiple dashboards, shown as tabs:
 * ```
 * ┌─────────┬────────┬─────────────────────────────────┐
 * │ Welcome │ Browse │                                 │
 * ├─────────┴────────┴─────────────────────────────────┤
 * │                                                    │
 * │    Dashboard content here                          │
 * │                                                    │
 * └────────────────────────────────────────────────────┘
 * ```
 *
 * **Key Properties:**
 *
 * | Property       | Purpose                                      |
 * |----------------|---------------------------------------------|
 * | `type`         | Always "dashboard"                          |
 * | `alias`        | Unique identifier                           |
 * | `element`      | Lazy-loaded component                       |
 * | `weight`       | Tab order (higher = appears first/left)     |
 * | `meta.label`   | Tab label text                              |
 * | `meta.pathname`| URL segment (e.g., /section/notes/welcome)  |
 * | `conditions`   | When to show this dashboard                 |
 *
 * **Conditions:**
 *
 * The `Umb.Condition.SectionAlias` condition ensures dashboards only
 * appear in their intended section. Without this, the dashboard would
 * appear in every section!
 *
 * Skills demonstrated: umbraco-dashboard, umbraco-conditions
 */

import { NOTES_DASHBOARD_ALIAS, NOTES_SECTION_ALIAS } from "../constants.js";

/**
 * Dashboard manifests for the Notes section.
 *
 * Includes:
 * - Welcome dashboard (weight: 200) - First tab, overview and recent notes
 * - Browse dashboard (weight: 100) - Second tab, grid view of all notes
 */
export const manifests: Array<UmbExtensionManifest> = [
  // =========================================================================
  // WELCOME DASHBOARD
  // First tab - shows overview and recent notes
  // =========================================================================
  {
    type: "dashboard",
    alias: NOTES_DASHBOARD_ALIAS,
    name: "Notes Dashboard",
    element: () => import("./notes-dashboard.element.js"),
    weight: 200, // Higher weight = appears first (leftmost tab)
    meta: {
      label: "Welcome",
      pathname: "welcome", // URL: /section/notes/dashboard/welcome
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: NOTES_SECTION_ALIAS, // Only show in Notes section
      },
    ],
  },

  // =========================================================================
  // BROWSE DASHBOARD
  // Second tab - grid/list view of all notes
  // =========================================================================
  {
    type: "dashboard",
    alias: "Notes.Dashboard.Browse",
    name: "Notes Browse Dashboard",
    element: () => import("./notes-browse-dashboard.element.js"),
    weight: 100, // Lower weight = appears after Welcome tab
    meta: {
      label: "Browse",
      pathname: "browse", // URL: /section/notes/dashboard/browse
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: NOTES_SECTION_ALIAS,
      },
    ],
  },
];
