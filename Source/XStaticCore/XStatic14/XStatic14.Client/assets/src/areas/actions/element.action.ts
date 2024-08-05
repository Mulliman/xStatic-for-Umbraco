import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, property, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';

import type {
    xStaticTableColumn,
    xStaticTableConfig,
    xStaticTableItem,
  } from "../../elements/element.siteTable";
import { ActionModel } from '../../api';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditActionModal } from './dialog.action';

import "../../elements/element.siteTable";
import ActionContext, { ACTION_CONTEXT_TOKEN } from './context.action';

@customElement('xstatic-action-element')
class ActionElement extends UmbElementMixin(LitElement) {

    @property({ type: Object, attribute: false })
    action?: ActionModel;

    @state()
    private _tableConfig: xStaticTableConfig = {
    };

    @state()
    private _tableColumns: Array<xStaticTableColumn> = [ { alias: "value", name: "Details" } ];
    
    #actionContext?: ActionContext;

    constructor() {
        super();

        this.consumeContext(
            ACTION_CONTEXT_TOKEN,
            (context) => {
              this.#actionContext = context;
            }
          );
    }

    //#region Render

    render() {
        if (!this.action) {
            return html``;
        }

        const action = this.action;

        return html`
            <uui-box>
                <div slot="headline" pristine="" style="font-size: 1.2rem; padding-top: 0.5rem;">${action.name}</div>
                <div slot="header-actions" >
                    <uui-button pristine="" label="Edit" color="warning" look="primary" @click=${() => this.#openCreateDialog()}><uui-icon name="icon-brush"></uui-icon></uui-button>
                    <uui-button pristine="" label="Delete" color="danger" look="primary" @click=${() => this.#delete()}><uui-icon name="icon-trash"></uui-icon></uui-button>
                </div>
                
                <div style="position:relative; display: block">
                    <div>
                        <xstatic-site-table .items=${this.getTable()} .config=${this._tableConfig} .columns=${this._tableColumns} ></xstatic-site-table>
                    </div>
                </div>
            </uui-box>
        `;
    }

    // #endregion Render

    // #region Handlers

    #openCreateDialog() {
        this.consumeContext(UMB_MODAL_MANAGER_CONTEXT, (manager) =>{
            manager.open(this, EditActionModal, { data: { content: this.action!, headline: `Edit ${this.action?.name} action` } });
        } )
    }

    async #delete() {
        await this.#actionContext?.deleteAction(this.action!.id);
    }

    // #endregion Handlers

    // #region Mappers

    addTableItem(array: Array<xStaticTableItem>, id: string, icon: string, alias: string, value: any) {
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

    getTable() : Array<xStaticTableItem> {
        let array : Array<xStaticTableItem> = [];

        this.addTableItem(array, "name", "icon-home", "value", this.action?.name);
        this.addTableItem(array, "type", "icon-brackets", "value", this.action?.type?.name);

        return array;
    }

    // #endregion Mappers
 
    static styles = css`
        :host {
            display: block;
            position: relative;
            width: 100%;
        }
    `;

}

export default ActionElement;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-action-element': ActionElement
    }
}