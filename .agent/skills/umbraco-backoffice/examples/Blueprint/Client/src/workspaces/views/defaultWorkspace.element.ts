import { BLUEPRINT_COUNTER_CONTEXT } from '../context-token.js';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { css, html, customElement, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';

@customElement('blueprint-counter-workspace-view')
export class BlueprintCounterWorkspaceView extends UmbLitElement {
	#counterContext?: typeof BLUEPRINT_COUNTER_CONTEXT.TYPE;

	@state()
	private _count = 0;

	constructor() {
		super();
		this.consumeContext(BLUEPRINT_COUNTER_CONTEXT, (instance) => {
			this.#counterContext = instance;
			this.#observeCounter();
		});
	}

	#observeCounter(): void {
		if (!this.#counterContext) return;
		this.observe(this.#counterContext.counter, (count) => {
			this._count = count;
		});
	}

	#handleIncrement = () => {
		this.#counterContext?.increment();
	};

	#handleReset = () => {
		this.#counterContext?.reset();
	};

	override render() {
		return html`
			<uui-box class="uui-text">
				<h1 class="uui-h2">Counter Example</h1>
				<p class="uui-lead">Current count value: ${this._count}</p>
				<p>This workspace view consumes the Counter Context and displays the current count.</p>
				<div class="actions">
					<uui-button look="primary" @click=${this.#handleIncrement}>Increment</uui-button>
					<uui-button look="secondary" @click=${this.#handleReset}>Reset</uui-button>
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
			.actions {
				display: flex;
				gap: var(--uui-size-space-3);
				margin-top: var(--uui-size-space-4);
			}
		`,
	];
}

export default BlueprintCounterWorkspaceView;

declare global {
	interface HTMLElementTagNameMap {
		'blueprint-counter-workspace-view': BlueprintCounterWorkspaceView;
	}
}