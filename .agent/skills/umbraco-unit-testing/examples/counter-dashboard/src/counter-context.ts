import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UmbNumberState } from '@umbraco-cms/backoffice/observable-api';

/**
 * Counter Context - Manages counter state
 *
 * Demonstrates:
 * - Private state with public observable
 * - Methods to update state
 * - Context token for dependency injection
 */
export class CounterContext extends UmbContextBase {
	// Private state - only this class can modify
	#count = new UmbNumberState(0);

	// Public observable - consumers subscribe to changes
	readonly count = this.#count.asObservable();

	constructor(host: UmbControllerHost) {
		super(host, COUNTER_CONTEXT);
	}

	/** Increment the counter by 1 */
	increment(): void {
		this.#count.setValue(this.#count.getValue() + 1);
	}

	/** Decrement the counter by 1 (minimum 0) */
	decrement(): void {
		const newValue = Math.max(0, this.#count.getValue() - 1);
		this.#count.setValue(newValue);
	}

	/** Reset the counter to 0 */
	reset(): void {
		this.#count.setValue(0);
	}
}

// Context Token for dependency injection
export const COUNTER_CONTEXT = new UmbContextToken<CounterContext>(
	'CounterContext',
	'example.counter.context',
);
