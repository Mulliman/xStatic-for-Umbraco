import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, html, css, customElement, property } from "@umbraco-cms/backoffice/external/lit";

import "../areas/sites/element.siteGrid";

@customElement('xstatic-main-dashboard')
export class XStaticMainDashboard extends UmbElementMixin(LitElement) {

    constructor() {
        super();
    }

    @property()
    title = 'XStatic Sites'

    render() {
        return html`
            <umb-body-layout>
                <xstatic-site-grid></xstatic-site-grid>
            </umb-body-layout>
        `
    }

    static styles = css`
        :host {
        }
    `
}


export default XStaticMainDashboard;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-main-dashboard': XStaticMainDashboard
    }
}