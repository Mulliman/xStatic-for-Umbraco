import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import ExportTypeContext, { EXPORT_TYPE_CONTEXT_TOKEN } from './context.exportType';

import "./element.exportType";
import "./element.newExportType";
import "../../elements/element.dashboardGrid";

import { ExportTypeModel } from '../../api';

@customElement('xstatic-export-type-grid')
class ExportTypeGrid extends UmbElementMixin(LitElement) {

    @state()
    isLoaded = false;

    @state()
    exportTypes?: Array<ExportTypeModel>;

    #exportTypeContext?: ExportTypeContext;

    constructor() {
        super();

        this.consumeContext(
            EXPORT_TYPE_CONTEXT_TOKEN,
            (context) => {
                this.#exportTypeContext = context;

                this.observe(this.#exportTypeContext?.config, (x) => {
                    if(x.exportTypes){
                        this.exportTypes = x.exportTypes;
                        this.isLoaded = true;
                    }
                });
            }
        )
    }

    render() {
        if (!this.exportTypes) {
            return this.isLoaded ? html`` : html`Loading...`;
        }

        return html`
            <xstatic-dashboard-grid>
                <xstatic-new-export-type-element slot="info"></xstatic-new-export-type-element>
                <div slot="grid">${this.#renderTypes()}</div>
            </xstatic-dashboard-grid>
        `;
    }

    #renderTypes() {
        if (!this.exportTypes) {
            return null;
        }

        return this.exportTypes.map(x => {
            return html`
                <xstatic-export-type-element .exportType=${x}></xstatic-export-type-element>
            `
        });
    }
}

export default ExportTypeGrid;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-export-type-grid': ExportTypeGrid
    }
}