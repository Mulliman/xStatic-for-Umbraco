/**
 * @fileoverview Workspace Constants
 *
 * Defines aliases for Notes workspaces.
 * Workspaces are the main editing interfaces for content.
 *
 * The workspace system links to entity types via the `meta.entityType`
 * property in workspace manifests. When a tree item is clicked,
 * Umbraco finds the workspace with a matching entity type.
 *
 * Skills demonstrated: umbraco-workspace, umbraco-routing
 */

/**
 * Alias for the Note workspace.
 *
 * The note workspace provides the editing interface for notes,
 * including title, content, tags, and metadata views.
 *
 * Links to entity type: `notes-note` (NOTES_NOTE_ENTITY_TYPE)
 *
 * @constant {string}
 */
export const NOTES_NOTE_WORKSPACE_ALIAS = "Notes.Workspace.Note";

/**
 * Alias for the Folder workspace.
 *
 * The folder workspace displays the contents of a folder
 * in a grid view. It's read-only - folder operations are
 * performed via entity actions.
 *
 * Links to entity type: `notes-folder` (NOTES_FOLDER_ENTITY_TYPE)
 *
 * @constant {string}
 */
export const NOTES_FOLDER_WORKSPACE_ALIAS = "Notes.Workspace.Folder";
