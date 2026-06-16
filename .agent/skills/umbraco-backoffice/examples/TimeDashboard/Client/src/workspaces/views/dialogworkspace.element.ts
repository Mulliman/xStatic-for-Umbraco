import { UMB_BLOCK_CATALOGUE_MODAL } from "@umbraco-cms/backoffice/block";
import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, css, customElement, html, state } from "@umbraco-cms/backoffice/external/lit";
import {
    UMB_CONFIRM_MODAL,
    UMB_MODAL_MANAGER_CONTEXT,
    UmbModalManagerContext,
    UmbModalToken
} from "@umbraco-cms/backoffice/modal";
import { TIME_CUSTOM_MODAL } from "../../modals/custom-modal-token.js";

@customElement("dialog-examples-view")
export class TimeDialogExamplesElement extends UmbElementMixin(LitElement) {

    private _modalContext?: UmbModalManagerContext;

    constructor() {
        super();
        this.consumeContext(UMB_MODAL_MANAGER_CONTEXT, (_instance) => {
            this._modalContext = _instance;
        });
    }

    @state()
    icon = '';

    @state()
    color = '';


    async _OpenCustomModal() {

        const customContext = this._modalContext?.open(this, TIME_CUSTOM_MODAL, {
            data: {
                headline: 'A Custom modal',
                content: 'Some content for the custom modal'
            }
        });

        const data = await customContext?.onSubmit();

        if (!data) return;

        console.log('data', data);
    }

    modal_names = [
        { name: 'Block catalogue', value: UMB_BLOCK_CATALOGUE_MODAL }
    ];


    render() {
        return html`
            <umb-body-layout header-transparent header-fit-height>
                <uui-box headline="Dialog Examples">
                    <div>
                        <uui-button look="secondary"
                                    color="positive"
                                    label="custom dialog"
                                    @click=${this._OpenCustomModal}></uui-button>
                    </div>
                </uui-box>

                <uui-box>
                    ${this.render_modals()}
                </uui-box>

                <uui-box>
                    <uui-button
                        color="danger"
                        look="primary"
                        label="Confirm?" @click=${this.openConfirm}></uui-button>
                </uui-box>
            </umb-body-layout>
        `;
    };

    async openConfirm() {

        const confirmContext = this._modalContext?.open(this, UMB_CONFIRM_MODAL, {
            data: {
                headline: `Are you sure`,
                content: 'Do you really want to do the thing here?',
                confirmLabel: 'Confim',
                color: 'danger',
            }
        });

        confirmContext?.onSubmit()
            .then(() => {
                console.log('confirm');
            })
            .catch(() => {
                console.log('cancel');
            });
    }

    async openModal(name: UmbModalToken<object, unknown>) {

        const modalContext = this._modalContext?.open(this, name);
        const data = await modalContext?.onSubmit();

        console.log(data);
    }

    render_modals() {

        const buttons = this.modal_names.map((m) => {

            return html`
                <uui-button .label=${m.name}
                color="default" look="secondary"
                @click=${() => this.openModal(m.value)}></uui-button>
            `;

        });

        return html`
            <div class="buttons">
                ${buttons}
            </div>
        `

    }

    static styles = css`

        uui-icon {
            font-size: 25pt;
        }

        .picker {
            display: flex;
        }
        .buttons {
            display: flex;
            flex-wrap: wrap;
        }

        .buttons > uui-button {
            margin: 10px ;
        }

    `;

}

export default TimeDialogExamplesElement;


declare global {
    interface HTMLElementTagNameMap {
        'time-dialog-examples-view': TimeDialogExamplesElement
    }
}
