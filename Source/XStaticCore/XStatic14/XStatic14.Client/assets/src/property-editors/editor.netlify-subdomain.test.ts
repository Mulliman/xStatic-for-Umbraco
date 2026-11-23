import { afterEach, describe, expect, it, vi } from 'vitest';
import './editor.netlify-subdomain';
import type XStaticPropertyEditorNetlifySubdomainElement from './editor.netlify-subdomain';

describe('xstatic-property-editor-netlify-subdomain', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('renders the .netlify.app suffix and preview link for the subdomain', async () => {
		const el = document.createElement(
			'xstatic-property-editor-netlify-subdomain',
		) as XStaticPropertyEditorNetlifySubdomainElement;
		el.value = 'my-xstatic-site';
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot?.querySelector('.suffix')?.textContent).toBe('.netlify.app');
		expect(el.shadowRoot?.querySelector('uui-button')?.getAttribute('href')).toBe(
			'https://my-xstatic-site.netlify.app',
		);
	});

	it('updates value and dispatches change event on input', async () => {
		const el = document.createElement(
			'xstatic-property-editor-netlify-subdomain',
		) as XStaticPropertyEditorNetlifySubdomainElement;
		document.body.appendChild(el);
		await el.updateComplete;

		const onChange = vi.fn();
		el.addEventListener('change', onChange);

		const input = el.shadowRoot?.querySelector('uui-input') as unknown as HTMLInputElement;
		input.value = 'demo-site';
		input.dispatchEvent(new Event('input'));

		expect(el.value).toBe('demo-site');
		expect(onChange).toHaveBeenCalledOnce();
	});
});
