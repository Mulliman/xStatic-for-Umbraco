/**
 * Folder Create Note Action
 *
 * A workspace action that creates a new note inside the current folder.
 * Navigates to the note workspace in create mode with the folder as parent.
 *
 * Skills used: umbraco-workspace, umbraco-routing
 */

import { UmbWorkspaceActionBase } from "@umbraco-cms/backoffice/workspace";
import { UMB_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/workspace";
import { UMB_CREATE_NOTE_WORKSPACE_PATH_PATTERN } from "../paths.js";
import { NOTES_FOLDER_ENTITY_TYPE } from "../../constants.js";
import type { FolderWorkspaceContext } from "./folder-workspace.context.js";

export class FolderCreateNoteAction extends UmbWorkspaceActionBase {
  override async execute() {
    const workspaceContext = await this.getContext(UMB_WORKSPACE_CONTEXT) as unknown as FolderWorkspaceContext;
    const folderUnique = workspaceContext?.getUnique();

    const createPath = UMB_CREATE_NOTE_WORKSPACE_PATH_PATTERN.generateAbsolute({
      parentEntityType: NOTES_FOLDER_ENTITY_TYPE,
      parentUnique: folderUnique ?? "null",
    });

    history.pushState({}, "", createPath);
  }
}

export { FolderCreateNoteAction as api };
