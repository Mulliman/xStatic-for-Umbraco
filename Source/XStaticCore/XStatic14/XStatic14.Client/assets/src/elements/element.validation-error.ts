import { css, customElement, html, property } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';

/** Wraps a form property and shows a validation message above it when `errorMessage` is set. */
@customElement('xstatic-validation-error-wrapper')
export class ValidationErrorWrapper extends UmbLitElement {

	@property({ type: String, attribute: true })
	public errorMessage: string | null | undefined;

	override render() {
		if (!this.errorMessage) {
			return html`<slot></slot>`;
		}

		return html`
			<div class="error">
				<div class="error-message" role="alert">${this.errorMessage}</div>

				<slot></slot>
			</div>
		`;
	}

	static styles = css`
		:host {
			display: block;
			position: relative;
			width: 100%;
		}

		.error {
			border-left: var(--uui-size-space-1) solid var(--uui-color-danger);
			padding-left: var(--uui-size-space-4);
		}

		.error-message {
			padding-top: var(--uui-size-layout-1);
			color: var(--uui-color-danger-standalone);
			font-weight: bold;
		}
	`;
}

export default ValidationErrorWrapper;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-validation-error-wrapper': ValidationErrorWrapper;
	}
}
