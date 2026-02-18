/**
 * Folder Create Folder Action
 *
 * A workspace action that creates a new subfolder inside the current folder.
 * Opens a modal to enter the folder name and creates via API.
 * After creation, navigates to the new folder's workspace.
 *
 * Skills used: umbraco-workspace, umbraco-modals, umbraco-notifications, umbraco-routing
 */

import { UmbWorkspaceActionBase } from "@umbraco-cms/backoffice/workspace";
import { UMB_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/workspace";
import { UMB_MODAL_MANAGER_CONTEXT } from "@umbraco-cms/backoffice/modal";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import { UMB_ACTION_EVENT_CONTEXT } from "@umbraco-cms/backoffice/action";
import { UmbRequestReloadChildrenOfEntityEvent } from "@umbraco-cms/backoffice/entity-action";
import { NoteswikiService } from "../../api/index.js";
import { FOLDER_NAME_MODAL } from "../../entity-actions/rename-folder.modal-token.js";
import { UMB_EDIT_FOLDER_WORKSPACE_PATH_PATTERN } from "../paths.js";
import { NOTES_FOLDER_ENTITY_TYPE } from "../../constants.js";
import type { FolderWorkspaceContext } from "./folder-workspace.context.js";

export class FolderCreateFolderAction extends UmbWorkspaceActionBase {
  override async execute() {
    // Get the current folder's unique ID
    const workspaceContext = await this.getContext(UMB_WORKSPACE_CONTEXT) as unknown as FolderWorkspaceContext;
    const parentUnique = workspaceContext?.getUnique() ?? null;

    // Open create folder modal
    const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
    if (!modalManager) return;

    const modal = modalManager.open(this, FOLDER_NAME_MODAL, {
      data: {
        headline: "Create Folder",
        currentName: "",
        confirmLabel: "Create",
      },
    });

    const result = await modal.onSubmit().catch(() => undefined);
    if (!result?.name) return;

    try {
      // Create folder via API
      const unique = crypto.randomUUID();

      await NoteswikiService.createFolder({
        body: { unique, name: result.name, parentUnique },
      });

      // Show success notification
      const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
      notificationContext?.peek("positive", {
        data: {
          headline: "Folder created",
          message: `Folder "${result.name}" has been created.`,
        },
      });

      // Refresh tree by dispatching reload event
      const eventContext = await this.getContext(UMB_ACTION_EVENT_CONTEXT);
      if (eventContext) {
        eventContext.dispatchEvent(
          new UmbRequestReloadChildrenOfEntityEvent({
            entityType: NOTES_FOLDER_ENTITY_TYPE,
            unique: parentUnique,
          })
        );
      }

      // Navigate to the new folder's workspace
      const folderPath = UMB_EDIT_FOLDER_WORKSPACE_PATH_PATTERN.generateAbsolute({
        unique,
      });
      history.pushState({}, "", folderPath);
    } catch (error) {
      console.error("Error creating folder:", error);

      const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
      notificationContext?.peek("danger", {
        data: {
          headline: "Error",
          message: "Failed to create the folder. Please try again.",
        },
      });
    }
  }
}

export { FolderCreateFolderAction as api };
