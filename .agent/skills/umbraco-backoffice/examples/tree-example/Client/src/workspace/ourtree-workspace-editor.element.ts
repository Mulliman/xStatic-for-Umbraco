import { OUR_TREE_WORKSPACE_CONTEXT } from "./ourtree-workspace.context-token.js";
import { css, html, customElement, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";

@customElement("our-tree-workspace-editor")
export class OurTreeWorkspaceEditorElement extends UmbLitElement {
  #workspaceContext?: typeof OUR_TREE_WORKSPACE_CONTEXT.TYPE;

  @state()
  private _name?: string = "";

  @state()
  private _icon?: string = "icon-bug";

  constructor() {
    super();

    this.consumeContext(OUR_TREE_WORKSPACE_CONTEXT, (instance) => {
      this.#workspaceContext = instance;
      this.#observeData();
    });
  }

  #observeData() {
    if (!this.#workspaceContext) return;

    this.observe(this.#workspaceContext.name, (name) => {
      this._name = name;
    });

    this.observe(this.#workspaceContext.icon, (icon) => {
      this._icon = icon;
    });
  }

  override render() {
    return html`
      <umb-workspace-editor alias="Our.Tree.Workspace">
        <div id="header" slot="header">
          <uui-icon name=${this._icon ?? "icon-bug"}></uui-icon>
          <span>${this._name}</span>
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
    `,
  ];
}

export default OurTreeWorkspaceEditorElement;

declare global {
  interface HTMLElementTagNameMap {
    "our-tree-workspace-editor": OurTreeWorkspaceEditorElement;
  }
}
