import type { UmbPropertyEditorUiElement } from "@umbraco-cms/backoffice/property-editor";
import type { UmbPropertyEditorConfigCollection } from "@umbraco-cms/backoffice/property-editor";
import { customElement, property, css, html, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";

@customElement('styled-textbox')
export class StyledTextboxUiElement extends UmbLitElement implements UmbPropertyEditorUiElement {

    @property()
    value: string | undefined = '';

    @state()
    private _styleValue?: string;

    @property({ attribute: false })
    public set config(config: UmbPropertyEditorConfigCollection | undefined) {
        this._styleValue = config?.getValueByAlias('styleValue') ?? '';
    }

    #handleChange = (e: Event) => {
        const newValue = (e.target as HTMLInputElement).value;
        if (newValue === this.value) return;
        this.value = newValue;
        this.dispatchEvent(new CustomEvent('property-value-change'));
    };

    override render() {
        return html`
            <uui-input
              .value=${this.value ?? ''}
              .style=${this._styleValue}
              type="text"
              @input=${this.#handleChange}></uui-input>
        `;
    }

    static override styles = css`
        uui-input {
          width: 100%;
        }
    `;
}

export default StyledTextboxUiElement;

declare global {
    interface HTMLElementTagNameMap {
        'styled-textbox': StyledTextboxUiElement;
    }
}
