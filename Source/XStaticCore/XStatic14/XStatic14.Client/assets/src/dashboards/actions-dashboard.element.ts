import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, html, css, customElement, property } from "@umbraco-cms/backoffice/external/lit";

import "../areas/actions/element.action-grid";

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
                <xstatic-action-grid></xstatic-action-grid>
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