import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, property, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';

import type {
    xStaticTableColumn,
    xStaticTableConfig,
    xStaticTableItem,
  } from "../../elements/element.site-table";
import { ExportTypeModel } from '../../api';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditExportTypeModal } from './dialog.edit-export-type';

import "../../elements/element.site-table";
import ExportTypeContext, { EXPORT_TYPE_CONTEXT_TOKEN } from './context.export-type';

@customElement('xstatic-export-type-element')
class ExportTypeElement extends UmbElementMixin(LitElement) {

    @property({ type: Object, attribute: false })
    exportType?: ExportTypeModel;

    @state()
    private _tableConfig: xStaticTableConfig = {
    };

    @state()
    private _tableColumns: Array<xStaticTableColumn> = [ { alias: "value", name: "Details" } ];
    
    #exportTypeContext?: ExportTypeContext;

    constructor() {
        super();

        this.consumeContext(
            EXPORT_TYPE_CONTEXT_TOKEN,
            (context) => {
              this.#exportTypeContext = context;
            }
          );
    }

    render() {
        if (!this.exportType) {
            return html``;
        }

        const exportType = this.exportType;

        return html`
            <uui-box>
                <div slot="headline" pristine="" style="font-size: 1.2rem; padding-top: 0.5rem;">${exportType.name}</div>
                <div slot="header-actions" >
                    <uui-button pristine="" label="Edit" color="warning" look="primary" @click=${() => this.#openCreateDialog()}><uui-icon name="icon-brush"></uui-icon></uui-button>
                    <uui-button pristine="" label="Delete" color="danger" look="primary" @click=${() => this.#delete()}><uui-icon name="icon-trash"></uui-icon></uui-button>
                </div>
                
                <div style="position:relative; display: block">
                    <div>
                        
                    </div>
                    <div>
                        <xstatic-site-table .items=${this.#getTable()} .config=${this._tableConfig} .columns=${this._tableColumns} ></xstatic-site-table>
                    </div>
                </div>
            </uui-box>
        `;
    }

    #openCreateDialog() {
        this.consumeContext(UMB_MODAL_MANAGER_CONTEXT, (manager) =>{
            manager?.open(this, EditExportTypeModal, { data: { content: this.exportType!, headline: `Edit ${this.exportType?.name} site` } });
        } )
    }

    async #delete() {
        await this.#exportTypeContext!.deleteExportType(this.exportType!.id);
    }

    #addTableItem(array: Array<xStaticTableItem>, id: string, icon: string, alias: string, value: any) {
        if(!id || !alias || !value) {
            return;
        }

        const item = {
            id: id,
            icon: icon,
            data: [
            {
                columnAlias: alias,
                value: value
            }]
        };

        array.push(item);
    }

    #getTable() : Array<xStaticTableItem> {
        let array : Array<xStaticTableItem> = [];

        this.#addTableItem(array, "name", "icon-home", "value", this.exportType?.name);
        this.#addTableItem(array, "transformerFactory", "icon-brackets", "value", this.exportType?.transformerFactory?.name);
        this.#addTableItem(array, "generator", "icon-settings", "value", this.exportType?.generator?.name);
        this.#addTableItem(array, "fileNameGenerator", "icon-document", "value", this.exportType?.fileNameGenerator?.name);

        return array;
    }

    static styles = css`
        :host {
            display: block;
            position: relative;
            width: 100%;
        }
    `;
}

export default ExportTypeElement;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-export-type-element': ExportTypeElement
    }
}