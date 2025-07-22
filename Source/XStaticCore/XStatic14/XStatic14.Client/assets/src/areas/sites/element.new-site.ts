import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditSiteModal } from './dialog.edit-site';

@customElement('xstatic-new-site-element')
class NewSiteElement extends UmbElementMixin(LitElement) {

    #openCreateDialog() {
        this.consumeContext(UMB_MODAL_MANAGER_CONTEXT, (manager) =>{
            manager?.open(this, EditSiteModal, {});
        } )
    }

    render() {

        return html`
            <uui-box>
                <div slot="headline" pristine="" style="font-size: 1.2rem; padding-top: 0.5rem;">Create new site</div>
                <div slot="header-actions" >
                    <uui-button pristine="" label="Create" color="positive" look="primary" @click=${this.#openCreateDialog}><uui-icon name="icon-add"></uui-icon></uui-button>
                </div>
                
                <div style="position:relative; display: block">
                    <div>
                        <p>Before creating a site, make sure you have configured an export type as this is required. If you want to deploy the site, you will need to create a deployment target too.</p>
                        <p>You will then need to fill in the content and media that you want to include in your static site along with some other settings.</p>
                        <p>Once created you can build and deploy your static sites from this dashboard.</p>
                    </div>
                    <div class="buttons">
                        <uui-button-group>
                            <uui-button label="Create new static site" color="positive" look="primary" icon="icon-brush" @click=${this.#openCreateDialog}></uui-button>
                        </uui-button-group>
                    </div>
                </div>
            </uui-box>
        `;
    }

    static styles = css`
        :host {
            display: block;
            position: relative;
            width: 100%;
        }

        :host .badge{
            display: block;
            position: relative;
            text-align: center;
            width: 100%;
        }

        .buttons {
            text-align: center;
            margin-top: 20px;
        }
    `;
}

export default NewSiteElement;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-new-site-element': NewSiteElement
    }
}