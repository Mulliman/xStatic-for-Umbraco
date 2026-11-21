import { afterEach, describe, expect, it } from 'vitest';
import './element.site';
import type SiteElement from './element.site';
import type { SiteApiModel } from '../../api';

describe('xstatic-site-element', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	const sampleSite: SiteApiModel = {
		id: 1,
		name: 'Marketing Site',
		rootNode: '00000000-0000-0000-0000-000000000001',
		rootPath: '/home',
		cultures: ['en-US', 'fr-FR'],
		exportFormat: 1,
		exportTypeName: 'Static HTML',
		autoPublish: true,
		lastRun: '2026-06-15T12:00:00Z',
		lastDeployed: null,
		targetHostname: 'example.com',
		folderSize: '1.2 MB',
		deploymentTarget: { id: 2, name: 'Netlify' } as never,
	};

	it('renders nothing when site is undefined', async () => {
		const el = document.createElement('xstatic-site-element') as SiteElement;
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot?.querySelector('uui-box')).toBeNull();
	});

	it('renders site details and action buttons for a configured site', async () => {
		const el = document.createElement('xstatic-site-element') as SiteElement;
		el.site = sampleSite;
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot?.textContent).toContain('Marketing Site');

		const buttonLabels = Array.from(el.shadowRoot?.querySelectorAll('uui-button') ?? []).map((b) =>
			b.getAttribute('label'),
		);
		expect(buttonLabels).toEqual(
			expect.arrayContaining(['Edit', 'Delete', 'Generate', 'Deploy', 'Clean', 'Download']),
		);
	});

	it('builds table items from site metadata', () => {
		const el = document.createElement('xstatic-site-element') as SiteElement;
		el.site = sampleSite;

		const items = el.getSiteTable();
		const byId = new Map(items.map((item) => [item.id, item.data[0].value]));

		expect(byId.get('rootPath')).toBe('/home');
		expect(byId.get('cultures')).toBe('Cultures: en-US | fr-FR');
		expect(byId.get('exportType')).toBe('Exports as Static HTML');
		expect(byId.get('lastDeployed')).toBe('This site has never been deployed.');
		expect(byId.get('folder')).toBe('Size: 1.2 MB');
	});

	it('renders the running task view with xstatic-loader when runningTask is set', async () => {
		const el = document.createElement('xstatic-site-element') as SiteElement;
		el.site = sampleSite;
		el.runningTask = {
			task: 'Generating',
			startTime: new Date(),
			expectedDuration: 15,
			currentSeconds: 0,
		};
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot?.querySelector('h2')?.textContent).toBe('Generating...');
		expect(el.shadowRoot?.querySelector('xstatic-loader')).not.toBeNull();
	});
});
