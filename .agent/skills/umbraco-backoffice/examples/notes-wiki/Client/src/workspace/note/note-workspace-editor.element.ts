/**
 * Note Workspace Editor Element
 *
 * The main editor component for the Note workspace.
 * Contains the workspace chrome (header, footer) and renders workspace views.
 *
 * Skills used: umbraco-workspace, umbraco-umbraco-element, umbraco-context-api
 */

import { NOTE_WORKSPACE_CONTEXT } from "./note-workspace.context-token.js";
import { css, html, customElement, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { NOTES_NOTE_WORKSPACE_ALIAS } from "../constants.js";

@customElement("notes-note-workspace-editor")
export class NoteWorkspaceEditorElement extends UmbLitElement {
  #workspaceContext?: typeof NOTE_WORKSPACE_CONTEXT.TYPE;

  @state()
  private _title = "";

  @state()
  private _icon = "icon-notepad";

  @state()
  private _isNew = false;

  constructor() {
    super();

    this.consumeContext(NOTE_WORKSPACE_CONTEXT, (instance) => {
      this.#workspaceContext = instance;
      this.#observeData();
    });
  }

  #observeData() {
    if (!this.#workspaceContext) return;

    this.observe(this.#workspaceContext.title, (title) => {
      this._title = title || "";
    });

    this.observe(this.#workspaceContext.icon, (icon) => {
      this._icon = icon || "icon-notepad";
    });

    this.observe(this.#workspaceContext.isNew, (isNew) => {
      this._isNew = isNew ?? false;
    });
  }

  override render() {
    const displayTitle = this._title || (this._isNew ? "New Note" : "Note");

    return html`
      <umb-workspace-editor alias=${NOTES_NOTE_WORKSPACE_ALIAS}>
        <div id="header" slot="header">
          <uui-icon name=${this._icon}></uui-icon>
          <span class="title">${displayTitle}</span>
          ${this._isNew ? html`<uui-tag color="positive">New</uui-tag>` : ""}
        </div>
      </umb-workspace-editor>
    `;
  }

  static override readonly styles = [
    css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      #header {
        display: flex;
        align-items: center;
        gap: var(--uui-size-space-3);
        font-size: 1.2rem;
        font-weight: bold;
      }

      uui-icon {
        font-size: 1.5rem;
      }

      .title {
        flex: 1;
      }
    `,
  ];
}

export default NoteWorkspaceEditorElement;

declare global {
  interface HTMLElementTagNameMap {
    "notes-note-workspace-editor": NoteWorkspaceEditorElement;
  }
}
