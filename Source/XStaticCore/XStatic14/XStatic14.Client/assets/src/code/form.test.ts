import { describe, expect, it } from 'vitest';
import {
	asArrayOrNull,
	fieldsToRecord,
	fromCsv,
	getFirst,
	getValue,
	hasMatchingFields,
	toCsv,
	toNumberOrNull,
	toOptions,
} from './form';

describe('form helpers', () => {
	it('getValue returns the value stored under an alias', () => {
		const values = [
			{ alias: 'name', value: 'Site' },
			{ alias: 'type', value: ['a'] },
		];

		expect(getValue(values, 'name')).toBe('Site');
		expect(getValue(values, 'type')).toEqual(['a']);
		expect(getValue(values, 'missing')).toBeUndefined();
	});

	it('getFirst returns the first item or null', () => {
		expect(getFirst(['only'])).toBe('only');
		expect(getFirst([])).toBeNull();
		expect(getFirst(null)).toBeNull();
		expect(getFirst(undefined)).toBeNull();
	});

	it('toCsv and fromCsv convert tag lists', () => {
		expect(toCsv(['a', 'b'])).toBe('a,b');
		expect(toCsv([])).toBeNull();
		expect(toCsv(undefined)).toBeNull();
		expect(fromCsv('a,b')).toEqual(['a', 'b']);
		expect(fromCsv('')).toBeUndefined();
		expect(fromCsv(null)).toBeUndefined();
	});

	it('asArrayOrNull keeps arrays only', () => {
		expect(asArrayOrNull(['1'])).toEqual(['1']);
		expect(asArrayOrNull('1')).toBeNull();
		expect(asArrayOrNull(undefined)).toBeNull();
	});

	it('toNumberOrNull parses dropdown values and rejects empty or invalid ones', () => {
		expect(toNumberOrNull('5')).toBe(5);
		expect(toNumberOrNull(7)).toBe(7);
		expect(toNumberOrNull('')).toBeNull();
		expect(toNumberOrNull(null)).toBeNull();
		expect(toNumberOrNull(undefined)).toBeNull();
		expect(toNumberOrNull('abc')).toBeNull();
	});

	it('fieldsToRecord keys fields by alias by default and converts values for the API', () => {
		expect(
			fieldsToRecord([
				{ alias: 'host', name: 'Host', value: 'ftp.example.com' },
				{ alias: 'port', name: 'Port', value: undefined },
				{ alias: 'secure', name: 'Secure', value: true },
				{ alias: null, name: 'No alias', value: 'skipped' },
			]),
		).toEqual({ host: 'ftp.example.com', port: null, secure: 'true' });

		expect(fieldsToRecord([{ alias: 'a', name: 'Field A', value: 'x' }], (f) => f.name)).toEqual({ 'Field A': 'x' });
		expect(fieldsToRecord(undefined)).toEqual({});
	});

	it('hasMatchingFields compares the aliases of the two field lists', () => {
		const selected = [{ alias: 'host' }, { alias: 'port' }];

		expect(hasMatchingFields([{ alias: 'port' }, { alias: 'host' }], selected)).toBe(true);
		expect(hasMatchingFields([{ alias: 'host' }], selected)).toBe(false);
		expect(hasMatchingFields([{ alias: 'host' }, { alias: 'user' }], selected)).toBe(false);
		expect(hasMatchingFields(null, selected)).toBe(false);
		expect(hasMatchingFields([], undefined)).toBe(false);
		expect(hasMatchingFields([], [])).toBe(true);
	});

	it('toOptions builds dropdown items with string values', () => {
		expect(toOptions([{ id: 1, name: 'One' }, { id: 2, name: null }], (x) => x.name, (x) => x.id)).toEqual([
			{ name: 'One', value: '1' },
			{ name: '', value: '2' },
		]);
		expect(toOptions(undefined, () => '', () => '')).toEqual([]);
	});
});
