import { BLUEPRINT_COUNTER_CONTEXT } from '../context-token.js';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import { css, html, customElement, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';

@customElement('blueprint-another-workspace-view')
export class BlueprintAnotherWorkspaceView extends UmbLitElement {
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

	override render() {
		return html`
			<uui-box class="uui-text">
				<h1 class="uui-h2">Another View</h1>
				<p class="uui-lead">Current count value: ${this._count}</p>
				<p>This is another workspace view that also consumes the Counter Context.</p>
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
		`,
	];
}

export default BlueprintAnotherWorkspaceView;

declare global {
	interface HTMLElementTagNameMap {
		'blueprint-another-workspace-view': BlueprintAnotherWorkspaceView;
	}
}