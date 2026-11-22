import { afterEach, describe, expect, it, vi } from 'vitest';
import { umbConfirmModal } from '@umbraco-cms/backoffice/modal';
import './element.site';
import type SiteElement from './element.site';
import type { SiteApiModel } from '../../api';
import { SITE_CONTEXT_TOKEN } from './context.site';

vi.mock('@umbraco-cms/backoffice/modal', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@umbraco-cms/backoffice/modal')>();
	return {
		...actual,
		umbConfirmModal: vi.fn(),
	};
});

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

	it('escapes targetHostname and renders a valid anchor with rel="noopener noreferrer"', async () => {
		const el = document.createElement('xstatic-site-element') as SiteElement;
		const maliciousHostname = 'example.com"><img src=x onerror=alert(1)>';
		el.site = {
			...sampleSite,
			targetHostname: maliciousHostname,
		};
		document.body.appendChild(el);
		await el.updateComplete;

		const table = el.shadowRoot?.querySelector('xstatic-site-table');
		await (table as { updateComplete?: Promise<unknown> } | null)?.updateComplete;

		const anchor = table?.shadowRoot?.querySelector('a');
		expect(anchor).not.toBeNull();
		expect(anchor?.getAttribute('href')).toBe(`https://${maliciousHostname}`);
		expect(anchor?.getAttribute('target')).toBe('_blank');
		expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
		expect(anchor?.textContent).toBe(maliciousHostname);
		expect(table?.shadowRoot?.querySelector('img')).toBeNull();
	});

	it('handles confirm modal cancellation cleanly without calling delete, clean, or deploy', async () => {
		const mockContext = {
			deleteSite: vi.fn().mockResolvedValue(undefined),
			cleanSite: vi.fn().mockResolvedValue(undefined),
			deploySite: vi.fn().mockResolvedValue(undefined),
		};
		vi.mocked(umbConfirmModal).mockRejectedValue(new Error('cancelled'));

		const SiteCtor = customElements.get('xstatic-site-element')!;
		const consumeSpy = vi
			.spyOn(SiteCtor.prototype as unknown as { consumeContext: (token: unknown, cb: (ctx: unknown) => void) => void }, 'consumeContext')
			.mockImplementation((token, cb) => {
				if (token === SITE_CONTEXT_TOKEN) {
					cb(mockContext);
				}
			});

		try {
			const siteEl = document.createElement('xstatic-site-element') as SiteElement;
			siteEl.site = sampleSite;
			document.body.appendChild(siteEl);
			await siteEl.updateComplete;

			for (const label of ['Delete', 'Clean', 'Deploy']) {
				const btn = siteEl.shadowRoot?.querySelector(`uui-button[label="${label}"]`) as HTMLElement | null;
				expect(btn).not.toBeNull();
				btn!.click();
			}

			await new Promise((r) => setTimeout(r, 20));

			expect(mockContext.deleteSite).not.toHaveBeenCalled();
			expect(mockContext.cleanSite).not.toHaveBeenCalled();
			expect(mockContext.deploySite).not.toHaveBeenCalled();
		} finally {
			consumeSpy.mockRestore();
		}
	});

	it('triggers generate, deploy, and download without artificial 1000ms delays', async () => {
		const mockContext = {
			generateSite: vi.fn().mockResolvedValue(undefined),
			deploySite: vi.fn().mockResolvedValue(undefined),
			downloadSite: vi.fn().mockResolvedValue(undefined),
		};
		vi.mocked(umbConfirmModal).mockResolvedValue(undefined);

		const SiteCtor = customElements.get('xstatic-site-element')!;
		const consumeSpy = vi
			.spyOn(SiteCtor.prototype as unknown as { consumeContext: (token: unknown, cb: (ctx: unknown) => void) => void }, 'consumeContext')
			.mockImplementation((token, cb) => {
				if (token === SITE_CONTEXT_TOKEN) {
					cb(mockContext);
				}
			});

		vi.useFakeTimers();
		try {
			const siteEl = document.createElement('xstatic-site-element') as SiteElement;
			siteEl.site = sampleSite;
			document.body.appendChild(siteEl);
			await siteEl.updateComplete;

			(siteEl.shadowRoot?.querySelector('uui-button[label="Generate"]') as HTMLElement).click();
			await vi.advanceTimersByTimeAsync(0);
			expect(mockContext.generateSite).toHaveBeenCalledWith(sampleSite.id);

			await siteEl.updateComplete;
			(siteEl.shadowRoot?.querySelector('uui-button[label="Deploy"]') as HTMLElement).click();
			await vi.advanceTimersByTimeAsync(0);
			expect(mockContext.deploySite).toHaveBeenCalledWith(sampleSite.id);

			await siteEl.updateComplete;
			(siteEl.shadowRoot?.querySelector('uui-button[label="Download"]') as HTMLElement).click();
			await vi.advanceTimersByTimeAsync(0);
			expect(mockContext.downloadSite).toHaveBeenCalledWith(sampleSite.id);
		} finally {
			vi.useRealTimers();
			consumeSpy.mockRestore();
		}
	});
});
