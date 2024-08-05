import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import ExportTypeContext, { EXPORT_TYPE_CONTEXT_TOKEN } from './context.exportType';

import "./element.exportType";
import "./element.newExportType";

import { ExportTypeModel } from '../../api';

@customElement('xstatic-export-type-grid')
class ExportTypeGrid extends UmbElementMixin(LitElement) {

    @state()
    isLoaded = false;

    @state()
    exportTypes?: Array<ExportTypeModel>;

    #exportTypeContext?: ExportTypeContext;

    #inited: Promise<ExportTypeContext>;

    constructor() {
        super();

        this.#inited = this.consumeContext(
            EXPORT_TYPE_CONTEXT_TOKEN,
            (context) => {
              this.#exportTypeContext = context;
            }
          ).asPromise();
    }

    async connectedCallback() {
        super.connectedCallback();

        setTimeout(async () => {

            console.log('ExportTypeGrid connectedCallback', this.#exportTypeContext);

            var context = await this.#inited;

            console.log('ExportTypeGrid inited', this.#exportTypeContext);

            await context.getConfig();

            this.observe(context?.exportTypes, (x) => {
                this.exportTypes = x;
            });

            this.isLoaded = true; 
        }, 1000);
    }

    #renderTypes() {
        if(!this.exportTypes) {
            return null;
        }

        return this.exportTypes.map(x => {
            return html`
                <xstatic-export-type-element .exportType=${x}></xstatic-export-type-element>
            `
        });
    }

    render() {
        if(!this.exportTypes) {
            return this.isLoaded ? html`` : html`Loading...`;
        }

        return html`
            <xstatic-new-export-type-element></xstatic-new-export-type-element>
            ${this.#renderTypes()}
        `;
    }

    static styles = css`
        :host {
            position: relative;
            display: grid;
            grid-gap: 20px;
            grid-template-columns: repeat(auto-fill,minmax(400px,1fr));
            grid-auto-rows: 1fr
        }

        :host > div{
            display: block;
            position: relative;
        }
    `;
}

export default ExportTypeGrid;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-export-type-grid': ExportTypeGrid
    }
}