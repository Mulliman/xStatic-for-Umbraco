import { css, html, customElement } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";

@customElement("blueprint-workspace")
export class BlueprintWorkspaceElement extends UmbLitElement {
  override render() {
    return html`
        <umb-workspace-editor headline="Blueprint" alias="Blueprint.Workspace" .enforceNoFooter=${true}>
        </umb-workspace-editor>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      height: 100%;
    }
  `;
}

export default BlueprintWorkspaceElement;

declare global {
  interface HTMLElementTagNameMap {
    "blueprint-workspace": BlueprintWorkspaceElement;
  }
}
