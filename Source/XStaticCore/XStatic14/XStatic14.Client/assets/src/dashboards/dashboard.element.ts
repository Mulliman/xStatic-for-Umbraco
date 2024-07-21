import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, html, css, customElement, property } from "@umbraco-cms/backoffice/external/lit";

@customElement('xstatic14-dashboard')
export class XStatic14Dashboard extends UmbElementMixin(LitElement) {

    constructor() {
        super();
    }

    @property()
    title = 'XStatic14 dashboard'

    render() {
        return html`
            <uui-box headline="${this.title}">
                dashboard content goes here
            </uui-box>
        `
    }

    static styles = css`
        :host {
            display: block;
            padding: 20px;
        }
    `
}


export default XStatic14Dashboard;

declare global {
    interface HtmlElementTagNameMap {
        'XStatic14-dashboard': XStatic14Dashboard
    }
}