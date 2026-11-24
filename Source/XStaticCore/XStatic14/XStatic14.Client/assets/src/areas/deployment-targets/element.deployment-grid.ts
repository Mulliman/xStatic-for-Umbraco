import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, customElement, state } from '@umbraco-cms/backoffice/external/lit';
import { DEPLOYMENT_TARGET_CONTEXT_TOKEN } from './context.deployment-targets';

import "./element.deployment-target";
import "./element.new-deployment";
import "../../elements/element.dashboard-grid";

import { DeploymentTargetModel } from '../../api';

@customElement('xstatic-deployment-target-grid')
class DeploymentTargetGrid extends UmbLitElement {

    @state()
    isLoaded = false;

    @state()
    deploymentTargets?: Array<DeploymentTargetModel>;

    constructor() {
        super();

        this.consumeContext(DEPLOYMENT_TARGET_CONTEXT_TOKEN, (context) => {
            this.observe(context?.deploymentTargets, (x) => {
                this.deploymentTargets = x;
                this.isLoaded = true;
            }, '_observeDeploymentTargets');
        });
    }

    render() {
        if (!this.deploymentTargets) {
            return this.isLoaded ? html`` : html`<uui-loader-bar></uui-loader-bar>`;
        }

        return html`
            <xstatic-dashboard-grid>
                <xstatic-new-deployment-target-element slot="info"></xstatic-new-deployment-target-element>
                <div slot="grid">
                    ${this.deploymentTargets.map((x) => html`<xstatic-deployment-target-element .deploymentTarget=${x}></xstatic-deployment-target-element>`)}
                </div>
            </xstatic-dashboard-grid>
        `;
    }
}

export default DeploymentTargetGrid;

declare global {
    interface HTMLElementTagNameMap {
        'xstatic-deployment-target-grid': DeploymentTargetGrid
    }
}
