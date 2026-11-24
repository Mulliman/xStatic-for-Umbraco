import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, customElement, state } from '@umbraco-cms/backoffice/external/lit';
import { EXPORT_TYPE_CONTEXT_TOKEN } from './context.export-type';

import "./element.export-type";
import "./element.new-export-type";
import "../../elements/element.dashboard-grid";

import { ExportTypeModel } from '../../api';

@customElement('xstatic-export-type-grid')
class ExportTypeGrid extends UmbLitElement {

    @state()
    isLoaded = false;

    @state()
    exportTypes?: Array<ExportTypeModel>;

    constructor() {
        super();

        this.consumeContext(EXPORT_TYPE_CONTEXT_TOKEN, (context) => {
            this.observe(context?.config, (x) => {
                if (x?.exportTypes) {
                    this.exportTypes = x.exportTypes;
                    this.isLoaded = true;
                }
            }, '_observeConfig');
        });
    }

    render() {
        if (!this.exportTypes) {
            return this.isLoaded ? html`` : html`<uui-loader-bar></uui-loader-bar>`;
        }

        return html`
            <xstatic-dashboard-grid>
                <xstatic-new-export-type-element slot="info"></xstatic-new-export-type-element>
                <div slot="grid">
                    ${this.exportTypes.map((x) => html`<xstatic-export-type-element .exportType=${x}></xstatic-export-type-element>`)}
                </div>
            </xstatic-dashboard-grid>
        `;
    }
}

export default ExportTypeGrid;

declare global {
    interface HTMLElementTagNameMap {
        'xstatic-export-type-grid': ExportTypeGrid
    }
}
