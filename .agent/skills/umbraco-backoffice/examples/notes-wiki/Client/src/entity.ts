/**
 * @fileoverview Notes Wiki Entity Type Definitions
 *
 * Entity types are string identifiers that categorize different kinds of items
 * in the Umbraco backoffice. They serve as the critical link between:
 *
 * 1. **Tree Items** - Each tree item has an `entityType` property
 * 2. **Workspaces** - Workspaces declare which `entityType` they handle
 * 3. **Entity Actions** - Actions are registered for specific entity types
 *
 * When a user clicks a tree item, Umbraco uses the entity type to:
 * - Find the correct workspace to open
 * - Show the appropriate context menu actions
 * - Apply the correct permissions
 *
 * @example
 * // Tree item definition
 * const treeItem = {
 *   unique: "abc-123",
 *   entityType: NOTES_NOTE_ENTITY_TYPE, // "notes-note"
 *   name: "My Note"
 * };
 *
 * // Workspace manifest links via entityType
 * const workspaceManifest = {
 *   type: "workspace",
 *   meta: {
 *     entityType: NOTES_NOTE_ENTITY_TYPE // Must match tree item
 *   }
 * };
 *
 * Skills demonstrated: umbraco-extension-registry, umbraco-tree, umbraco-workspace
 */

/**
 * Entity type for the root of the Notes tree.
 *
 * The root entity type is used for:
 * - The tree root item (when `hideTreeRoot` is false)
 * - Root-level entity actions (create note/folder at root)
 * - Identifying the tree's root in breadcrumb navigation
 *
 * @constant {string}
 */
export const NOTES_ROOT_ENTITY_TYPE = "notes-root";

/**
 * Entity type for folder items in the Notes tree.
 *
 * Folders are containers for organizing notes hierarchically.
 * This entity type links folders to:
 * - The folder workspace (read-only view of contents)
 * - Folder-specific entity actions (rename, delete, create child)
 * - Tree item rendering with folder icon
 *
 * @constant {string}
 */
export const NOTES_FOLDER_ENTITY_TYPE = "notes-folder";

/**
 * Entity type for note items in the Notes tree.
 *
 * Notes are the primary content items that users create and edit.
 * This entity type links notes to:
 * - The note workspace (edit title, content, tags)
 * - Note-specific entity actions (delete)
 * - Tree item rendering with document icon
 *
 * @constant {string}
 */
export const NOTES_NOTE_ENTITY_TYPE = "notes-note";

/**
 * Type union for all Notes Wiki entity types.
 *
 * Use this type when you need to accept any Notes entity type
 * as a parameter or return value.
 *
 * @example
 * function handleEntity(entityType: NotesEntityType): void {
 *   switch (entityType) {
 *     case NOTES_NOTE_ENTITY_TYPE:
 *       // Handle note
 *       break;
 *     case NOTES_FOLDER_ENTITY_TYPE:
 *       // Handle folder
 *       break;
 *   }
 * }
 */
export type NotesEntityType =
  | typeof NOTES_ROOT_ENTITY_TYPE
  | typeof NOTES_FOLDER_ENTITY_TYPE
  | typeof NOTES_NOTE_ENTITY_TYPE;
