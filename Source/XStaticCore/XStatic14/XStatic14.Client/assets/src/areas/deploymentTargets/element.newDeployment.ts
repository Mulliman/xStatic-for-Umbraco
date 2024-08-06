import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditDeploymentTargetModal } from './dialog.deploymentTarget';

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
                        <p>Deployment Targets are individual instances of a deployer, the piece of code that pushes the generated files to the correct location.</p>
                        <p>Deployers require some configuration for locations, passwords, usernames etc. and these are set on a Deployment Target.</p>
                        <p>Once created, you can choose a Deployment Target for each site by selecting them in the sites dashboard.</p>
                    </div>
                    <div class="buttons">
                        <uui-button-group>
                            <uui-button label="Create new Deployment Target" color="positive" look="primary" icon="icon-brush" @click=${this.#openCreateDialog}></uui-button>
                        </uui-button-group>
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
    `;
}

export default NewDeploymentTargetElement;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-new-deployment-target-element': NewDeploymentTargetElement
    }
}