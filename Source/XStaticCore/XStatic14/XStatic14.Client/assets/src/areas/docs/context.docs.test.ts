import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import DocsContext, { DOCS_BUNDLE_URL } from './context.docs';
import type { DocModel } from './element.doc';
import type { WikiDocsBundle } from './types.docs';

function createMockHost(): UmbControllerHost {
	return {
		getHostElement: () => document.createElement('div'),
		addUmbController: vi.fn(),
		removeUmbController: vi.fn(),
		hasUmbController: vi.fn(() => false),
		getUmbControllers: vi.fn(() => []),
		provideContext: vi.fn(),
		consumeContext: vi.fn(),
	} as unknown as UmbControllerHost;
}

const mockBundle: WikiDocsBundle = {
	version: '17.3.0',
	gitRef: 'lts/17',
	repoUrl: 'https://github.com/Mulliman/xStatic-for-Umbraco',
	wikiUrl: 'https://github.com/Mulliman/xStatic-for-Umbraco/wiki',
	generatedAt: '2026-11-22T00:00:00.000Z',
	sections: [{ title: '', items: [{ slug: 'Home', label: 'Home' }] }],
	pages: {
		Home: {
			slug: 'Home',
			title: 'Home',
			category: '',
			githubUrl: 'https://github.com/Mulliman/xStatic-for-Umbraco/blob/lts/17/Wiki/Home.md',
			headings: [],
			html: '<p>Hello</p>',
		},
	},
	plugins: [
		{
			id: 'xStatic.Cloudflare',
			author: 'Sam Mullins',
			description: 'Cloudflare Pages and R2 deployer.',
			kind: 'nuget',
			packageUrl: 'https://www.nuget.org/packages/xStatic.Cloudflare',
			gitUrl: 'https://github.com/Mulliman/xStatic-for-Umbraco/tree/lts/17/Source/XStaticCore/XStatic.Cloudflare',
			docSlug: 'Deploying-to-Cloudflare',
		},
	],
};

describe('DocsContext', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('fetches bundled docs and local plugins once and caches across multiple subscriptions', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockBundle),
		});
		vi.stubGlobal('fetch', fetchMock);

		const ctx = new DocsContext(createMockHost());

		let receivedBundle: WikiDocsBundle | undefined;
		let receivedPlugins: Array<DocModel> = [];
		let loaded = false;

		ctx.bundle.subscribe((b) => {
			receivedBundle = b;
		});
		ctx.plugins.subscribe((p) => {
			receivedPlugins = p;
		});
		ctx.docsLoaded.subscribe((l) => {
			loaded = l;
		});
		// Second subscription should not re-trigger fetch
		ctx.bundle.subscribe(() => {});

		await vi.waitFor(() => {
			expect(loaded).toBe(true);
		});

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith(DOCS_BUNDLE_URL);
		expect(receivedBundle?.version).toBe('17.3.0');
		expect(receivedPlugins.length).toBe(1);
		expect(receivedPlugins[0].heading).toBe('xStatic.Cloudflare');
		expect(receivedPlugins[0].docSlug).toBe('Deploying-to-Cloudflare');
		expect(receivedPlugins[0].links.map((l) => l.text)).toEqual(['NuGet', 'Git Repo']);
	});

	it('sets docsError when bundle fetch fails', async () => {
		const fetchMock = vi.fn().mockRejectedValue(new Error('Not found'));
		vi.stubGlobal('fetch', fetchMock);

		const ctx = new DocsContext(createMockHost());

		let docsLoaded = false;
		let docsError = false;

		ctx.docsLoaded.subscribe((v) => {
			docsLoaded = v;
		});
		ctx.docsError.subscribe((v) => {
			docsError = v;
		});

		await vi.waitFor(() => {
			expect(docsLoaded).toBe(true);
		});

		expect(docsError).toBe(true);
	});
});
