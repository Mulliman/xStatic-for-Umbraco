import { afterEach, describe, expect, it } from 'vitest';
import './element.secret-reference-tip';
import { hasSecretField } from './element.secret-reference-tip';
import type XStaticSecretReferenceTipElement from './element.secret-reference-tip';

describe('xstatic-secret-reference-tip', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('explains the reference format and the allowed variables', async () => {
		const el = document.createElement('xstatic-secret-reference-tip') as XStaticSecretReferenceTipElement;
		document.body.appendChild(el);
		await el.updateComplete;

		const text = el.shadowRoot!.textContent ?? '';
		expect(text).toContain('${env:XSTATIC_YOUR_SECRET}');
		expect(text).toContain('XSTATIC_*');
		expect(text).toContain('Secrets and environment variables');
	});

	it('is only needed when a field holds a secret', () => {
		expect(hasSecretField([{ editorUiAlias: 'Umb.PropertyEditorUi.TextBox' }])).toBe(false);
		expect(hasSecretField([{ editorUiAlias: 'xstatic.propertyEditorUi.password' }])).toBe(true);
		expect(hasSecretField(undefined)).toBe(false);
	});
});
