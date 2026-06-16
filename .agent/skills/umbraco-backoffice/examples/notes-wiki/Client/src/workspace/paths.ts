/**
 * Notes Wiki Workspace Path Patterns
 *
 * Defines URL patterns for navigating to note and folder workspaces.
 * Used by entity actions to navigate to create/edit screens.
 *
 * Skills used: umbraco-routing
 */

import {
  NOTES_SECTION_PATHNAME,
  NOTES_NOTE_ENTITY_TYPE,
  NOTES_FOLDER_ENTITY_TYPE,
} from "../constants.js";
import { UmbPathPattern } from "@umbraco-cms/backoffice/router";
import { UMB_WORKSPACE_PATH_PATTERN } from "@umbraco-cms/backoffice/workspace";
import type { UmbEntityModel, UmbEntityUnique } from "@umbraco-cms/backoffice/entity";

// =============================================================================
// NOTE WORKSPACE PATHS
// =============================================================================

/**
 * Base path for note workspace
 */
export const UMB_NOTE_WORKSPACE_PATH = UMB_WORKSPACE_PATH_PATTERN.generateAbsolute({
  sectionName: NOTES_SECTION_PATHNAME,
  entityType: NOTES_NOTE_ENTITY_TYPE,
});

/**
 * Path pattern for creating a new note
 * Usage: generateAbsolute({ parentEntityType: 'notes-folder', parentUnique: 'guid-here' })
 */
export const UMB_CREATE_NOTE_WORKSPACE_PATH_PATTERN = new UmbPathPattern<{
  parentEntityType: UmbEntityModel["entityType"];
  parentUnique: UmbEntityUnique;
}>("create/parent/:parentEntityType/:parentUnique", UMB_NOTE_WORKSPACE_PATH);

/**
 * Path pattern for editing an existing note
 * Usage: generateAbsolute({ unique: 'guid-here' })
 */
export const UMB_EDIT_NOTE_WORKSPACE_PATH_PATTERN = new UmbPathPattern<{
  unique: UmbEntityUnique;
}>("edit/:unique", UMB_NOTE_WORKSPACE_PATH);

// =============================================================================
// FOLDER WORKSPACE PATHS
// =============================================================================

/**
 * Base path for folder workspace
 */
export const UMB_FOLDER_WORKSPACE_PATH = UMB_WORKSPACE_PATH_PATTERN.generateAbsolute({
  sectionName: NOTES_SECTION_PATHNAME,
  entityType: NOTES_FOLDER_ENTITY_TYPE,
});

/**
 * Path pattern for viewing a folder's contents
 * Usage: generateAbsolute({ unique: 'guid-here' })
 */
export const UMB_EDIT_FOLDER_WORKSPACE_PATH_PATTERN = new UmbPathPattern<{
  unique: UmbEntityUnique;
}>("edit/:unique", UMB_FOLDER_WORKSPACE_PATH);
