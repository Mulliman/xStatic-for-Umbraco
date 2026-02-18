import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, html, customElement, css } from "@umbraco-cms/backoffice/external/lit";
import TimeWorkspaceContext from "./context.js";

@customElement('time-workspace-root')
export class TimeWorkspaceElement extends UmbElementMixin(LitElement) {
    #workspaceContext = new TimeWorkspaceContext(this);

    constructor() {
        super();

        this.#workspaceContext._host;
    }

    render() {
        return html`
            <umb-workspace-editor headline="Time" alias="time.workspace" .enforceNoFooter=${true}>
            </umb-workspace-editor>
        `;
    }

    static styles = css`
        uui-box {
            display: block;
            margin: 20px;
        }
    `;
}

export default TimeWorkspaceElement;


declare global {
    interface HTMLElementTagNameMap {
        'time-workspace-root': TimeWorkspaceElement
    }
}
