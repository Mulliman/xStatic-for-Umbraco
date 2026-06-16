import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { LitElement, css, customElement, html, state } from "@umbraco-cms/backoffice/external/lit";

@customElement('time-workspace-default-view')
export class TimeDefaultWorkspaceElement extends UmbElementMixin(LitElement) {

    @state()
    text?: string = 'your text goes here';

    #onTextChange(e: InputEvent) {
        this.text = (e.target as HTMLInputElement).value;
    }

    render() {
        return html`
            <umb-body-layout header-transparent header-fit-height>
                <uui-box headline="default view">
                    <umb-property-layout
                        label="property"
                        description="property description">
                        <div slot="editor">
                            <uui-input
                                slot="editor"
                                type="text"
                                @change=${this.#onTextChange}
                                .value=${this.text}></uui-input>
                        </div>
                    </umb-property-layout>

                    <em>[${this.text}]</em>
                </uui-box>
            </umb-body-layout>

        `
    };

    static styles = css`
        uui-input {
            width: 100%;
            --uui-button-border-radius: 0;
        }
    `
}

export default TimeDefaultWorkspaceElement;

declare global {
    interface HTMLElementTagNameMap {
        'time-workspace-default-view': TimeDefaultWorkspaceElement
    }
}
