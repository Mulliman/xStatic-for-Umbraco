import { EXAMPLE_FEATURE_TOGGLE_CONTEXT, type Feature } from './feature-toggle-context.js';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { css, html, customElement, state, repeat, LitElement } from '@umbraco-cms/backoffice/external/lit';
import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';

@customElement('example-feature-toggle-view')
export class ExampleFeatureToggleViewElement extends UmbElementMixin(LitElement) {
	#context?: typeof EXAMPLE_FEATURE_TOGGLE_CONTEXT.TYPE;

	@state()
	private _features: Feature[] = [];

	@state()
	private _activeCount = 0;

	constructor() {
		super();
		this.consumeContext(EXAMPLE_FEATURE_TOGGLE_CONTEXT, (context) => {
			this.#context = context;
			this.#observeFeatures();
		});
	}

	#observeFeatures(): void {
		if (!this.#context) return;

		this.observe(this.#context.features, (features) => {
			this._features = features;
		});

		this.observe(this.#context.activeCount, (count) => {
			this._activeCount = count;
		});
	}

	#onToggle(featureId: string) {
		this.#context?.toggle(featureId);
	}

	#onEnableAll() {
		this.#context?.enableAll();
	}

	#onDisableAll() {
		this.#context?.disableAll();
	}

	#onReset() {
		this.#context?.reset();
	}

	override render() {
		return html`
			<uui-box headline="Feature Toggles">
				<div class="header">
					<span class="count">${this._activeCount} of ${this._features.length} features enabled</span>
					<div class="actions">
						<uui-button look="secondary" @click=${this.#onEnableAll}>Enable All</uui-button>
						<uui-button look="secondary" @click=${this.#onDisableAll}>Disable All</uui-button>
						<uui-button look="outline" @click=${this.#onReset}>Reset</uui-button>
					</div>
				</div>

				<div class="feature-list">
					${repeat(
						this._features,
						(feature) => feature.id,
						(feature) => html`
							<div class="feature-item">
								<uui-toggle
									.checked=${feature.enabled}
									@change=${() => this.#onToggle(feature.id)}
								>
									<div class="feature-info">
										<strong>${feature.name}</strong>
										<span class="description">${feature.description}</span>
									</div>
								</uui-toggle>
							</div>
						`
					)}
				</div>
			</uui-box>
		`;
	}

	static override styles = [
		UmbTextStyles,
		css`
			:host {
				display: block;
				padding: var(--uui-size-layout-1);
			}

			.header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: var(--uui-size-space-5);
				padding-bottom: var(--uui-size-space-4);
				border-bottom: 1px solid var(--uui-color-border);
			}

			.count {
				font-size: var(--uui-type-small-size);
				color: var(--uui-color-text-alt);
			}

			.actions {
				display: flex;
				gap: var(--uui-size-space-2);
			}

			.feature-list {
				display: flex;
				flex-direction: column;
				gap: var(--uui-size-space-4);
			}

			.feature-item {
				padding: var(--uui-size-space-4);
				background: var(--uui-color-surface-alt);
				border-radius: var(--uui-border-radius);
			}

			.feature-info {
				display: flex;
				flex-direction: column;
				gap: var(--uui-size-space-1);
			}

			.description {
				font-size: var(--uui-type-small-size);
				color: var(--uui-color-text-alt);
			}
		`,
	];
}

export default ExampleFeatureToggleViewElement;

declare global {
	interface HTMLElementTagNameMap {
		'example-feature-toggle-view': ExampleFeatureToggleViewElement;
	}
}
