import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditExportTypeModal } from './dialog.edit-export-type';

@customElement('xstatic-new-export-type-element')
class NewSiteElement extends UmbElementMixin(LitElement) {

    #openCreateDialog() {
        this.consumeContext(UMB_MODAL_MANAGER_CONTEXT, (manager) =>{
            manager.open(this, EditExportTypeModal, {});
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
    
    render() {

        return html`
            <uui-box>
                <div slot="headline" pristine="" style="font-size: 1.2rem; padding-top: 0.5rem;">Create new Export Type</div>
                <div slot="header-actions" >
                    <uui-button pristine="" label="Create" color="positive" look="primary" @click=${this.#openCreateDialog}><uui-icon name="icon-add"></uui-icon></uui-button>
                </div>
                
                <div style="position:relative; display: block">
                    <div>
                        <p>Export types define what technical components will be used in the generation process (e.g. the generator and transformer list); these can then be assigned to site configurations.</p>
                        <p>These technical components are built using C# code, but you can cover most use cases with the built in options.</p>
                        <p>Once created, your new Export Type will show in the create / edit site section.</p>
                    </div>
                    <div class="buttons">
                        <uui-button-group>
                            <uui-button label="Create new Export Type" color="positive" look="primary" icon="icon-brush" @click=${this.#openCreateDialog}></uui-button>
                        </uui-button-group>
                    </div>
                </div>
            </uui-box>
        `;
    }
}

export default NewSiteElement;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-new-export-type-element': NewSiteElement
    }
}