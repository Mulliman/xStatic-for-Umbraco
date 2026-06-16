import { EXAMPLE_FEATURE_TOGGLE_CONTEXT } from './feature-toggle-context.js';
import { customElement, html, state, LitElement } from '@umbraco-cms/backoffice/external/lit';
import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';

@customElement('example-feature-toggle-footer')
export class ExampleFeatureToggleFooterElement extends UmbElementMixin(LitElement) {
	@state()
	private _activeCount = 0;

	@state()
	private _allEnabled = false;

	constructor() {
		super();
		this.#observeContext();
	}

	async #observeContext() {
		const context = await this.getContext(EXAMPLE_FEATURE_TOGGLE_CONTEXT);
		if (!context) return;

		this.observe(context.activeCount, (count) => {
			this._activeCount = count;
		});

		this.observe(context.allEnabled, (allEnabled) => {
			this._allEnabled = allEnabled;
		});
	}

	override render() {
		return html`
			<span>
				${this._activeCount} feature${this._activeCount !== 1 ? 's' : ''} active
				${this._allEnabled ? '(all enabled)' : ''}
			</span>
		`;
	}
}

export default ExampleFeatureToggleFooterElement;

declare global {
	interface HTMLElementTagNameMap {
		'example-feature-toggle-footer': ExampleFeatureToggleFooterElement;
	}
}
