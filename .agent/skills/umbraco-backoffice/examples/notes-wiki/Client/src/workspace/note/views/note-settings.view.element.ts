/**
 * Note Settings View Element
 *
 * Settings view for note metadata (tags, created/modified info).
 * This is a WorkspaceView that appears as a tab in the workspace.
 *
 * Skills used: umbraco-workspace (WorkspaceView), umbraco-umbraco-element
 */

import { NOTE_WORKSPACE_CONTEXT } from "../note-workspace.context-token.js";
import { css, html, customElement, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";

@customElement("notes-note-settings-view")
export class NoteSettingsViewElement extends UmbLitElement {
  #workspaceContext?: typeof NOTE_WORKSPACE_CONTEXT.TYPE;

  @state()
  private _tags: string[] = [];

  @state()
  private _newTag = "";

  @state()
  private _createdDate?: string;

  @state()
  private _modifiedDate?: string;

  @state()
  private _createdBy?: string;

  @state()
  private _modifiedBy?: string;

  constructor() {
    super();

    this.consumeContext(NOTE_WORKSPACE_CONTEXT, (instance) => {
      this.#workspaceContext = instance;
      this.#observeData();
    });
  }

  #observeData() {
    if (!this.#workspaceContext) return;

    this.observe(this.#workspaceContext.tags, (tags) => {
      this._tags = tags || [];
    });

    this.observe(this.#workspaceContext.createdDate, (date) => {
      this._createdDate = date;
    });

    this.observe(this.#workspaceContext.modifiedDate, (date) => {
      this._modifiedDate = date;
    });

    this.observe(this.#workspaceContext.createdBy, (user) => {
      this._createdBy = user;
    });

    this.observe(this.#workspaceContext.modifiedBy, (user) => {
      this._modifiedBy = user;
    });
  }

  #formatDate(dateString?: string): string {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  #handleNewTagInput(e: InputEvent) {
    const target = e.target as HTMLInputElement;
    this._newTag = target.value;
  }

  #handleAddTag() {
    if (this._newTag.trim()) {
      this.#workspaceContext?.addTag(this._newTag.trim());
      this._newTag = "";
    }
  }

  #handleRemoveTag(tag: string) {
    this.#workspaceContext?.removeTag(tag);
  }

  #handleKeyPress(e: KeyboardEvent) {
    if (e.key === "Enter") {
      this.#handleAddTag();
    }
  }

  override render() {
    return html`
      <uui-box headline="Tags">
        <div class="tags-section">
          <div class="tag-input">
            <uui-input
              placeholder="Add a tag..."
              .value=${this._newTag}
              @input=${this.#handleNewTagInput}
              @keypress=${this.#handleKeyPress}
            ></uui-input>
            <uui-button
              look="primary"
              @click=${this.#handleAddTag}
              label="Add Tag"
              .disabled=${!this._newTag.trim()}
            >
              Add
            </uui-button>
          </div>

          <div class="tags-list">
            ${this._tags.length > 0
              ? this._tags.map(
                  (tag) => html`
                    <span class="tag">
                      ${tag}
                      <button
                        class="tag-remove"
                        @click=${() => this.#handleRemoveTag(tag)}
                        aria-label="Remove tag"
                      >
                        <uui-icon name="icon-wrong"></uui-icon>
                      </button>
                    </span>
                  `
                )
              : html`<p class="no-tags">No tags yet. Add some tags to organize your notes.</p>`}
          </div>
        </div>
      </uui-box>

      <uui-box headline="Information" class="info-box">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Created</span>
            <span class="info-value">${this.#formatDate(this._createdDate)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Modified</span>
            <span class="info-value">${this.#formatDate(this._modifiedDate)}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Created by</span>
            <span class="info-value">${this._createdBy || "-"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Modified by</span>
            <span class="info-value">${this._modifiedBy || "-"}</span>
          </div>
        </div>
      </uui-box>
    `;
  }

  static override readonly styles = [
    css`
      :host {
        display: block;
        padding: var(--uui-size-layout-1);
      }

      uui-box {
        margin-bottom: var(--uui-size-space-5);
      }

      .tags-section {
        display: flex;
        flex-direction: column;
        gap: var(--uui-size-space-4);
      }

      .tag-input {
        display: flex;
        gap: var(--uui-size-space-3);
      }

      .tag-input uui-input {
        flex: 1;
        max-width: 300px;
      }

      .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--uui-size-space-2);
      }

      .tag {
        display: inline-flex;
        align-items: center;
        gap: var(--uui-size-space-2);
        padding: var(--uui-size-space-1) var(--uui-size-space-3);
        background: var(--uui-color-surface-alt);
        border: 1px solid var(--uui-color-border);
        border-radius: var(--uui-border-radius);
        font-size: var(--uui-type-small-size);
        color: var(--uui-color-text);
      }

      .tag-remove {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        background: none;
        cursor: pointer;
        color: var(--uui-color-text-alt);
        transition: color 0.1s ease;
      }

      .tag-remove:hover {
        color: var(--uui-color-danger);
      }

      .tag-remove uui-icon {
        font-size: 12px;
      }

      .no-tags {
        color: var(--uui-color-text-alt);
        font-style: italic;
        margin: 0;
      }

      .info-box {
        margin-top: var(--uui-size-space-5);
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--uui-size-space-4);
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: var(--uui-size-space-1);
      }

      .info-label {
        font-size: var(--uui-type-small-size);
        color: var(--uui-color-text-alt);
        text-transform: uppercase;
      }

      .info-value {
        color: var(--uui-color-text);
      }
    `,
  ];
}

export default NoteSettingsViewElement;

declare global {
  interface HTMLElementTagNameMap {
    "notes-note-settings-view": NoteSettingsViewElement;
  }
}
