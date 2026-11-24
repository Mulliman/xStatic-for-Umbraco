import { describe, expect, it } from 'vitest';
import { toDetailItems } from './table-items';

describe('toDetailItems', () => {
	it('converts rows into single-column table items and drops rows without a value', () => {
		expect(
			toDetailItems([
				{ id: 'name', icon: 'icon-home', value: 'My site' },
				{ id: 'empty', icon: 'icon-folder', value: null },
				{ id: 'blank', icon: 'icon-folder', value: '' },
			]),
		).toEqual([{ id: 'name', icon: 'icon-home', data: [{ columnAlias: 'value', value: 'My site' }] }]);
	});
});
