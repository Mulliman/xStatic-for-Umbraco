import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, html, css, customElement, property } from "@umbraco-cms/backoffice/external/lit";

@customElement('xstatic-config-dashboard')
export class XStaticConfigDashboard extends UmbElementMixin(LitElement) {

    constructor() {
        super();
    }

    @property()
    title = 'Config'

    render() {
        return html`
            <umb-body-layout>
                <div slot="header"></div>
                <uui-button color="" look="placeholder" pristine="">Main slot</uui-button>
                <div slot="footer-info"><uui-button color="" look="placeholder" pristine="">Footer slot</uui-button></div>
            </umb-body-layout>
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


export default XStaticConfigDashboard;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-config-dashboard': XStaticConfigDashboard
    }
}