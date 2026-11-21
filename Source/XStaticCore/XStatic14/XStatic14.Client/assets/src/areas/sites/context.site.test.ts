import { afterEach, describe, expect, it, vi } from 'vitest';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { customElement } from '@umbraco-cms/backoffice/external/lit';
import { V1Service } from '../../api';
import SiteContext from './context.site';

vi.mock('@umbraco-cms/backoffice/resources', () => ({
	tryExecute: vi.fn((_host: unknown, promise: Promise<unknown>) => promise),
}));

vi.mock('@umbraco-cms/backoffice/utils', () => ({
	blobDownload: vi.fn(),
}));

@customElement('test-site-context-host')
class TestSiteContextHost extends UmbLitElement {}

describe('SiteContext', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	function createHostAndContext() {
		const host = document.createElement('test-site-context-host') as TestSiteContextHost;
		document.body.appendChild(host);
		const ctx = new SiteContext(host);
		return { host, ctx };
	}

	it('creates a site and refreshes the site list', async () => {
		const created = { id: 1, name: 'My Site' };
		const createSpy = vi
			.spyOn(V1Service, 'postApiV1XstaticSitesCreate')
			.mockResolvedValue(created as never);
		const getAllSpy = vi
			.spyOn(V1Service, 'getApiV1XstaticSitesGetAll')
			.mockResolvedValue([created] as never);

		const { ctx } = createHostAndContext();
		const result = await ctx.createSite({ id: 0, name: 'My Site' } as never);

		expect(createSpy).toHaveBeenCalledOnce();
		expect(getAllSpy).toHaveBeenCalledOnce();
		expect(result).toEqual(created);
	});

	it('surfaces a danger notification when generateSite returns an exception', async () => {
		const peek = vi.fn();
		vi.spyOn(V1Service, 'postApiV1XstaticGenerateGenerateSite').mockResolvedValue({
			wasSuccessful: false,
			exception: 'Build exploded',
			results: [],
		} as never);
		vi.spyOn(V1Service, 'getApiV1XstaticSitesGetAll').mockResolvedValue([] as never);

		const { ctx } = createHostAndContext();
		vi.spyOn(ctx, 'getContext').mockResolvedValue({ peek } as never);

		await ctx.generateSite(42);

		expect(peek).toHaveBeenCalledWith('danger', {
			data: { headline: 'Generation failed', message: 'Build exploded' },
		});
	});

	it('surfaces a warning notification with up to 5 item failures when generateSite partially fails', async () => {
		const peek = vi.fn();
		const failures = Array.from({ length: 7 }, (_, i) => ({
			wasSuccessful: false,
			item: `/page-${i + 1}`,
			message: '404 Not Found',
		}));

		vi.spyOn(V1Service, 'postApiV1XstaticGenerateGenerateSite').mockResolvedValue({
			wasSuccessful: false,
			results: failures,
		} as never);
		vi.spyOn(V1Service, 'getApiV1XstaticSitesGetAll').mockResolvedValue([] as never);

		const { ctx } = createHostAndContext();
		vi.spyOn(ctx, 'getContext').mockResolvedValue({ peek } as never);

		await ctx.generateSite(7);

		expect(peek).toHaveBeenCalledWith('warning', {
			data: {
				headline: 'Site generated with 7 problems',
				message: expect.stringContaining('…and 2 more'),
			},
		});
	});

	it('does not notify when generateSite succeeds', async () => {
		const peek = vi.fn();
		vi.spyOn(V1Service, 'postApiV1XstaticGenerateGenerateSite').mockResolvedValue({
			wasSuccessful: true,
			results: [],
		} as never);
		vi.spyOn(V1Service, 'getApiV1XstaticSitesGetAll').mockResolvedValue([] as never);

		const { ctx } = createHostAndContext();
		vi.spyOn(ctx, 'getContext').mockResolvedValue({ peek } as never);

		await ctx.generateSite(1);

		expect(peek).not.toHaveBeenCalled();
	});
});
