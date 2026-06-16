import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { html, LitElement, customElement, css, state } from '@umbraco-cms/backoffice/external/lit'
import { UMB_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/workspace";

@customElement('time-document-workspace-view')
export class TimeDocumentWorkspaceElement extends UmbElementMixin(LitElement) {

    @state()
    pageName?: string = '';

    constructor() {
        super();

        this.consumeContext(UMB_WORKSPACE_CONTEXT, (nodeContext) => {
            if (!nodeContext) return;
            // Cast to any to access getName if available
            const context = nodeContext as { getName?: () => string | undefined };
            if (context.getName) {
                this.pageName = context.getName() ?? '';
                console.log(this.pageName);
            }
        });
    }

    render() {
        return html`

            <uui-box headline="A content app?">
                <h2>Page Name: ${this.pageName}</h2>
            </uui-box>

        `;
    }

    static styles = css`
        uui-box {
            margin: 20px;
        }
    `
}

export default TimeDocumentWorkspaceElement;
