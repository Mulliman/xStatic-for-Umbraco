/**
 * Rename Folder Entity Action
 *
 * Opens a modal dialog to rename a folder.
 * Skills used: umbraco-entity-actions, umbraco-modals, umbraco-notifications
 */

import { UmbEntityActionBase, UmbRequestReloadStructureForEntityEvent } from "@umbraco-cms/backoffice/entity-action";
import { UMB_MODAL_MANAGER_CONTEXT } from "@umbraco-cms/backoffice/modal";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import { NoteswikiService } from "../api/index.js";
import { UMB_ACTION_EVENT_CONTEXT } from "@umbraco-cms/backoffice/action";
import { FOLDER_NAME_MODAL } from "./rename-folder.modal-token.js";

export class RenameFolderEntityAction extends UmbEntityActionBase<never> {
  override async execute() {
    const unique = this.args.unique;
    if (!unique) return;

    // Get the current folder data
    let currentName = "";
    try {
      const response = await NoteswikiService.getFolder({
        path: { id: unique },
      });
      currentName = response.data.name;
    } catch {
      console.error("Failed to load folder");
      return;
    }

    // Open rename modal
    const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
    if (!modalManager) return;

    const modal = modalManager.open(this, FOLDER_NAME_MODAL, {
      data: {
        headline: "Rename Folder",
        currentName,
        confirmLabel: "Rename",
      },
    });

    const result = await modal.onSubmit().catch(() => undefined);

    if (!result?.name) return;

    try {
      // Call API to rename
      await NoteswikiService.updateFolder({
        path: { id: unique },
        body: {
          name: result.name,
        },
      });

      // Show success notification
      const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
      notificationContext?.peek("positive", {
        data: {
          headline: "Folder renamed",
          message: `Folder has been renamed to "${result.name}".`,
        },
      });

      // Refresh tree by dispatching structure reload event
      const eventContext = await this.getContext(UMB_ACTION_EVENT_CONTEXT);
      if (eventContext) {
        eventContext.dispatchEvent(
          new UmbRequestReloadStructureForEntityEvent({
            entityType: this.args.entityType,
            unique: unique,
          })
        );
      }
    } catch (error) {
      console.error("Error renaming folder:", error);

      const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
      notificationContext?.peek("danger", {
        data: {
          headline: "Error",
          message: "Failed to rename the folder. Please try again.",
        },
      });
    }
  }
}

export default RenameFolderEntityAction;
