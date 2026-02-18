import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, html, customElement, css } from "@umbraco-cms/backoffice/external/lit";

@customElement('time-workspace2-root')
export class TimeWorkspace2Element extends UmbElementMixin(LitElement) {
    render() {
        return html`
            <umb-workspace-editor headline="Time Zone 2" alias="time.workspace2" .enforceNoFooter=${true}>
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

export default TimeWorkspace2Element;

declare global {
    interface HTMLElementTagNameMap {
        'time-workspace2-root': TimeWorkspace2Element;
    }
}
