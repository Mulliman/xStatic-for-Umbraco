import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import DeploymentTargetContext, { DEPLOYMENT_TARGET_CONTEXT_TOKEN } from './context.deployment-targets';

import "./element.deployment-target";
import "./element.new-deployment";
import "../../elements/element.dashboard-grid";

import { ExportTypeModel } from '../../api';

@customElement('xstatic-deployment-target-grid')
class ActionGrid extends UmbElementMixin(LitElement) {

    @state()
    isLoaded = false;

    @state()
    deploymentTargets?: Array<ExportTypeModel>;

    #deploymentTargetContext?: DeploymentTargetContext;

    constructor() {
        super();

        this.consumeContext(
            DEPLOYMENT_TARGET_CONTEXT_TOKEN,
            (context) => {
                this.#deploymentTargetContext = context;

                this.observe(this.#deploymentTargetContext?.deploymentTargets, (x) => {
                    this.deploymentTargets = x;
                    this.isLoaded = true;
                });
            }
        );
    }

    render() {
        if (!this.deploymentTargets) {
            return this.isLoaded ? html`` : html`Loading...`;
        }

        return html`
            <xstatic-dashboard-grid>
                <xstatic-new-deployment-target-element slot="info"></xstatic-new-deployment-target-element>
                <div slot="grid">${this.#renderTypes()}</div>
            </xstatic-dashboard-grid>
        `;
    }

    #renderTypes() {
        if (!this.deploymentTargets) {
            return null;
        }

        return this.deploymentTargets.map(x => {
            return html`
                <xstatic-deployment-target-element .deploymentTarget=${x}></xstatic-deployment-target-element>
            `
        });
    }
}

export default ActionGrid;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-deployment-target-grid': ActionGrid
    }
}