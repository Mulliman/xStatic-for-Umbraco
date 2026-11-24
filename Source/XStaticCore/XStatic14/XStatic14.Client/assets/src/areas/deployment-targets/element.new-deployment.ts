import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { css, html, customElement } from '@umbraco-cms/backoffice/external/lit';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditDeploymentTargetModal } from './dialog.deployment-target';
import { DeploymentTargetCreatorModal } from './dialog.deployment-target-creator';
import { xStaticCardStyles } from '../../code/styles';

@customElement('xstatic-new-deployment-target-element')
class NewDeploymentTargetElement extends UmbLitElement {

    render() {
        return html`
            <uui-box data-test-id="new-deployment-target">
                <div slot="headline" class="headline">Create new Deployment Target</div>
                <div slot="header-actions">
                    <uui-button label="Create" color="positive" look="primary" @click=${this.#openCreateDialog}><uui-icon name="icon-add"></uui-icon></uui-button>
                </div>

                <div class="card-body">
                    <p>Deployment Targets are individual instances of a deployer, the piece of code that pushes the generated files to the correct location. Deployers require some configuration for locations, passwords, usernames etc. and these are set on a Deployment Target.</p>
                    <p>Once created, you can choose a Deployment Target for each site by selecting them in the sites dashboard.</p>
                    <div class="buttons">
                        <uui-button label="Manually Configure New Deployment Target" color="positive" look="primary" data-test-id="new-deployment-target-manual" @click=${this.#openCreateDialog}>
                            <uui-icon name="icon-brush"></uui-icon>Manually Configure New Deployment Target
                        </uui-button>
                    </div>
                </div>

                <div class="auto">
                    <div class="text">
                        You can also let xStatic create the remote service, and configure the Deployment Target with the required details.
                    </div>
                    <div class="buttons">
                        <uui-button label="Automatically Create New Deployment Target" color="warning" look="primary" data-test-id="new-deployment-target-auto" @click=${this.#openAutoCreateDialog}>
                            <uui-icon name="icon-wand"></uui-icon>Automatically Create New Deployment Target
                        </uui-button>
                    </div>
                </div>
            </uui-box>
        `;
    }

    async #openCreateDialog() {
        const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
        modalManager?.open(this, EditDeploymentTargetModal, {});
    }

    async #openAutoCreateDialog() {
        const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
        modalManager?.open(this, DeploymentTargetCreatorModal, {});
    }

    static styles = [
        xStaticCardStyles,
        css`
            .auto {
                position: relative;
                display: block;
                margin-top: var(--uui-size-space-5);
                padding: var(--uui-size-space-5);
                background: var(--uui-color-surface-alt);
                border-left: var(--uui-size-space-1) solid var(--uui-color-warning);
                border-radius: var(--uui-border-radius);
            }

            .auto .text {
                text-align: center;
                font-weight: bold;
            }
        `,
    ];
}

export default NewDeploymentTargetElement;

declare global {
    interface HTMLElementTagNameMap {
        'xstatic-new-deployment-target-element': NewDeploymentTargetElement
    }
}
