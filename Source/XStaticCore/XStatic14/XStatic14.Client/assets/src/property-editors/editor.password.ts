import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { css, html, customElement, property } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import type { UmbPropertyEditorUiElement } from '@umbraco-cms/backoffice/property-editor';
import { UmbFormControlMixin } from '@umbraco-cms/backoffice/validation';
import { UmbChangeEvent } from '@umbraco-cms/backoffice/event';
import './element.secret-reference-hint';

/**
 * Password property editor used by deployer fields (for example FTP and Git passwords and API tokens).
 * It wraps `<uui-input-password>`, which has its own show/hide toggle.
 */
@customElement('xstatic-property-editor-password')
export class XStaticPropertyEditorPasswordElement
	extends UmbFormControlMixin<string, typeof UmbLitElement>(UmbLitElement, undefined)
	implements UmbPropertyEditorUiElement
{
	/** The property label, set by `<umb-property>`. Used for the input's accessible name. */
	@property()
	name?: string;

	protected override firstUpdated(): void {
		const input = this.shadowRoot?.querySelector('uui-input-password');

		if (input) {
			this.addFormControlElement(input);
		}
	}

	#onInput(e: InputEvent) {
		const newValue = (e.target as HTMLInputElement).value;
		if (newValue === this.value) return;
		this.value = newValue;
		this.dispatchEvent(new UmbChangeEvent());
	}

	override render() {
		return html`
			<uui-input-password
				.value=${this.value ?? ''}
				label=${this.localize.term('general_fieldFor', [this.name ?? ''])}
				autocomplete="new-password"
				@input=${this.#onInput}
			></uui-input-password>
			<xstatic-secret-reference-hint .value=${this.value ?? ''}></xstatic-secret-reference-hint>
		`;
	}

	static styles = [
		UmbTextStyles,
		css`
			uui-input-password {
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
