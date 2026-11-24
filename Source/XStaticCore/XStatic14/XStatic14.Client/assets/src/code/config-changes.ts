import { UmbNumberState } from '@umbraco-cms/backoffice/observable-api';
import type { Observable } from '@umbraco-cms/backoffice/observable-api';

/**
 * Shared state that says "the xStatic configuration changed".
 *
 * The export type, deployment target and action contexts call `notifyConfigChanged()` after they create, update or
 * delete something. The site context observes `configChanges` and reloads the data its create/edit dialog depends on.
 * It replaces the old `xStaticEvent` that was dispatched on `window`.
 *
 * The value is a counter: it starts at 0 and goes up by one on every change, so observers can ignore the value they
 * see when they subscribe.
 */
const configVersion = new UmbNumberState(0);

/** Emits the current change counter, then a new value after every change. */
export const configChanges: Observable<number> = configVersion.asObservable();

/** The current change counter. */
export function getConfigVersion(): number {
	return configVersion.getValue();
}

/** Tells observers that export types, deployment targets or actions have changed on the server. */
export function notifyConfigChanged(): void {
	configVersion.setValue(configVersion.getValue() + 1);
}
