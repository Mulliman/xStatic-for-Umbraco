/**
 * Create Notes Collection Action Element
 *
 * The "Create" dropdown button in the collection toolbar.
 * Skills used: umbraco-collection-action, umbraco-umbraco-element, umbraco-modals
 */

import { html, css, customElement, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_CREATE_NOTE_WORKSPACE_PATH_PATTERN } from "../../workspace/paths.js";
import { NOTES_ROOT_ENTITY_TYPE } from "../../constants.js";
import { UMB_MODAL_MANAGER_CONTEXT } from "@umbraco-cms/backoffice/modal";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import { FOLDER_NAME_MODAL } from "../../entity-actions/rename-folder.modal-token.js";
import { NoteswikiService } from "../../api/index.js";
import { NOTES_COLLECTION_CONTEXT } from "../notes-collection.context-token.js";

@customElement("create-notes-collection-action")
export class CreateNotesCollectionActionElement extends UmbLitElement {
  @state()
  private _popoverOpen = false;

  #getNoteCreateUrl(): string {
    return UMB_CREATE_NOTE_WORKSPACE_PATH_PATTERN.generateAbsolute({
      parentEntityType: NOTES_ROOT_ENTITY_TYPE,
      parentUnique: "null",
    });
  }

  async #handleCreateFolder() {
    // Close the popover
    const popover = this.shadowRoot?.getElementById("create-popover") as HTMLElement & { hidePopover?: () => void };
    popover?.hidePopover?.();

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
      // Generate a new unique ID for the folder
      const unique = crypto.randomUUID();

      // Get parent from collection context (null for root)
      let parentUnique: string | null = null;
      try {
        const collectionContext = await this.getContext(NOTES_COLLECTION_CONTEXT);
        parentUnique = collectionContext?.getParentUnique() ?? null;
      } catch {
        // No collection context, use root
      }

      // Call API to create folder
      await NoteswikiService.createFolder({
        body: {
          unique,
          name: result.name,
          parentUnique,
        },
      });

      // Show success notification
      const notificationContext = await this.getContext(UMB_NOTIFICATION_CONTEXT);
      notificationContext?.peek("positive", {
        data: {
          headline: "Folder created",
          message: `Folder "${result.name}" has been created.`,
        },
      });

      // Refresh collection
      try {
        const collectionContext = await this.getContext(NOTES_COLLECTION_CONTEXT);
        collectionContext?.load();
      } catch {
        // No collection context
      }
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

  #onPopoverToggle(e: ToggleEvent) {
    this._popoverOpen = e.newState === "open";
  }

  override render() {
    return html`
      <uui-button
        look="outline"
        popovertarget="create-popover"
        label="Create"
      >
        Create
        <uui-symbol-expand .open=${this._popoverOpen}></uui-symbol-expand>
      </uui-button>
      <uui-popover-container
        id="create-popover"
        @toggle=${this.#onPopoverToggle}
      >
        <umb-popover-layout>
          <uui-menu-item
            label="Note"
            href=${this.#getNoteCreateUrl()}
          >
            <uui-icon slot="icon" name="icon-notepad"></uui-icon>
          </uui-menu-item>
          <uui-menu-item
            label="Folder"
            @click=${this.#handleCreateFolder}
          >
            <uui-icon slot="icon" name="icon-folder"></uui-icon>
          </uui-menu-item>
        </umb-popover-layout>
      </uui-popover-container>
    `;
  }

  static override styles = css`
    :host {
      display: contents;
    }

    uui-button {
      --uui-button-font-weight: 600;
    }

    uui-menu-item {
      min-width: 150px;
    }
  `;
}

export default CreateNotesCollectionActionElement;

declare global {
  interface HTMLElementTagNameMap {
    "create-notes-collection-action": CreateNotesCollectionActionElement;
  }
}
