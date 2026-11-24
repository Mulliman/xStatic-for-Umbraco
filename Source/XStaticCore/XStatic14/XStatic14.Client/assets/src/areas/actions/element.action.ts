import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, customElement, property } from '@umbraco-cms/backoffice/external/lit';
import type { xStaticTableItem } from "../../elements/element.site-table";
import { ActionModel } from '../../api';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditActionModal } from './dialog.action';
import { DETAILS_COLUMNS, toDetailItems } from '../../code/table-items';
import { xStaticCardStyles } from '../../code/styles';

import "../../elements/element.site-table";
import ActionContext, { ACTION_CONTEXT_TOKEN } from './context.action';

@customElement('xstatic-action-element')
class ActionElement extends UmbLitElement {

    @property({ type: Object, attribute: false })
    action?: ActionModel;

    #actionContext?: ActionContext;

    constructor() {
        super();

        this.consumeContext(ACTION_CONTEXT_TOKEN, (context) => {
            this.#actionContext = context;
        });
    }

    render() {
        if (!this.action) {
            return html``;
        }

        return html`
            <uui-box data-test-id="action-${this.action.id}">
                <div slot="headline" class="headline">${this.action.name}</div>
                <div slot="header-actions">
                    <uui-button label="Edit" color="warning" look="primary" data-test-id="action-edit" @click=${this.#openEditDialog}><uui-icon name="icon-brush"></uui-icon></uui-button>
                    <uui-button label="Delete" color="danger" look="primary" data-test-id="action-delete" @click=${this.#delete}><uui-icon name="icon-trash"></uui-icon></uui-button>
                </div>

                <div class="card-body">
                    <xstatic-site-table .items=${this.getTable()} .columns=${DETAILS_COLUMNS}></xstatic-site-table>
                </div>
            </uui-box>
        `;
    }

    async #openEditDialog() {
        if (!this.action) return;

        const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
        modalManager?.open(this, EditActionModal, { data: { content: this.action, headline: `Edit ${this.action.name} action` } });
    }

    async #delete() {
        if (!this.action) return;

        await this.#actionContext?.deleteAction(this.action.id);
    }

    getTable() : Array<xStaticTableItem> {
        return toDetailItems([
            { id: "name", icon: "icon-home", value: this.action?.name },
            { id: "type", icon: "icon-brackets", value: this.action?.type?.name },
        ]);
    }

    static styles = [xStaticCardStyles];
}

export default ActionElement;

declare global {
    interface HTMLElementTagNameMap {
        'xstatic-action-element': ActionElement
    }
}
