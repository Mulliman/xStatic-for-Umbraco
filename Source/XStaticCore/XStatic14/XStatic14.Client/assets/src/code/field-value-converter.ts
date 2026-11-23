export const TOGGLE_EDITOR_UI_ALIAS = 'Umb.PropertyEditorUi.Toggle';
export const INTEGER_EDITOR_UI_ALIAS = 'Umb.PropertyEditorUi.Integer';
export const DECIMAL_EDITOR_UI_ALIAS = 'Umb.PropertyEditorUi.Decimal';

/**
 * Converts a string field value from the xStatic API into the JS primitive expected
 * by the target Umbraco property editor UI (e.g. boolean for Toggle, number for Integer/Decimal).
 */
export function toEditorValue(
	value: unknown,
	editorUiAlias: string | null | undefined,
): unknown {
	if (editorUiAlias === TOGGLE_EDITOR_UI_ALIAS) {
		if (typeof value === 'boolean') {
			return value;
		}
		if (typeof value === 'string') {
			const normalized = value.trim().toLowerCase();
			return normalized === 'true' || normalized === '1';
		}
		if (typeof value === 'number') {
			return value === 1;
		}
		return false;
	}

	if (editorUiAlias === INTEGER_EDITOR_UI_ALIAS) {
		if (typeof value === 'number') {
			return Number.isFinite(value) ? Math.trunc(value) : undefined;
		}
		if (typeof value === 'string' && value.trim() !== '') {
			const parsed = Number.parseInt(value.trim(), 10);
			return Number.isNaN(parsed) ? undefined : parsed;
		}
		return undefined;
	}

	if (editorUiAlias === DECIMAL_EDITOR_UI_ALIAS) {
		if (typeof value === 'number') {
			return Number.isFinite(value) ? value : undefined;
		}
		if (typeof value === 'string' && value.trim() !== '') {
			const parsed = Number.parseFloat(value.trim());
			return Number.isNaN(parsed) ? undefined : parsed;
		}
		return undefined;
	}

	return value;
}

/**
 * Converts a value returned by an Umbraco property editor UI back into a string (or null)
 * suitable for xStatic's Dictionary<string, string> API payloads.
 */
export function toApiFieldValue(value: unknown): string | null {
	if (value === null || value === undefined) {
		return null;
	}

	if (typeof value === 'string') {
		return value;
	}

	if (typeof value === 'boolean') {
		return value ? 'true' : 'false';
	}

	if (typeof value === 'number') {
		return Number.isFinite(value) ? String(value) : null;
	}

	if (Array.isArray(value)) {
		return value.map((item) => (item === null || item === undefined ? '' : String(item))).join(',');
	}

	return String(value);
}
