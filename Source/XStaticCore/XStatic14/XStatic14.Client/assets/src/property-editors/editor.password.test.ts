import { afterEach, describe, expect, it, vi } from 'vitest';
import './editor.password';
import type XStaticPropertyEditorPasswordElement from './editor.password';

describe('xstatic-property-editor-password', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('toggles password visibility between password and text', async () => {
		const el = document.createElement(
			'xstatic-property-editor-password',
		) as XStaticPropertyEditorPasswordElement;
		el.value = 's3cr3t';
		document.body.appendChild(el);
		await el.updateComplete;

		const input = el.shadowRoot?.querySelector('uui-input') as unknown as HTMLInputElement;
		const toggleButton = el.shadowRoot?.querySelector('uui-button') as HTMLElement;

		expect(input.type).toBe('password');
		expect(toggleButton.textContent?.trim()).toBe('Show');

		toggleButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await el.updateComplete;

		expect(input.type).toBe('text');
		expect(toggleButton.textContent?.trim()).toBe('Hide');
	});

	it('updates value and dispatches change event on input', async () => {
		const el = document.createElement(
			'xstatic-property-editor-password',
		) as XStaticPropertyEditorPasswordElement;
		document.body.appendChild(el);
		await el.updateComplete;

		const onChange = vi.fn();
		el.addEventListener('change', onChange);

		const input = el.shadowRoot?.querySelector('uui-input') as unknown as HTMLInputElement;
		input.value = 'new-password';
		input.dispatchEvent(new Event('input'));

		expect(el.value).toBe('new-password');
		expect(onChange).toHaveBeenCalledOnce();
	});
});
