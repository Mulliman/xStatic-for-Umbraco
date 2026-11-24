import type { UmbPropertyValueData } from '@umbraco-cms/backoffice/property';
import type { UmbPropertyEditorConfig } from '@umbraco-cms/backoffice/property-editor';
import { toApiFieldValue } from './field-value-converter';

/**
 * One `<umb-property>` in an xStatic create/edit dialog.
 * Dialogs build an array of these and render each one inside an `<umb-property-dataset>`.
 */
export interface XStaticFormProperty {
	alias: string;
	label: string;
	description?: string;
	propertyEditorUiAlias: string;
	config?: UmbPropertyEditorConfig;
}

/** Validation errors keyed by property alias. An empty map means the model is valid. */
export type XStaticFormErrors = Map<string, string>;

/** A field whose value is posted back to the API in a `Record<string, string | null>`. */
export interface XStaticFormField {
	alias?: string | null;
	name?: string | null;
	value?: unknown;
}

/** Returns the dataset value stored under `alias`. */
export function getValue<T = unknown>(values: ReadonlyArray<UmbPropertyValueData>, alias: string): T | undefined {
	return values.find((x) => x.alias === alias)?.value as T | undefined;
}

/** Returns the first item of an array value (dropdowns store their selection as `[value]`), or `null`. */
export function getFirst<T>(value: ReadonlyArray<T> | null | undefined): T | null {
	return Array.isArray(value) && value.length > 0 ? value[0] : null;
}

/** Joins a tag list into the comma-separated string the API stores, or `null` when it is empty. */
export function toCsv(value: ReadonlyArray<string> | null | undefined): string | null {
	return Array.isArray(value) && value.length > 0 ? value.join(',') : null;
}

/** Splits a comma-separated API value into a tag list. */
export function fromCsv(value: string | null | undefined): string[] | undefined {
	return value ? value.split(',') : undefined;
}

/** Returns the value when it is an array, otherwise `null`. */
export function asArrayOrNull<T>(value: unknown): T[] | null {
	return Array.isArray(value) ? (value as T[]) : null;
}

/** Converts a dropdown or checkbox value (always a string) to a number, or `null` when it is empty or not a number. */
export function toNumberOrNull(value: unknown): number | null {
	if (value === null || value === undefined || value === '') {
		return null;
	}

	const number = Number(value);

	return Number.isNaN(number) ? null : number;
}

/**
 * Converts editor fields to the `Record<string, string | null>` the API expects, keyed by `keyOf(field)`.
 * Fields without a key are skipped.
 */
export function fieldsToRecord<TField extends XStaticFormField>(
	fields: ReadonlyArray<TField> | null | undefined,
	keyOf: (field: TField) => string | null | undefined = (field) => field.alias,
): Record<string, string | null> {
	const record: Record<string, string | null> = {};

	for (const field of fields ?? []) {
		const key = field ? keyOf(field) : undefined;

		if (key) {
			record[key] = toApiFieldValue(field.value);
		}
	}

	return record;
}

/**
 * Whether the fields already in the form still match the fields of the selected type, so the values the user typed
 * can be kept. Returns `false` when either list is missing or an alias of the selected type is not in the form.
 */
export function hasMatchingFields(
	existingFields: ReadonlyArray<{ alias?: string | null }> | null | undefined,
	selectedFields: ReadonlyArray<{ alias?: string | null }> | null | undefined,
): boolean {
	if (!existingFields || !selectedFields || existingFields.length !== selectedFields.length) {
		return false;
	}

	return selectedFields.every((selected) => existingFields.some((existing) => existing.alias === selected.alias));
}

/** Builds the `items` config of a dropdown or checkbox list. */
export function toOptions<T>(
	items: ReadonlyArray<T> | null | undefined,
	nameOf: (item: T) => string | null | undefined,
	valueOf: (item: T) => string | number | null | undefined,
): Array<{ name: string; value: string }> {
	return (items ?? []).map((item) => ({ name: nameOf(item) ?? '', value: valueOf(item)?.toString() ?? '' }));
}

/** The text box `validation` config that makes a name mandatory. */
export const MANDATORY_NAME_VALIDATION = {
	alias: 'validation',
	value: {
		mandatory: true,
		pattern: null,
		minLength: 1,
		maxLength: 255,
		error: 'Name is required',
	},
};
