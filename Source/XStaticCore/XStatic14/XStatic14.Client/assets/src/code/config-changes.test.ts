import { describe, expect, it } from 'vitest';
import { configChanges, getConfigVersion, notifyConfigChanged } from './config-changes';

describe('config changes', () => {
	it('emits the current version on subscribe and a new version after every change', () => {
		const seen: number[] = [];
		const subscription = configChanges.subscribe((version) => seen.push(version));
		const start = getConfigVersion();

		notifyConfigChanged();
		notifyConfigChanged();
		subscription.unsubscribe();
		notifyConfigChanged();

		expect(seen).toEqual([start, start + 1, start + 2]);
		expect(getConfigVersion()).toBe(start + 3);
	});
});
