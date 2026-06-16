import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, css, customElement, html } from "@umbraco-cms/backoffice/external/lit";

@customElement('time-workspace2-view')
export class TimeWorkspace2ViewElement extends UmbElementMixin(LitElement) {
    render() {
        return html`
            <umb-body-layout header-transparent header-fit-height>
                <uui-box headline="Child Item 2 View">
                    <p>This is a separate workspace view for Child Item 2.</p>
                    <p>It demonstrates how different menu items can navigate to different workspaces.</p>

                    <uui-box headline="Features">
                        <ul>
                            <li>Separate workspace from Child Item 1</li>
                            <li>Independent views and context</li>
                            <li>Different entity type routing</li>
                        </ul>
                    </uui-box>
                </uui-box>
            </umb-body-layout>
        `;
    }

    static styles = css`
        p {
            margin: 1rem 0;
        }
        ul {
            margin: 0.5rem 0;
            padding-left: 1.5rem;
        }
        li {
            margin: 0.25rem 0;
        }
        uui-box {
            margin-top: 1rem;
        }
    `;
}

export default TimeWorkspace2ViewElement;

declare global {
    interface HTMLElementTagNameMap {
        'time-workspace2-view': TimeWorkspace2ViewElement;
    }
}
