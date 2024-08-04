import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, html, css, customElement, property } from "@umbraco-cms/backoffice/external/lit";

import "../areas/config/element.configGrid";

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
                <xstatic-config-grid></xstatic-config-grid>
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


export default XStaticConfigDashboard;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-config-dashboard': XStaticConfigDashboard
    }
}