import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html, customElement } from '@umbraco-cms/backoffice/external/lit';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { EditExportTypeModal } from './dialog.edit-export-type';
import { xStaticCardStyles } from '../../code/styles';

@customElement('xstatic-new-export-type-element')
class NewExportTypeElement extends UmbLitElement {

    async #openCreateDialog() {
        const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
        modalManager?.open(this, EditExportTypeModal, {});
    }

    render() {
        return html`
            <uui-box data-test-id="new-export-type">
                <div slot="headline" class="headline">Create new Export Type</div>
                <div slot="header-actions">
                    <uui-button label="Create" color="positive" look="primary" @click=${this.#openCreateDialog}><uui-icon name="icon-add"></uui-icon></uui-button>
                </div>

                <div class="card-body">
                    <p>Export types define what technical components will be used in the generation process (e.g. the generator and transformer list); these can then be assigned to site configurations.</p>
                    <p>These technical components are built using C# code, but you can cover most use cases with the built in options.</p>
                    <p>Once created, your new Export Type will show in the create / edit site section.</p>
                    <div class="buttons">
                        <uui-button label="Create new Export Type" color="positive" look="primary" data-test-id="new-export-type-create" @click=${this.#openCreateDialog}>
                            <uui-icon name="icon-brush"></uui-icon>Create new Export Type
                        </uui-button>
                    </div>
                </div>
            </uui-box>
        `;
    }

    static styles = [xStaticCardStyles];
}

export default NewExportTypeElement;

declare global {
    interface HTMLElementTagNameMap {
        'xstatic-new-export-type-element': NewExportTypeElement
    }
}
