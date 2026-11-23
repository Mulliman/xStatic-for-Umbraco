import { describe, expect, it } from 'vitest';
import {
	DECIMAL_EDITOR_UI_ALIAS,
	INTEGER_EDITOR_UI_ALIAS,
	TOGGLE_EDITOR_UI_ALIAS,
	toApiFieldValue,
	toEditorValue,
} from './field-value-converter';

describe('field-value-converter', () => {
	describe('toEditorValue', () => {
		it('converts string and boolean values for Toggle editors', () => {
			expect(toEditorValue('true', TOGGLE_EDITOR_UI_ALIAS)).toBe(true);
			expect(toEditorValue('TRUE', TOGGLE_EDITOR_UI_ALIAS)).toBe(true);
			expect(toEditorValue('1', TOGGLE_EDITOR_UI_ALIAS)).toBe(true);
			expect(toEditorValue(true, TOGGLE_EDITOR_UI_ALIAS)).toBe(true);
			expect(toEditorValue('false', TOGGLE_EDITOR_UI_ALIAS)).toBe(false);
			expect(toEditorValue('0', TOGGLE_EDITOR_UI_ALIAS)).toBe(false);
			expect(toEditorValue('', TOGGLE_EDITOR_UI_ALIAS)).toBe(false);
			expect(toEditorValue(null, TOGGLE_EDITOR_UI_ALIAS)).toBe(false);
			expect(toEditorValue(undefined, TOGGLE_EDITOR_UI_ALIAS)).toBe(false);
		});

		it('converts string values for Integer and Decimal editors', () => {
			expect(toEditorValue('1000', INTEGER_EDITOR_UI_ALIAS)).toBe(1000);
			expect(toEditorValue(250, INTEGER_EDITOR_UI_ALIAS)).toBe(250);
			expect(toEditorValue('', INTEGER_EDITOR_UI_ALIAS)).toBeUndefined();
			expect(toEditorValue('not-a-number', INTEGER_EDITOR_UI_ALIAS)).toBeUndefined();

			expect(toEditorValue('3.14', DECIMAL_EDITOR_UI_ALIAS)).toBe(3.14);
			expect(toEditorValue('', DECIMAL_EDITOR_UI_ALIAS)).toBeUndefined();
		});

		it('passes through values unchanged for text and password editors', () => {
			expect(toEditorValue('hello', 'Umb.PropertyEditorUi.TextBox')).toBe('hello');
			expect(toEditorValue('secret', 'xstatic.propertyEditorUi.password')).toBe('secret');
			expect(toEditorValue('raw', null)).toBe('raw');
		});
	});

	describe('toApiFieldValue', () => {
		it('serializes booleans, numbers, arrays, strings, and nullish values to string | null', () => {
			expect(toApiFieldValue(true)).toBe('true');
			expect(toApiFieldValue(false)).toBe('false');
			expect(toApiFieldValue(1000)).toBe('1000');
			expect(toApiFieldValue(0)).toBe('0');
			expect(toApiFieldValue(Number.NaN)).toBeNull();
			expect(toApiFieldValue('abc')).toBe('abc');
			expect(toApiFieldValue('')).toBe('');
			expect(toApiFieldValue(['a', 'b'])).toBe('a,b');
			expect(toApiFieldValue(null)).toBeNull();
			expect(toApiFieldValue(undefined)).toBeNull();
		});
	});
});
