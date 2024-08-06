import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, property, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';

import type {
    xStaticTableItem,
} from "../../elements/element.siteTable";

import { DeploymentTargetModel } from '../../api';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditDeploymentTargetModal } from './dialog.deploymentTarget';

import "../../elements/element.siteTable";
import DeploymentTargetContext, { DEPLOYMENT_TARGET_CONTEXT_TOKEN } from './context.deploymentTargets';

@customElement('xstatic-deployment-target-element')
class DeploymentTargetElement extends UmbElementMixin(LitElement) {

    @property({ type: Object, attribute: false })
    deploymentTarget?: DeploymentTargetModel;

    #deploymentTargetContext?: DeploymentTargetContext;

    constructor() {
        super();

        this.consumeContext(
            DEPLOYMENT_TARGET_CONTEXT_TOKEN,
            (context) => {
                this.#deploymentTargetContext = context;
            }
        );
    }

    //#region Render

    render() {
        if (!this.deploymentTarget) {
            return html``;
        }

        const deploymentTarget = this.deploymentTarget;

        return html`
            <uui-box>
                <div slot="headline" pristine="" style="font-size: 1.2rem; padding-top: 0.5rem;">${deploymentTarget.name}</div>
                <div slot="header-actions" >
                    <uui-button pristine="" label="Edit" color="warning" look="primary" @click=${() => this.#openCreateDialog()}><uui-icon name="icon-brush"></uui-icon></uui-button>
                    <uui-button pristine="" label="Delete" color="danger" look="primary" @click=${() => this.#delete()}><uui-icon name="icon-trash"></uui-icon></uui-button>
                </div>
                
                <div style="position:relative; display: block">
                    <div>
                        <xstatic-site-table .items=${this.getTable()} .config=${{}} .columns=${[{ alias: "value", name: "Details" }]} ></xstatic-site-table>
                    </div>
                </div>
            </uui-box>
        `;
    }

    // #endregion Render

    // #region Handlers

    #openCreateDialog() {
        this.consumeContext(UMB_MODAL_MANAGER_CONTEXT, (manager) => {
            manager.open(this, EditDeploymentTargetModal, { data: { content: this.deploymentTarget!, headline: `Edit ${this.deploymentTarget?.name} target` } });
        })
    }

    async #delete() {
        await this.#deploymentTargetContext?.deleteDeploymentTarget(this.deploymentTarget!.id);
    }

    // #endregion Handlers

    // #region Mappers

    addTableItem(array: Array<xStaticTableItem>, id: string, icon: string, alias: string, value: any) {
        if (!id || !alias || !value) {
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

    getTable(): Array<xStaticTableItem> {
        let array: Array<xStaticTableItem> = [];

        this.addTableItem(array, "name", "icon-home", "value", this.deploymentTarget?.name);
        this.addTableItem(array, "type", "icon-brackets", "value", this.deploymentTarget?.deployerDefinition);

        return array;
    }

    // #endregion Mappers

    // #region Styles

    static styles = css`
        :host {
            display: block;
            position: relative;
            width: 100%;
        }
    `;

    // #endregion Styles
}

export default DeploymentTargetElement;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-deployment-target-element': DeploymentTargetElement
    }
}