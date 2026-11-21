import { afterEach, describe, expect, it } from 'vitest';
import './element.site-table';
import type SiteTable from './element.site-table';

describe('xstatic-site-table', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('renders one row per item with icon and cell values', async () => {
		const el = document.createElement('xstatic-site-table') as SiteTable;
		el.columns = [{ alias: 'value', name: 'Details' }];
		el.items = [
			{
				id: 'rootPath',
				icon: 'icon-home',
				data: [{ columnAlias: 'value', value: '/home' }],
			},
			{
				id: 'exportType',
				icon: 'icon-brackets',
				data: [{ columnAlias: 'value', value: 'Exports as HTML' }],
			},
		];
		document.body.appendChild(el);
		await el.updateComplete;

		const rows = el.shadowRoot?.querySelectorAll('uui-table-row');
		expect(rows?.length).toBe(2);

		const icons = el.shadowRoot?.querySelectorAll('umb-icon');
		expect(icons?.length).toBe(2);
		expect(icons?.[0].getAttribute('name')).toBe('icon-home');
		expect(rows?.[0].textContent).toContain('/home');
		expect(rows?.[1].textContent).toContain('Exports as HTML');
	});

	it('hides row icons when config.hideIcon is true', async () => {
		const el = document.createElement('xstatic-site-table') as SiteTable;
		el.config = { hideIcon: true };
		el.columns = [{ alias: 'value', name: 'Details' }];
		el.items = [
			{
				id: 'item-1',
				icon: 'icon-home',
				data: [{ columnAlias: 'value', value: 'Row value' }],
			},
		];
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot?.querySelectorAll('umb-icon').length).toBe(0);
	});
});
