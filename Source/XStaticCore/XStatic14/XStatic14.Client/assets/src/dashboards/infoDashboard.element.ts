import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, html, css, customElement, property } from "@umbraco-cms/backoffice/external/lit";

import "../areas/docs/element.docsGrid";

@customElement('xstatic-docs-dashboard')
export class XStaticInfoDashboard extends UmbElementMixin(LitElement) {

    constructor() {
        super();
    }

    @property()
    title = 'Documentation'

    render() {
        return html`
            <umb-body-layout>
                <xstatic-docs-grid></xstatic-docs-grid>
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


export default XStaticInfoDashboard;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-docs-dashboard': XStaticInfoDashboard
    }
}