import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, html, css, customElement, property } from "@umbraco-cms/backoffice/external/lit";

@customElement('xstatic-actions-dashboard')
export class XStaticActionsDashboard extends UmbElementMixin(LitElement) {

    constructor() {
        super();
    }

    @property()
    title = 'Actions'

    render() {
        return html`
            <umb-body-layout>
                <div slot="header"></div>
                <uui-button color="" look="placeholder" pristine="">Main slot</uui-button>
                <div slot="footer-info"><uui-button color="" look="placeholder" pristine="">Footer slot</uui-button></div>
            </umb-body-layout>
        `
    }

    static styles = css`
        :host {
            display: block;
            padding: 20px;
        }
    `
}


export default XStaticActionsDashboard;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-actions-dashboard': XStaticActionsDashboard
    }
}