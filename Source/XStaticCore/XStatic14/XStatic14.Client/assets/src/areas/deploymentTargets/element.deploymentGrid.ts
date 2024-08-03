import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement, state } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import DeploymentTargetContext, { DEPLOYMENT_TARGET_CONTEXT_TOKEN } from './context.deploymentTargets';

import "./element.deploymentTarget";
import "./element.newDeployment";

import { ExportTypeModel } from '../../api';

@customElement('xstatic-deployment-target-grid')
class ActionGrid extends UmbElementMixin(LitElement) {

    @state()
    isLoaded = false;

    @state()
    deploymentTargets?: Array<ExportTypeModel>;

    #deploymentTargetContext?: DeploymentTargetContext;

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

    constructor() {
        super();

        this.consumeContext(
            DEPLOYMENT_TARGET_CONTEXT_TOKEN,
            (context) => {
              this.#deploymentTargetContext = context;

              this.#deploymentTargetContext!.getConfig().then(() => {
                this.isLoaded = true;
                });

                this.#deploymentTargetContext!.getDeploymentTargets().then(() => {
                    this.observe(this.#deploymentTargetContext?.deploymentTargets, (x) => {
                        this.deploymentTargets = x;
                    });
                });
            }
          );
    }

    #renderTypes() {
        if(!this.deploymentTargets) {
            return null;
        }

        return this.deploymentTargets.map(x => {
            return html`
                <xstatic-deployment-target-element .deploymentTarget=${x}></xstatic-deployment-target-element>
            `
        });
    }

    render() {
        if(!this.deploymentTargets) {
            return this.isLoaded ? html`` : html`Loading...`;
        }

        return html`
            <xstatic-new-deployment-target-element></xstatic-new-deployment-target-element>
            ${this.#renderTypes()}
        `;
    }
}

export default ActionGrid;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-deployment-target-grid': ActionGrid
    }
}