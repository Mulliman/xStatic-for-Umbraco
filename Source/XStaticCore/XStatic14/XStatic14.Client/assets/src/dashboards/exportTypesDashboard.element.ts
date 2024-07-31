import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, html, css, customElement, property } from "@umbraco-cms/backoffice/external/lit";


import "../areas/exportTypes/element.exportTypeGrid";

@customElement('xstatic-export-types-dashboard')
export class XStaticExportTypesDashboard extends UmbElementMixin(LitElement) {


    constructor() {
        super();
    }

    @property()
    title = 'Export Types'

    render() {
        return html`
            <umb-body-layout>
                <xstatic-export-type-grid></xstatic-export-type-grid>
            </umb-body-layout>
        `
    }

    static styles = css`
        :host {
        }
    `
}


export default XStaticExportTypesDashboard;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-export-types-dashboard': XStaticExportTypesDashboard
    }
}