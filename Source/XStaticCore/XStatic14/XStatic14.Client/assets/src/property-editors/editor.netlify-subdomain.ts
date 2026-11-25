import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { css, html, customElement, nothing, property } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import type { UmbPropertyEditorUiElement } from '@umbraco-cms/backoffice/property-editor';
import { UmbFormControlMixin } from '@umbraco-cms/backoffice/validation';
import { UmbChangeEvent } from '@umbraco-cms/backoffice/event';

/** Property editor for a Netlify site name: a text box, the `.netlify.app` suffix and a link to check the site. */
@customElement('xstatic-property-editor-netlify-subdomain')
export class XStaticPropertyEditorNetlifySubdomainElement
	extends UmbFormControlMixin<string, typeof UmbLitElement>(UmbLitElement, undefined)
	implements UmbPropertyEditorUiElement
{
	/** The property label, set by `<umb-property>`. Used for the input's accessible name. */
	@property()
	name?: string;

	protected override firstUpdated(): void {
		const input = this.shadowRoot?.querySelector('uui-input');

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
			<div class="field">
				<uui-input
					.value=${this.value ?? ''}
					type="text"
					label=${this.localize.term('general_fieldFor', [this.name ?? ''])}
					@input=${this.#onInput}
				></uui-input>
				<span class="suffix">.netlify.app</span>
				<uui-button
					href=${this.value ? `https://${this.value}.netlify.app` : nothing}
					?disabled=${!this.value}
					target="_blank"
					rel="noopener noreferrer"
					look="secondary"
					label="Visit this Netlify site to check whether it already exists"
					title="Test whether this site already exists by visiting the site."
				><uui-icon name="icon-arrow-right"></uui-icon></uui-button>
			</div>
		`;
	}

	static styles = [
		UmbTextStyles,
		css`
			.field {
				display: flex;
			}

			uui-input {
				flex: 1 1 auto;
				min-width: 0;
				border-right: none;
			}

			.suffix {
				flex: 0 0 auto;
				white-space: nowrap;
				padding: var(--uui-size-space-2) var(--uui-size-space-4) 0;
				border: 1px solid var(--uui-input-border-color, var(--uui-color-border));
				border-left: none;
				font-weight: bold;
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
