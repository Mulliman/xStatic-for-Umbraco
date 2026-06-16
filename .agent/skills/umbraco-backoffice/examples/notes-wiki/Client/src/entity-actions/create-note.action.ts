/**
 * @fileoverview Create Note Entity Action
 *
 * Entity action that appears in the tree context menu to create new notes.
 * When executed, it navigates to the note workspace in create mode.
 *
 * **Entity Actions Overview:**
 *
 * Entity actions are context menu items that appear when right-clicking
 * tree items. They're registered via manifests with `forEntityTypes`
 * determining which entity types show the action.
 *
 * **Action Flow:**
 *
 * ```
 * User right-clicks tree item
 *         │
 *         └─── Context menu appears with matching entity actions
 *                    │
 *                    └─── User clicks "Create Note"
 *                              │
 *                              └─── execute() called
 *                                        │
 *                                        └─── Navigate to create workspace URL
 * ```
 *
 * **Navigation Pattern:**
 *
 * Instead of opening a modal, this action navigates to the workspace URL.
 * The workspace handles the create flow, including form display and saving.
 * This is the standard Umbraco pattern for content creation.
 *
 * Skills demonstrated: umbraco-entity-actions, umbraco-routing
 */

import { UMB_CREATE_NOTE_WORKSPACE_PATH_PATTERN } from "../workspace/paths.js";
import { UmbEntityActionBase } from "@umbraco-cms/backoffice/entity-action";

/**
 * Entity action for creating new notes.
 *
 * Extends `UmbEntityActionBase` which provides:
 * - `this.args` - Contains entityType and unique of the clicked item
 * - Access to host controller for context consumption
 *
 * The generic parameter `<never>` indicates this action doesn't require
 * any additional repository or API class.
 *
 * @extends UmbEntityActionBase<never>
 *
 * @example
 * // Registered in manifests.ts:
 * {
 *   type: "entityAction",
 *   kind: "default",
 *   alias: "Notes.EntityAction.CreateNote",
 *   api: () => import("./create-note.action.js"),
 *   forEntityTypes: [NOTES_ROOT_ENTITY_TYPE, NOTES_FOLDER_ENTITY_TYPE],
 *   meta: { icon: "icon-notepad", label: "Create Note" },
 * }
 */
export class CreateNoteEntityAction extends UmbEntityActionBase<never> {
  /**
   * Executes the create note action.
   *
   * Generates the workspace URL for creating a new note under the clicked
   * parent and navigates to it using `history.pushState`.
   *
   * **URL Pattern:**
   * `/section/notes/workspace/notes-note/create/parent/{parentEntityType}/{parentUnique}`
   *
   * The workspace route parses these parameters to set up the scaffold
   * with the correct parent reference.
   *
   * @override
   */
  override async execute() {
    // Generate the create workspace URL with parent info
    const createPath = UMB_CREATE_NOTE_WORKSPACE_PATH_PATTERN.generateAbsolute({
      parentEntityType: this.args.entityType,
      parentUnique: this.args.unique ?? "null",
    });

    // Navigate to the workspace (SPA navigation)
    history.pushState({}, "", createPath);
  }
}

/**
 * Default export for Umbraco's extension loader.
 *
 * When the manifest specifies `api: () => import("./create-note.action.js")`,
 * Umbraco looks for the default export to instantiate the action.
 */
export default CreateNoteEntityAction;
