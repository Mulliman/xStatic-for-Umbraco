import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, customElement, property } from '@umbraco-cms/backoffice/external/lit';
import type { xStaticTableItem } from "../../elements/element.site-table";
import { DeploymentTargetModel } from '../../api';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditDeploymentTargetModal } from './dialog.deployment-target';
import { DETAILS_COLUMNS, toDetailItems } from '../../code/table-items';
import { xStaticCardStyles } from '../../code/styles';

import "../../elements/element.site-table";
import DeploymentTargetContext, { DEPLOYMENT_TARGET_CONTEXT_TOKEN } from './context.deployment-targets';

@customElement('xstatic-deployment-target-element')
class DeploymentTargetElement extends UmbLitElement {

    @property({ type: Object, attribute: false })
    deploymentTarget?: DeploymentTargetModel;

    #deploymentTargetContext?: DeploymentTargetContext;

    constructor() {
        super();

        this.consumeContext(DEPLOYMENT_TARGET_CONTEXT_TOKEN, (context) => {
            this.#deploymentTargetContext = context;
        });
    }

    render() {
        if (!this.deploymentTarget) {
            return html``;
        }

        return html`
            <uui-box data-test-id="deployment-target-${this.deploymentTarget.id}">
                <div slot="headline" class="headline">${this.deploymentTarget.name}</div>
                <div slot="header-actions">
                    <uui-button label="Edit" color="warning" look="primary" data-test-id="deployment-target-edit" @click=${this.#openEditDialog}><uui-icon name="icon-brush"></uui-icon></uui-button>
                    <uui-button label="Delete" color="danger" look="primary" data-test-id="deployment-target-delete" @click=${this.#delete}><uui-icon name="icon-trash"></uui-icon></uui-button>
                </div>

                <div class="card-body">
                    <xstatic-site-table .items=${this.getTable()} .columns=${DETAILS_COLUMNS}></xstatic-site-table>
                </div>
            </uui-box>
        `;
    }

    async #openEditDialog() {
        if (!this.deploymentTarget) return;

        const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
        modalManager?.open(this, EditDeploymentTargetModal, {
            data: { content: this.deploymentTarget, headline: `Edit ${this.deploymentTarget.name} target` },
        });
    }

    async #delete() {
        if (!this.deploymentTarget) return;

        await this.#deploymentTargetContext?.deleteDeploymentTarget(this.deploymentTarget.id);
    }

    getTable(): Array<xStaticTableItem> {
        return toDetailItems([
            { id: "name", icon: "icon-home", value: this.deploymentTarget?.name },
            { id: "type", icon: "icon-brackets", value: this.deploymentTarget?.deployerDefinition },
        ]);
    }

    static styles = [xStaticCardStyles];
}

export default DeploymentTargetElement;

declare global {
    interface HTMLElementTagNameMap {
        'xstatic-deployment-target-element': DeploymentTargetElement
    }
}
