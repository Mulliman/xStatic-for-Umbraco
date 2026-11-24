import { afterEach, describe, expect, it, vi } from 'vitest';
import './element.wiki-viewer';
import type WikiViewerElement from './element.wiki-viewer';
import type { WikiDocsBundle } from './types.docs';

const testBundle: WikiDocsBundle = {
	version: '17.3.0',
	gitRef: 'lts/17',
	repoUrl: 'https://github.com/Mulliman/xStatic-for-Umbraco',
	wikiUrl: 'https://mulliman.github.io/xStatic-for-Umbraco/',
	generatedAt: '2026-11-22T00:00:00.000Z',
	sections: [
		{ title: '', items: [{ slug: 'Home', label: 'Home' }] },
		{
			title: 'Getting started',
			items: [{ slug: 'Installation', label: 'Installation' }],
		},
	],
	pages: {
		Home: {
			slug: 'Home',
			title: 'Home',
			category: '',
			githubUrl: 'https://github.com/Mulliman/xStatic-for-Umbraco/blob/lts/17/Wiki/Home.md',
			headings: [
				{ id: 'overview', text: 'Overview', level: 2 },
				{ id: 'pipeline', text: 'Pipeline', level: 2 },
			],
			html:
				'<h2 id="overview">Overview</h2>' +
				'<p>Read <a href="#wiki/Installation" data-wiki-page="Installation">Installation</a>.</p>' +
				'<script>window.__xss = true;</script>' +
				'<h2 id="pipeline">Pipeline</h2>' +
				'<figure class="wiki-diagram" data-diagram="mermaid"><div class="wiki-diagram-svg">' +
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><rect x="0" y="0" width="100" height="40"></rect><text x="10" y="20">Generate</text></svg>' +
				'</div></figure>',
		},
		Installation: {
			slug: 'Installation',
			title: 'Installation',
			category: 'Getting started',
			githubUrl: 'https://github.com/Mulliman/xStatic-for-Umbraco/blob/lts/17/Wiki/Installation.md',
			headings: [{ id: 'nuget', text: 'NuGet install', level: 2 }],
			html:
				'<h2 id="nuget">NuGet install</h2>' +
				'<div class="wiki-code-block" data-lang="powershell">' +
				'<div class="wiki-code-header"><span class="wiki-code-lang">powershell</span>' +
				'<button type="button" class="wiki-copy-btn" data-copy-code>Copy</button></div>' +
				'<pre><code class="language-powershell">dotnet add package xStatic</code></pre></div>',
		},
	},
	plugins: [],
};

describe('xstatic-wiki-viewer', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('renders sidebar, Home page, TOC, preserves Mermaid SVG, and strips scripts', async () => {
		const el = document.createElement('xstatic-wiki-viewer') as WikiViewerElement;
		el.bundle = testBundle;
		document.body.appendChild(el);
		await el.updateComplete;

		const root = el.shadowRoot!;
		expect(root.querySelector('.article-title')?.textContent).toBe('Home');
		expect(root.querySelectorAll('.nav-item').length).toBe(2);
		expect(root.querySelectorAll('.toc-link').length).toBe(2);
		expect(root.querySelector('.wiki-diagram-svg svg')).not.toBeNull();
		expect(root.querySelector('script')).toBeNull();
	});

	it('navigates between pages via internal data-wiki-page links and copies code snippets', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, 'clipboard', {
			value: { writeText },
			configurable: true,
		});

		const el = document.createElement('xstatic-wiki-viewer') as WikiViewerElement;
		el.bundle = testBundle;
		document.body.appendChild(el);
		await el.updateComplete;

		const internalLink = el.shadowRoot!.querySelector('a[data-wiki-page="Installation"]') as HTMLAnchorElement;
		expect(internalLink).not.toBeNull();
		internalLink.click();
		await el.updateComplete;

		expect(el.shadowRoot!.querySelector('.article-title')?.textContent).toBe('Installation');

		const copyBtn = el.shadowRoot!.querySelector('button[data-copy-code]') as HTMLButtonElement;
		expect(copyBtn).not.toBeNull();
		copyBtn.click();

		await vi.waitFor(() => {
			expect(writeText).toHaveBeenCalledWith('dotnet add package xStatic');
		});
	});

	it('filters pages when typing into the search input', async () => {
		const el = document.createElement('xstatic-wiki-viewer') as WikiViewerElement;
		el.bundle = testBundle;
		document.body.appendChild(el);
		await el.updateComplete;

		const input = el.shadowRoot!.querySelector('uui-input')!;
		input.value = 'nuget';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		await el.updateComplete;

		const results = el.shadowRoot!.querySelectorAll('.search-result-btn');
		expect(results.length).toBe(1);
		expect(results[0].textContent).toContain('Installation');
	});
});
