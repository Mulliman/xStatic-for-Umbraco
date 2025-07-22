import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { css, html, customElement, state } from '@umbraco-cms/backoffice/external/lit';
// import type { UmbPropertyEditorUiElement } from '@umbraco-cms/backoffice/extension-registry';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import {
	UmbPropertyEditorUiElement,
	UmbPropertyValueChangeEvent,
} from '@umbraco-cms/backoffice/property-editor';
import { UmbFormControlMixin } from '@umbraco-cms/backoffice/validation';

@customElement('xstatic-property-editor-netlify-subdomain')
export class XStaticPropertyEditorNetlifySubdomainElement
	extends UmbFormControlMixin<string>(UmbLitElement, undefined)
	implements UmbPropertyEditorUiElement
{
	@state()
	isAvailable?: boolean;

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
		return html`
		<div style="display: flex">
			<uui-input
				.value=${this.value ?? ''}
				.type=${'text'}
				@input=${this.#onInput}
			></uui-input>
			<span class="suffix">.netlify.app</span>
			<uui-button href=${"https://" + this.value + ".netlify.app"} target="_blank" look="secondary" title="Test whether this site already exists by visiting the site."><uui-icon name="icon-arrow-right"></uui-icon></uui-button>
		</div>
		`;
	}

	static styles = [
		UmbTextStyles,
		css`
			uui-input {
				width: 80%;
				flex: 5;
				border-right: none;
			}

			.suffix {
				padding: 6px 15px 0;
				border: 1px solid var(--uui-input-border-color, var(--uui-color-border,#d8d7d9));
				border-left: none;
				 /* background: #444;  */
				 /* color: white; */
				 font-weight: bold;
				 flex: 1;
			}

			uui-button{
			}
		`,
	];
}

export default XStaticPropertyEditorNetlifySubdomainElement;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-property-editor-netlify-subdomain': XStaticPropertyEditorNetlifySubdomainElement;
	}
}
