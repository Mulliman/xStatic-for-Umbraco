import { afterEach, describe, expect, it } from 'vitest';
import './element.doc';
import type DocElement from './element.doc';

describe('xstatic-doc-element', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('renders heading, description, author, and link buttons', async () => {
		const el = document.createElement('xstatic-doc-element') as DocElement;
		el.doc = {
			heading: 'Getting Started',
			description: 'How to configure xStatic',
			author: 'Sam Mullins',
			links: [
				{ href: 'https://example.com/docs', text: 'Read Docs' },
				{ href: 'https://github.com/Mulliman/xStatic-for-Umbraco', text: 'GitHub' },
			],
		};
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot?.textContent).toContain('Getting Started');
		expect(el.shadowRoot?.textContent).toContain('How to configure xStatic');
		expect(el.shadowRoot?.textContent).toContain('Sam Mullins');

		const buttons = el.shadowRoot?.querySelectorAll('uui-button');
		expect(buttons?.length).toBe(2);
		expect(buttons?.[0].getAttribute('href')).toBe('https://example.com/docs');
		expect(buttons?.[1].getAttribute('href')).toBe('https://github.com/Mulliman/xStatic-for-Umbraco');
	});
});
