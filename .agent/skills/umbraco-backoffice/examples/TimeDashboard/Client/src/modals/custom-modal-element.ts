import { customElement, html, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement } from "@umbraco-cms/backoffice/modal";
import { TimeCustomModalData, TimeCustomModalValue } from "./custom-modal-token.js";
import { UUIInputEvent } from "@umbraco-cms/backoffice/external/uui";

@customElement('time-custom-modal')
export class TimeCustomModalElement extends
    UmbModalBaseElement<TimeCustomModalData, TimeCustomModalValue> {
    constructor() {
        super();
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.updateValue({ content: this.data?.content });
    }

    @state()
    content: string = '';

    #handleConfirm() {
        this.value = { content: this.data?.content ?? '' };
        this.modalContext?.submit();
    }

    #handleCancel() {
        this.modalContext?.reject();
    }

    #contentChange(event: UUIInputEvent) {
        this.updateValue({ content: event.target.value.toString() });
    }

    render() {
        return html`
            <umb-body-layout .headline=${this.data?.headline ?? 'Custom dialog'}>
                <uui-box>
                    <uui-textarea label="content"
                        rows=10
                        .value=${this.data?.content}
                        @input=${this.#contentChange}>
                    </uui-textarea>
                </uui-box>
                <uui-box>
                    <h2>Return Value</h2>
                    <pre>${this.value?.content}</pre>
                </uui-box>

                <div slot="actions">
                        <uui-button id="cancel" label="Cancel" @click="${this.#handleCancel}">Cancel</uui-button>
                        <uui-button
                            id="submit"
                            color='positive'
                            look="primary"
                            label="Submit"
                            @click=${this.#handleConfirm}></uui-button>
            </div>
            </umb-body-layout>
        `;
    }

}

export default TimeCustomModalElement;
