import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, customElement } from '@umbraco-cms/backoffice/external/lit';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditActionModal } from './dialog.action';
import { xStaticCardStyles } from '../../code/styles';

@customElement('xstatic-new-action-element')
class NewActionElement extends UmbLitElement {
    render() {
        return html`
            <uui-box data-test-id="new-action">
                <div slot="headline" class="headline">Create new Action</div>
                <div slot="header-actions">
                    <uui-button label="Create" color="positive" look="primary" @click=${this.#openCreateDialog}><uui-icon name="icon-add"></uui-icon></uui-button>
                </div>

                <div class="card-body">
                    <p>Post Generation Actions (Actions) are processes that run on the generated files once all these files have been created.</p>
                    <p>This is often used to change generated files or create files that aren't auto generated.</p>
                    <p>Once created, you can choose to use multiple actions for each site by selecting them in the sites dashboard.</p>
                    <div class="buttons">
                        <uui-button label="Create new Action" color="positive" look="primary" data-test-id="new-action-create" @click=${this.#openCreateDialog}>
                            <uui-icon name="icon-brush"></uui-icon>Create new Action
                        </uui-button>
                    </div>
                </div>
            </uui-box>
        `;
    }

    async #openCreateDialog() {
        const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
        modalManager?.open(this, EditActionModal, {});
    }

    static styles = [xStaticCardStyles];
}

export default NewActionElement;

declare global {
    interface HTMLElementTagNameMap {
        'xstatic-new-action-element': NewActionElement
    }
}
