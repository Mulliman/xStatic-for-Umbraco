/**
 * @fileoverview Notes Wiki Entity Actions Manifests
 *
 * Entity actions appear in the tree context menu when right-clicking items.
 * This file defines all context menu operations for notes and folders.
 *
 * **What are Entity Actions?**
 *
 * Entity actions are operations that can be performed on tree items:
 * - Create Note - Opens note workspace in create mode
 * - Create Folder - Shows modal to name new folder
 * - Rename Folder - Shows modal to change folder name
 * - Delete Note/Folder - Confirms and removes the item
 *
 * **Key Properties:**
 *
 * | Property        | Purpose                                    |
 * |-----------------|-------------------------------------------|
 * | `type`          | Always "entityAction"                      |
 * | `kind`          | "default" for custom, or built-in kinds   |
 * | `alias`         | Unique identifier for the action          |
 * | `forEntityTypes`| Which entity types show this action       |
 * | `weight`        | Sort order (higher = appears first)       |
 * | `api`           | Lazy import of action class               |
 * | `meta.icon`     | Icon shown in context menu                |
 * | `meta.label`    | Text shown in context menu                |
 *
 * **forEntityTypes Pattern:**
 *
 * The `forEntityTypes` array controls which tree items show each action:
 *
 * ```typescript
 * forEntityTypes: [NOTES_ROOT_ENTITY_TYPE, NOTES_FOLDER_ENTITY_TYPE]
 * // Action appears on: root node, folder nodes
 * // Action hidden on: note nodes
 * ```
 *
 * **Weight (Sort Order):**
 *
 * - 1100: Create Note (top of menu)
 * - 1000: Create Folder
 * - 900: Rename
 * - 100: Delete (bottom, dangerous actions last)
 *
 * Skills demonstrated: umbraco-entity-actions, umbraco-modals
 */

import {
  NOTES_ROOT_ENTITY_TYPE,
  NOTES_FOLDER_ENTITY_TYPE,
  NOTES_NOTE_ENTITY_TYPE,
} from "../constants.js";

/**
 * Create Note Entity Action
 *
 * Appears on: root, folders, and notes (to create sibling)
 * Navigates to the note workspace in create mode.
 */
const createNoteActionManifest: UmbExtensionManifest = {
  type: "entityAction",
  kind: "default",
  alias: "Notes.EntityAction.CreateNote",
  name: "Create Note Entity Action",
  weight: 1100, // High weight = appears near top
  api: () => import("./create-note.action.js"),
  forEntityTypes: [
    NOTES_ROOT_ENTITY_TYPE,
    NOTES_FOLDER_ENTITY_TYPE,
  ],
  meta: {
    icon: "icon-notepad",
    label: "Create Note",
  },
};

/**
 * Create Folder Entity Action
 *
 * Appears on: root and folders (to create nested folder)
 * Navigates to the folder workspace in create mode.
 */
const createFolderActionManifest: UmbExtensionManifest = {
  type: "entityAction",
  kind: "default",
  alias: "Notes.EntityAction.CreateFolder",
  name: "Create Folder Entity Action",
  weight: 1000, // Slightly lower than create note
  api: () => import("./create-folder.action.js"),
  forEntityTypes: [
    NOTES_ROOT_ENTITY_TYPE,
    NOTES_FOLDER_ENTITY_TYPE,
  ],
  meta: {
    icon: "icon-folder",
    label: "Create Folder",
  },
};

/**
 * Delete Note Entity Action
 *
 * Uses the built-in delete kind which handles confirmation modal.
 * Requires itemRepositoryAlias and detailRepositoryAlias for the delete operation.
 *
 * NOTE: This uses the 'delete' kind which is a built-in Umbraco action kind.
 * It automatically handles confirmation dialogs and calls the repository's delete method.
 *
 * For this to work properly, you would need to implement:
 * - An item repository (for fetching item details for confirmation)
 * - A detail repository (for the actual delete operation)
 *
 * For now, we'll use a simple custom delete action.
 */
const deleteNoteActionManifest: UmbExtensionManifest = {
  type: "entityAction",
  kind: "default",
  alias: "Notes.EntityAction.DeleteNote",
  name: "Delete Note Entity Action",
  weight: 100, // Low weight = appears near bottom
  api: () => import("./delete-note.action.js"),
  forEntityTypes: [NOTES_NOTE_ENTITY_TYPE],
  meta: {
    icon: "icon-trash",
    label: "Delete",
  },
};

/**
 * Delete Folder Entity Action
 */
const deleteFolderActionManifest: UmbExtensionManifest = {
  type: "entityAction",
  kind: "default",
  alias: "Notes.EntityAction.DeleteFolder",
  name: "Delete Folder Entity Action",
  weight: 100,
  api: () => import("./delete-folder.action.js"),
  forEntityTypes: [NOTES_FOLDER_ENTITY_TYPE],
  meta: {
    icon: "icon-trash",
    label: "Delete",
  },
};

/**
 * Rename Folder Entity Action
 *
 * Opens a modal dialog to rename the folder.
 * Skills used: umbraco-entity-actions, umbraco-modals
 */
const renameFolderActionManifest: UmbExtensionManifest = {
  type: "entityAction",
  kind: "default",
  alias: "Notes.EntityAction.RenameFolder",
  name: "Rename Folder Entity Action",
  weight: 900, // Below create actions, above delete
  api: () => import("./rename-folder.action.js"),
  forEntityTypes: [NOTES_FOLDER_ENTITY_TYPE],
  meta: {
    icon: "icon-edit",
    label: "Rename",
  },
};

/**
 * Folder Name Modal
 *
 * Modal element for creating and renaming folders.
 * Reused by both Create Folder and Rename Folder actions.
 * Skills used: umbraco-modals
 */
const folderNameModalManifest: UmbExtensionManifest = {
  type: "modal",
  alias: "Notes.Modal.FolderName",
  name: "Folder Name Modal",
  element: () => import("./rename-folder.modal.element.js"),
};

export const manifests: Array<UmbExtensionManifest> = [
  createNoteActionManifest,
  createFolderActionManifest,
  deleteNoteActionManifest,
  deleteFolderActionManifest,
  renameFolderActionManifest,
  folderNameModalManifest,
];
