/**
 * Folder Name Modal Element
 *
 * A simple dialog for creating or renaming a folder.
 * Reused by both Create Folder and Rename Folder actions.
 * Skills used: umbraco-modals, umbraco-umbraco-element
 */

import { html, css, customElement, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement } from "@umbraco-cms/backoffice/modal";
import type { FolderNameModalData, FolderNameModalValue } from "./rename-folder.modal-token.js";

@customElement("rename-folder-modal")
export class RenameFolderModalElement extends UmbModalBaseElement<
  FolderNameModalData,
  FolderNameModalValue
> {
  @state()
  private _name = "";

  override connectedCallback() {
    super.connectedCallback();
    this._name = this.data?.currentName ?? "";
  }

  #handleNameInput(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    this._name = target.value;
  }

  #handleSubmit() {
    if (!this._name.trim()) return;
    this.updateValue({ name: this._name.trim() });
    this.modalContext?.submit();
  }

  #handleCancel() {
    this.modalContext?.reject();
  }

  #handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      this.#handleSubmit();
    }
  }

  override render() {
    const headline = this.data?.headline ?? "Folder";
    const confirmLabel = this.data?.confirmLabel ?? "Save";

    return html`
      <umb-body-layout headline=${headline}>
        <div id="content">
          <uui-form-layout-item>
            <uui-label slot="label" for="name" required>Name</uui-label>
            <uui-input
              id="name"
              .value=${this._name}
              @input=${this.#handleNameInput}
              @keydown=${this.#handleKeyDown}
              placeholder="Enter folder name"
              required
            ></uui-input>
          </uui-form-layout-item>
        </div>
        <div slot="actions">
          <uui-button
            label="Cancel"
            @click=${this.#handleCancel}
          ></uui-button>
          <uui-button
            label=${confirmLabel}
            look="primary"
            color="positive"
            @click=${this.#handleSubmit}
            ?disabled=${!this._name.trim()}
          ></uui-button>
        </div>
      </umb-body-layout>
    `;
  }

  static override styles = css`
    #content {
      padding: var(--uui-size-layout-1);
    }

    uui-input {
      width: 100%;
    }
  `;
}

export default RenameFolderModalElement;

declare global {
  interface HTMLElementTagNameMap {
    "rename-folder-modal": RenameFolderModalElement;
  }
}
