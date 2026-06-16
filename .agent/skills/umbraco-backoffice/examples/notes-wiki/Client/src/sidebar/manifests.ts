/**
 * Notes Sidebar App Manifest
 *
 * This file registers the SectionSidebarApp which provides the sidebar
 * navigation for the Notes section.
 *
 * A SectionSidebarApp appears in the left sidebar when its section is active.
 * It uses a condition to only appear in the Notes section.
 *
 * Skills used: umbraco-sections (SectionSidebarApp is part of sections)
 *
 * CONNECTION PATTERN:
 * Section.alias --> SidebarApp.conditions[].match
 * SidebarApp.meta.menu --> Menu.alias
 *
 * Key properties:
 * - kind: "menu" - Uses the built-in menu sidebar layout
 * - meta.menu: References the menu to display
 * - conditions: Only shows when in the Notes section
 */

import {
  NOTES_SECTION_ALIAS,
  NOTES_SIDEBAR_APP_ALIAS,
  NOTES_MENU_ALIAS,
} from "../constants.js";

export const manifests: Array<UmbExtensionManifest> = [
  {
    type: "sectionSidebarApp",
    kind: "menu",
    alias: NOTES_SIDEBAR_APP_ALIAS,
    name: "Notes Sidebar App",
    weight: 100,
    meta: {
      label: "Notes",
      menu: NOTES_MENU_ALIAS, // Links to our menu
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: NOTES_SECTION_ALIAS, // Only show in Notes section
      },
    ],
  },
];
