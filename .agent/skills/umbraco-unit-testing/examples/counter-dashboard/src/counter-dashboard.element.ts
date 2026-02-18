import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import { CounterContext, COUNTER_CONTEXT } from './counter-context.js';

/**
 * Counter Dashboard Element
 *
 * Demonstrates:
 * - Lit element with shadow DOM
 * - Context consumption
 * - Reactive state updates
 * - User interactions
 */
@customElement('counter-dashboard')
export class CounterDashboardElement extends UmbElementMixin(LitElement) {
	@state()
	private _count = 0;

	#counterContext?: CounterContext;

	constructor() {
		super();

		// Consume the counter context
		this.consumeContext(COUNTER_CONTEXT, (context) => {
			this.#counterContext = context;
			this.#observeCount();
		});
	}

	#observeCount() {
		if (!this.#counterContext) return;

		this.observe(this.#counterContext.count, (count) => {
			this._count = count;
		});
	}

	#handleIncrement() {
		this.#counterContext?.increment();
	}

	#handleDecrement() {
		this.#counterContext?.decrement();
	}

	#handleReset() {
		this.#counterContext?.reset();
	}

	static styles = css`
		:host {
			display: block;
			padding: 20px;
			font-family: var(--uui-font-family, sans-serif);
		}

		.dashboard {
			background: var(--uui-color-surface, #fff);
			border: 1px solid var(--uui-color-border, #e9e9e9);
			border-radius: var(--uui-border-radius, 3px);
			padding: 24px;
			text-align: center;
		}

		h1 {
			margin: 0 0 16px 0;
			font-size: 1.5rem;
			color: var(--uui-color-text, #1b264f);
		}

		.count-display {
			font-size: 4rem;
			font-weight: bold;
			color: var(--uui-color-interactive, #1b264f);
			margin: 24px 0;
		}

		.controls {
			display: flex;
			gap: 8px;
			justify-content: center;
			margin-top: 16px;
		}

		button {
			padding: 8px 16px;
			font-size: 1rem;
			border: 1px solid var(--uui-color-border, #e9e9e9);
			border-radius: var(--uui-border-radius, 3px);
			cursor: pointer;
			background: var(--uui-color-surface, #fff);
		}

		button:hover {
			background: var(--uui-color-surface-emphasis, #f5f5f5);
		}

		.increment-btn {
			background: var(--uui-color-positive, #4caf50);
			color: white;
			border-color: var(--uui-color-positive, #4caf50);
		}

		.decrement-btn {
			background: var(--uui-color-warning, #ff9800);
			color: white;
			border-color: var(--uui-color-warning, #ff9800);
		}

		.reset-btn {
			background: var(--uui-color-danger, #f44336);
			color: white;
			border-color: var(--uui-color-danger, #f44336);
		}
	`;

	render() {
		return html`
			<div class="dashboard">
				<h1>Counter Dashboard</h1>
				<div class="count-display">${this._count}</div>
				<div class="controls">
					<button class="decrement-btn" @click=${this.#handleDecrement}>
						- Decrement
					</button>
					<button class="reset-btn" @click=${this.#handleReset}>
						Reset
					</button>
					<button class="increment-btn" @click=${this.#handleIncrement}>
						+ Increment
					</button>
				</div>
			</div>
		`;
	}
}

declare global {
	interface HTMLElementTagNameMap {
		'counter-dashboard': CounterDashboardElement;
	}
}
