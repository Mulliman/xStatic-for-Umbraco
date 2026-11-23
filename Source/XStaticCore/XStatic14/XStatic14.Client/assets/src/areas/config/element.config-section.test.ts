import { afterEach, describe, expect, it } from 'vitest';
import './element.config-section';
import type ConfigSectionElement from './element.config-section';

describe('xstatic-config-section-element', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('renders heading, description, and installed component rows', async () => {
		const el = document.createElement('xstatic-config-section-element') as ConfigSectionElement;
		el.heading = 'Generators';
		el.description = 'Available static site generators';
		el.icon = 'icon-settings';
		el.values = ['StaticHtmlSiteGenerator', 'BasicJsonApiGenerator'];
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot?.textContent).toContain('Generators');
		expect(el.shadowRoot?.textContent).toContain('Available static site generators');

		const table = el.shadowRoot?.querySelector('xstatic-site-table');
		expect(table).not.toBeNull();
		expect(table?.items.length).toBe(2);
		expect(table?.items[0].icon).toBe('icon-settings');
		expect(table?.items[0].data[0].value).toBe('StaticHtmlSiteGenerator');
	});
});
