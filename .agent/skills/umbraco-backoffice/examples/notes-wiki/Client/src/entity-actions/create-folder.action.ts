/**
 * Create Folder Entity Action
 *
 * Allows creating a new folder from the tree context menu.
 * Opens a modal to enter the folder name and creates via API.
 * After creation, navigates to the new folder's workspace.
 *
 * Skills used: umbraco-entity-actions, umbraco-modals, umbraco-notifications, umbraco-routing
 */

import { UmbEntityActionBase, UmbRequestReloadChildrenOfEntityEvent } from "@umbraco-cms/backoffice/entity-action";
import { UMB_MODAL_MANAGER_CONTEXT } from "@umbraco-cms/backoffice/modal";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import { UMB_ACTION_EVENT_CONTEXT } from "@umbraco-cms/backoffice/action";
import { NoteswikiService } from "../api/index.js";
import { FOLDER_NAME_MODAL } from "./rename-folder.modal-token.js";
import { UMB_EDIT_FOLDER_WORKSPACE_PATH_PATTERN } from "../workspace/paths.js";

export class CreateFolderEntityAction extends UmbEntityActionBase<never> {
  override async execute() {
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
      const parentUnique = this.args.unique ?? null;
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
            entityType: this.args.entityType,
            unique: this.args.unique ?? null,
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

export default CreateFolderEntityAction;
