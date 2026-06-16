import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UmbNumberState } from '@umbraco-cms/backoffice/observable-api';
import { BLUEPRINT_COUNTER_CONTEXT } from './context-token.js';

/**
 * Blueprint workspace counter context.
 * Demonstrates a simple context with state management.
 */
export class BlueprintCounterContext extends UmbControllerBase {
	#counter = new UmbNumberState(0);
	readonly counter = this.#counter.asObservable();

	constructor(host: UmbControllerHost) {
		super(host);
		this.provideContext(BLUEPRINT_COUNTER_CONTEXT, this);
	}

	increment() {
		this.#counter.setValue(this.#counter.value + 1);
	}

	reset() {
		this.#counter.setValue(0);
	}

	override destroy() {
		this.#counter.destroy();
		super.destroy();
	}
}

export const api = BlueprintCounterContext;