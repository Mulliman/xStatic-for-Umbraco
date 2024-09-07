import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api'
import { customElement } from 'lit/decorators.js';
import { LitElement, css, html } from 'lit';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditActionModal } from './dialog.action';

@customElement('xstatic-new-action-element')
class NewSiteElement extends UmbElementMixin(LitElement) {
    render() {
        return html`
            <uui-box>
                <div slot="headline" pristine="" style="font-size: 1.2rem; padding-top: 0.5rem;">Create new Action</div>
                <div slot="header-actions" >
                    <uui-button pristine="" label="Create" color="positive" look="primary" @click=${this.#openCreateDialog}><uui-icon name="icon-add"></uui-icon></uui-button>
                </div>
                
                <div style="position:relative; display: block">
                    <div>
                        <p>Post Generation Actions (Actions) are processes that run on the generated files once all these files have been created.</p>
                        <p>This is often used to change generated files or create files that aren't auto generated.</p>
                        <p>Once created, you can choose to use multiple actions for each site by selecting them in the sites dashboard.</p>
                    </div>
                    <div class="buttons">
                        <uui-button-group>
                            <uui-button label="Create new Action" color="positive" look="primary" icon="icon-brush" @click=${this.#openCreateDialog}></uui-button>
                        </uui-button-group>
                    </div>
                </div>
            </uui-box>
        `;
    }

    #openCreateDialog() {
        this.consumeContext(UMB_MODAL_MANAGER_CONTEXT, (manager) => {
            manager.open(this, EditActionModal, {});
        })
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

export default NewSiteElement;

declare global {
    interface HtmlElementTagNameMap {
        'xstatic-new-action-element': NewSiteElement
    }
}