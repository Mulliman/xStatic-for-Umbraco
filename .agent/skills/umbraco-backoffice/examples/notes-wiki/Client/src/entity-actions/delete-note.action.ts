/**
 * Delete Note Entity Action
 *
 * Deletes a note from the tree after confirmation.
 *
 * Skills used: umbraco-entity-actions, umbraco-modals, umbraco-notifications
 */

import { UmbEntityActionBase, UmbRequestReloadStructureForEntityEvent } from "@umbraco-cms/backoffice/entity-action";
import { UMB_CONFIRM_MODAL, UMB_MODAL_MANAGER_CONTEXT } from "@umbraco-cms/backoffice/modal";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import { NoteswikiService } from "../api/index.js";
import { UMB_ACTION_EVENT_CONTEXT } from "@umbraco-cms/backoffice/action";

export class DeleteNoteEntityAction extends UmbEntityActionBase<never> {
  override async execute() {
    const unique = this.args.unique;
    if (!unique) return;

    // Get modal manager to show confirmation
    const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
    if (!modalManager) return;

    const modal = modalManager.open(this, UMB_CONFIRM_MODAL, {
      data: {
        headline: "Delete Note",
        content: "Are you sure you want to delete this note? This action cannot be undone.",
        color: "danger",
        confirmLabel: "Delete",
      },
    });

    // onSubmit() resolves when user confirms, rejects when cancelled
    // We use a flag pattern to track if the user confirmed
    let confirmed = false;
    await modal.onSubmit().then(() => {
      confirmed = true;
    }).catch(() => {
      // User cancelled - do nothing
    });

    if (!confirmed) return;

    try {
      // Call API to delete
      await NoteswikiService.deleteNote({
        path: { id: unique },
      });

      // Show success notification
      const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
      notificationContext?.peek("positive", {
        data: {
          headline: "Note deleted",
          message: "The note has been deleted successfully.",
        },
      });

      // Request tree to reload structure - this tells the parent to reload its children
      const eventContext = await this.getContext(UMB_ACTION_EVENT_CONTEXT);
      if (eventContext) {
        const event = new UmbRequestReloadStructureForEntityEvent({
          entityType: this.args.entityType,
          unique: unique,
        });
        eventContext.dispatchEvent(event);
      }
    } catch (error) {
      console.error("Error deleting note:", error);

      const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
      notificationContext?.peek("danger", {
        data: {
          headline: "Error",
          message: "Failed to delete the note. Please try again.",
        },
      });
    }
  }
}

export default DeleteNoteEntityAction;
