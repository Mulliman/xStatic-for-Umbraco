import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { css, html, customElement } from '@umbraco-cms/backoffice/external/lit';
import type { UmbPropertyEditorUiElement } from '@umbraco-cms/backoffice/extension-registry';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import {
	UmbPropertyValueChangeEvent,
} from '@umbraco-cms/backoffice/property-editor';
import { UmbFormControlMixin } from '@umbraco-cms/backoffice/validation';

@customElement('xstatic-property-editor-password')
export class XStaticPropertyEditorPasswordElement
	extends UmbFormControlMixin<string>(UmbLitElement, undefined)
	implements UmbPropertyEditorUiElement
{
	protected override firstUpdated(): void {
		this.addFormControlElement(this.shadowRoot!.querySelector('uui-input')!);
	}

	#onInput(e: InputEvent) {
		const newValue = (e.target as HTMLInputElement).value;
		if (newValue === this.value) return;
		this.value = newValue;
		this.dispatchEvent(new UmbPropertyValueChangeEvent());
	}

	override render() {
		return html`<uui-input
			.value=${this.value ?? ''}
			type='password'
			@input=${this.#onInput}></uui-input>`;
	}

	static styles = [
		UmbTextStyles,
		css`
			uui-input {
				width: 100%;
			}
		`,
	];
}

export default XStaticPropertyEditorPasswordElement;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-property-editor-password': XStaticPropertyEditorPasswordElement;
	}
}
