import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditDeploymentTargetModal } from './dialog.deployment-target';
import { DeploymentTargetCreatorModal } from './dialog.deployment-target-creator';

@customElement('xstatic-new-deployment-target-element')
class NewDeploymentTargetElement extends UmbElementMixin(LitElement) {

    render() {

        return html`
            <uui-box>
                <div slot="headline" pristine="" style="font-size: 1.2rem; padding-top: 0.5rem;">Create new Deployment Target</div>
                <div slot="header-actions" >
                    <uui-button pristine="" label="Create" color="positive" look="primary" @click=${this.#openCreateDialog}><uui-icon name="icon-add"></uui-icon></uui-button>
                </div>
                
                <div style="position:relative; display: block">
                    <div>
                        <p>Deployment Targets are individual instances of a deployer, the piece of code that pushes the generated files to the correct location. Deployers require some configuration for locations, passwords, usernames etc. and these are set on a Deployment Target.</p>
                        <p>Once created, you can choose a Deployment Target for each site by selecting them in the sites dashboard.</p>
                    </div>
                    <div class="buttons">
                        <uui-button label="Manually Configure New Deployment Target" color="positive" look="primary" icon="icon-brush" @click=${this.#openCreateDialog}></uui-button>
                    </div>
                </div>

                <div class="auto">
                    <div class="text">
                        You can also let xStatic create the remote service, and configure the Deployment Target with the required details.
                    </div>
                    <div class="buttons">
                        <uui-button label="Automatically Create New Deployment Target" color="warning" look="primary" icon="icon-brush" @click=${this.#openAutoCreateDialog}></uui-button>
                    </div>
                </div>
            </uui-box>
        `;
    }

    #openCreateDialog() {
        this.consumeContext(UMB_MODAL_MANAGER_CONTEXT, (manager) =>{
            manager.open(this, EditDeploymentTargetModal, {});
        } )
    }

    #openAutoCreateDialog() {
        this.consumeContext(UMB_MODAL_MANAGER_CONTEXT, (manager) =>{
            manager.open(this, DeploymentTargetCreatorModal, {});
        } )
    }

    static styles = css`
        :host {
            display: block;
            position: relative;
            width: 100%;
        }

        .buttons {
            text-align: center;
            margin-top: 20px;
        }

        .auto{
            position:relative;
             display: block;
              background: #fff4ce;
               padding: 20px;
                margin-top: 20px;
        }

        .auto .text{
            text-align: center;
            font-weight: bold;
        }
    `;
}

export default NewDeploymentTargetElement;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-new-deployment-target-element': NewDeploymentTargetElement
    }
}