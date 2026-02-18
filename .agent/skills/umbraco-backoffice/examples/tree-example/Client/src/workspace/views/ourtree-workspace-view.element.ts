import { OUR_TREE_WORKSPACE_CONTEXT } from "../ourtree-workspace.context-token.js";
import { css, html, customElement, state, nothing } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles } from "@umbraco-cms/backoffice/style";
import type { UmbWorkspaceViewElement } from "@umbraco-cms/backoffice/workspace";

@customElement("our-tree-workspace-view")
export class OurTreeWorkspaceViewElement extends UmbLitElement implements UmbWorkspaceViewElement {
  #workspaceContext?: typeof OUR_TREE_WORKSPACE_CONTEXT.TYPE;

  @state()
  private _name?: string;

  @state()
  private _unique?: string;

  @state()
  private _icon?: string;

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

    this.observe(this.#workspaceContext.unique, (unique) => {
      this._unique = unique;
    });

    this.observe(this.#workspaceContext.icon, (icon) => {
      this._icon = icon;
    });
  }

  override render() {
    if (!this._unique) return nothing;

    return html`
      <uui-box headline="Tree Item Details">
        <div class="property">
          <div class="property-label">Name</div>
          <div class="property-value">${this._name}</div>
        </div>
        <div class="property">
          <div class="property-label">ID</div>
          <div class="property-value"><code>${this._unique}</code></div>
        </div>
        <div class="property">
          <div class="property-label">Icon</div>
          <div class="property-value">
            <uui-icon name=${this._icon ?? "icon-bug"}></uui-icon>
            <span>${this._icon}</span>
          </div>
        </div>
      </uui-box>
    `;
  }

  static override styles = [
    UmbTextStyles,
    css`
      :host {
        display: block;
        padding: var(--uui-size-space-6);
      }

      .property {
        display: flex;
        padding: var(--uui-size-space-4) 0;
        border-bottom: 1px solid var(--uui-color-divider);
      }

      .property:last-child {
        border-bottom: none;
      }

      .property-label {
        flex: 0 0 150px;
        font-weight: 600;
        color: var(--uui-color-text-alt);
      }

      .property-value {
        flex: 1;
        display: flex;
        align-items: center;
        gap: var(--uui-size-space-2);
      }

      code {
        background: var(--uui-color-surface-alt);
        padding: var(--uui-size-space-1) var(--uui-size-space-2);
        border-radius: var(--uui-border-radius);
        font-family: monospace;
      }

      uui-icon {
        font-size: 1.2rem;
      }
    `,
  ];
}

export default OurTreeWorkspaceViewElement;

declare global {
  interface HTMLElementTagNameMap {
    "our-tree-workspace-view": OurTreeWorkspaceViewElement;
  }
}
