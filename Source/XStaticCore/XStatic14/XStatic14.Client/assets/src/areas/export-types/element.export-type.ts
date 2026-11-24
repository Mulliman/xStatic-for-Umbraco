import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, customElement, property } from '@umbraco-cms/backoffice/external/lit';
import type { xStaticTableItem } from "../../elements/element.site-table";
import { ExportTypeModel } from '../../api';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditExportTypeModal } from './dialog.edit-export-type';
import { DETAILS_COLUMNS, toDetailItems } from '../../code/table-items';
import { xStaticCardStyles } from '../../code/styles';

import "../../elements/element.site-table";
import ExportTypeContext, { EXPORT_TYPE_CONTEXT_TOKEN } from './context.export-type';

@customElement('xstatic-export-type-element')
class ExportTypeElement extends UmbLitElement {

    @property({ type: Object, attribute: false })
    exportType?: ExportTypeModel;

    #exportTypeContext?: ExportTypeContext;

    constructor() {
        super();

        this.consumeContext(EXPORT_TYPE_CONTEXT_TOKEN, (context) => {
            this.#exportTypeContext = context;
        });
    }

    render() {
        if (!this.exportType) {
            return html``;
        }

        return html`
            <uui-box data-test-id="export-type-${this.exportType.id}">
                <div slot="headline" class="headline">${this.exportType.name}</div>
                <div slot="header-actions">
                    <uui-button label="Edit" color="warning" look="primary" data-test-id="export-type-edit" @click=${this.#openEditDialog}><uui-icon name="icon-brush"></uui-icon></uui-button>
                    <uui-button label="Delete" color="danger" look="primary" data-test-id="export-type-delete" @click=${this.#delete}><uui-icon name="icon-trash"></uui-icon></uui-button>
                </div>

                <div class="card-body">
                    <xstatic-site-table .items=${this.#getTable()} .columns=${DETAILS_COLUMNS}></xstatic-site-table>
                </div>
            </uui-box>
        `;
    }

    async #openEditDialog() {
        if (!this.exportType) return;

        const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
        modalManager?.open(this, EditExportTypeModal, {
            data: { content: this.exportType, headline: `Edit ${this.exportType.name} export type` },
        });
    }

    async #delete() {
        if (!this.exportType) return;

        await this.#exportTypeContext?.deleteExportType(this.exportType.id);
    }

    #getTable() : Array<xStaticTableItem> {
        return toDetailItems([
            { id: "name", icon: "icon-home", value: this.exportType?.name },
            { id: "transformerFactory", icon: "icon-brackets", value: this.exportType?.transformerFactory?.name },
            { id: "generator", icon: "icon-settings", value: this.exportType?.generator?.name },
            { id: "fileNameGenerator", icon: "icon-document", value: this.exportType?.fileNameGenerator?.name },
        ]);
    }

    static styles = [xStaticCardStyles];
}

export default ExportTypeElement;

declare global {
    interface HTMLElementTagNameMap {
        'xstatic-export-type-element': ExportTypeElement
    }
}
