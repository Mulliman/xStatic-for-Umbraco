/**
 * @fileoverview Section Constants
 *
 * Defines aliases and configuration for the Notes section and sidebar.
 * The section is the top-level navigation item in Umbraco's backoffice.
 *
 * Skills demonstrated: umbraco-sections
 */

/**
 * Alias for the Notes section.
 *
 * Sections appear in the main navigation bar (left side).
 * The alias is used in manifests to register and reference the section.
 *
 * @constant {string}
 */
export const NOTES_SECTION_ALIAS = "Notes.Section";

/**
 * URL pathname for the Notes section.
 *
 * This appears in the browser URL when the section is active.
 * Example: /umbraco/section/notes
 *
 * @constant {string}
 */
export const NOTES_SECTION_PATHNAME = "notes";

/**
 * Alias for the Notes sidebar app.
 *
 * Sidebar apps provide the left panel content within a section.
 * They typically contain trees, menus, or other navigation elements.
 *
 * @constant {string}
 */
export const NOTES_SIDEBAR_APP_ALIAS = "Notes.SidebarApp";
