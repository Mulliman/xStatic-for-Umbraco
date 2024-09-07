import {
	css,
	customElement,
	html,
	property,
	LitElement,
	state,
} from '@umbraco-cms/backoffice/external/lit';

@customElement('xstatic-validation-error-wrapper')
export class ValidationErrorWrapper extends LitElement {

	@property({ type: String, attribute: true })
	public errorMessage: string | null | undefined;

	constructor() {
		super();
	}

	override render() {
		if (!this.errorMessage) {
			return html`<slot></slot>`;
		}

		return html`
			<div class="error">
				<div class="error-message">${this.errorMessage}</div>

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

		.error{
			background: linear-gradient(90deg, transparent 10%, #FEE 30%, transparent 50%);
		}

		.error-message{
			padding-top: var(--uui-size-layout-1);
			color: var(--uui-color-danger);
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