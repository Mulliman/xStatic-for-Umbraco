import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, customElement } from '@umbraco-cms/backoffice/external/lit';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditSiteModal } from './dialog.edit-site';
import { xStaticCardStyles } from '../../code/styles';

@customElement('xstatic-new-site-element')
class NewSiteElement extends UmbLitElement {

    async #openCreateDialog() {
        const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
        modalManager?.open(this, EditSiteModal, {});
    }

    render() {
        return html`
            <uui-box data-test-id="new-site">
                <div slot="headline" class="headline">Create new site</div>
                <div slot="header-actions">
                    <uui-button label="Create" color="positive" look="primary" @click=${this.#openCreateDialog}><uui-icon name="icon-add"></uui-icon></uui-button>
                </div>

                <div class="card-body">
                    <p>Before creating a site, make sure you have configured an export type as this is required. If you want to deploy the site, you will need to create a deployment target too.</p>
                    <p>You will then need to fill in the content and media that you want to include in your static site along with some other settings.</p>
                    <p>Once created you can build and deploy your static sites from this dashboard.</p>
                    <div class="buttons">
                        <uui-button label="Create new static site" color="positive" look="primary" data-test-id="new-site-create" @click=${this.#openCreateDialog}>
                            <uui-icon name="icon-brush"></uui-icon>Create new static site
                        </uui-button>
                    </div>
                </div>
            </uui-box>
        `;
    }

    static styles = [xStaticCardStyles];
}

export default NewSiteElement;

declare global {
    interface HTMLElementTagNameMap {
        'xstatic-new-site-element': NewSiteElement
    }
}
