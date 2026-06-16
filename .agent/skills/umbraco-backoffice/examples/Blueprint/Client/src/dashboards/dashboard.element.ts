import {
  LitElement,
  css,
  html,
  customElement,
  state,
} from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";

@customElement("blueprint-dashboard")
export class BlueprintDashboardElement extends UmbElementMixin(LitElement) {
  @state()
  private _counter = 0;

  #incrementCounter = () => {
    this._counter++;
  };

  render() {
    return html`
      <uui-box headline="Welcome to Blueprint">
        <p>
          This dashboard appears when you navigate to the Blueprint section
          without selecting an item from the menu.
        </p>

        <h3>Interactive Example</h3>
        <p>Button clicked: <strong>${this._counter}</strong> times</p>
        <uui-button
          color="positive"
          look="primary"
          @click="${this.#incrementCounter}"
        >
          Click me!
        </uui-button>
      </uui-box>
    `;
  }

  static styles = [
    css`
      :host {
        display: block;
        padding: var(--uui-size-layout-1);
      }

      uui-box {
        max-width: 800px;
      }

      h3 {
        margin-top: var(--uui-size-space-5);
      }

      p {
        line-height: 1.6;
      }
    `,
  ];
}

export default BlueprintDashboardElement;

declare global {
  interface HTMLElementTagNameMap {
    "blueprint-dashboard": BlueprintDashboardElement;
  }
}
