import { afterEach, describe, expect, it, vi } from 'vitest';
import './editor.password';
import type XStaticPropertyEditorPasswordElement from './editor.password';

describe('xstatic-property-editor-password', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('renders a uui-input-password with the current value', async () => {
		const el = document.createElement(
			'xstatic-property-editor-password',
		) as XStaticPropertyEditorPasswordElement;
		el.value = 's3cr3t';
		el.name = 'Password';
		document.body.appendChild(el);
		await el.updateComplete;

		const input = el.shadowRoot?.querySelector('uui-input-password') as unknown as HTMLInputElement | null;
		expect(input).not.toBeNull();
		expect(input?.value).toBe('s3cr3t');
		expect(input?.getAttribute('autocomplete')).toBe('new-password');
	});

	it('updates value and dispatches change event on input', async () => {
		const el = document.createElement(
			'xstatic-property-editor-password',
		) as XStaticPropertyEditorPasswordElement;
		document.body.appendChild(el);
		await el.updateComplete;

		const onChange = vi.fn();
		el.addEventListener('change', onChange);

		const input = el.shadowRoot?.querySelector('uui-input-password') as unknown as HTMLInputElement;
		input.value = 'new-password';
		input.dispatchEvent(new Event('input'));

		expect(el.value).toBe('new-password');
		expect(onChange).toHaveBeenCalledOnce();
	});
});
