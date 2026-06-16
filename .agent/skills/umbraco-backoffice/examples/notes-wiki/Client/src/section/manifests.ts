/**
 * Notes Section Manifest
 *
 * This file registers the Notes section in the Umbraco backoffice.
 *
 * A Section is a top-level navigation item in the backoffice header.
 * Users must have permission to access a section before it appears.
 *
 * Skills used: umbraco-sections
 *
 * Key properties:
 * - alias: Unique identifier, referenced by conditions in other extensions
 * - meta.label: Display text in the navigation bar
 * - meta.pathname: URL path segment (e.g., /umbraco/section/notes)
 * - weight: Sort order (higher = further left)
 */

import { NOTES_SECTION_ALIAS, NOTES_SECTION_PATHNAME } from "../constants.js";

export const manifests: Array<UmbExtensionManifest> = [
  {
    type: "section",
    alias: NOTES_SECTION_ALIAS,
    name: "Notes Section",
    weight: 10, // Appears after Content, Media, Settings
    meta: {
      label: "Notes",
      pathname: NOTES_SECTION_PATHNAME,
    },
  },
];
