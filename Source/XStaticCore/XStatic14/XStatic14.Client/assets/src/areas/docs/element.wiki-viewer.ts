import { UmbElementMixin } from '@umbraco-cms/backoffice/element-api';
import {
	LitElement,
	css,
	html,
	customElement,
	property,
	state,
	unsafeHTML,
} from '@umbraco-cms/backoffice/external/lit';
import { DOMPurify } from '@umbraco-cms/backoffice/external/dompurify';

import type { WikiDocsBundle, WikiPage } from './types.docs';
import { flattenSidebarOrder, searchWikiDocs } from './wiki-search';

const SANITIZE_CONFIG = {
	USE_PROFILES: { html: true, svg: true, svgFilters: true },
	ADD_TAGS: ['figure', 'figcaption', 'button'],
	ADD_ATTR: [
		'target',
		'rel',
		'loading',
		'data-wiki-page',
		'data-wiki-anchor',
		'data-copy-code',
		'data-lang',
		'data-diagram',
		'viewBox',
		'markerWidth',
		'markerHeight',
		'refX',
		'refY',
		'orient',
		'markerUnits',
		'marker-end',
		'marker-start',
		'stroke-dasharray',
		'stroke-linecap',
		'stroke-linejoin',
		'stroke-width',
		'dominant-baseline',
		'text-anchor',
		'font-size',
		'font-weight',
		'font-family',
		'aria-hidden',
	],
};

const BLOCKED_TAGS = new Set(['script', 'iframe', 'object', 'embed', 'style', 'link', 'meta', 'base']);

let cachedDomPurifyWorks: boolean | undefined;

function isDomPurifyFunctional(): boolean {
	if (cachedDomPurifyWorks === undefined) {
		cachedDomPurifyWorks =
			DOMPurify.isSupported && DOMPurify.sanitize('<p>ok</p><script>x</script>') === '<p>ok</p>';
	}
	return cachedDomPurifyWorks;
}

function sanitizeWikiHtml(rawHtml: string): string {
	if (isDomPurifyFunctional()) {
		return DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG);
	}

	const tpl = document.createElement('template');
	tpl.innerHTML = rawHtml;
	const walk = (root: ParentNode) => {
		for (const el of Array.from(root.children)) {
			if (BLOCKED_TAGS.has(el.tagName.toLowerCase())) {
				el.remove();
				continue;
			}
			for (const attr of Array.from(el.attributes)) {
				const name = attr.name.toLowerCase();
				if (name.startsWith('on') || ((name === 'href' || name === 'src') && /^\s*javascript:/i.test(attr.value))) {
					el.removeAttribute(attr.name);
				}
			}
			walk(el);
		}
	};
	walk(tpl.content);
	return tpl.innerHTML;
}

@customElement('xstatic-wiki-viewer')
export class WikiViewerElement extends UmbElementMixin(LitElement) {
	@property({ type: Object, attribute: false })
	bundle?: WikiDocsBundle;

	@property({ type: String })
	initialSlug?: string;

	@state()
	private _activeSlug = 'Home';

	@state()
	private _searchQuery = '';

	@state()
	private _history: Array<string> = ['Home'];

	@state()
	private _historyIndex = 0;

	protected override updated(changedProperties: Map<string, unknown>) {
		if (
			(changedProperties.has('initialSlug') || changedProperties.has('bundle')) &&
			this.initialSlug &&
			this.bundle?.pages[this.initialSlug] &&
			this.initialSlug !== this._activeSlug
		) {
			this.navigateToPage(this.initialSlug);
		}
	}

	public navigateToPage(slug: string, anchor?: string) {
		if (!this.bundle?.pages[slug]) return;

		if (slug !== this._activeSlug) {
			const nextHistory = this._history.slice(0, this._historyIndex + 1);
			nextHistory.push(slug);
			this._history = nextHistory;
			this._historyIndex = nextHistory.length - 1;
			this._activeSlug = slug;
		}

		void this.updateComplete.then(() => {
			if (anchor) {
				this.#scrollToAnchor(anchor);
			} else {
				const articlePane = this.shadowRoot?.querySelector('.reader-pane');
				if (articlePane) {
					articlePane.scrollTop = 0;
				}
			}
		});
	}

	#goBack() {
		if (this._historyIndex <= 0) return;
		this._historyIndex -= 1;
		this._activeSlug = this._history[this._historyIndex];
	}

	#goForward() {
		if (this._historyIndex >= this._history.length - 1) return;
		this._historyIndex += 1;
		this._activeSlug = this._history[this._historyIndex];
	}

	#scrollToAnchor(anchor: string) {
		const root = this.shadowRoot;
		if (!root) return;
		const target = root.getElementById(anchor);
		if (target && typeof target.scrollIntoView === 'function') {
			target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	#onSearchInput(event: Event) {
		const target = event.target as HTMLInputElement | null;
		this._searchQuery = target?.value ?? '';
	}

	#clearSearch() {
		this._searchQuery = '';
	}

	#onArticleClick(event: MouseEvent) {
		const path = event.composedPath();

		for (const node of path) {
			if (!(node instanceof HTMLElement)) continue;

			if (node.matches('button[data-copy-code]')) {
				event.preventDefault();
				void this.#copyCodeBlock(node);
				return;
			}

			if (node.matches('a[data-wiki-page]')) {
				event.preventDefault();
				const slug = node.getAttribute('data-wiki-page');
				const anchor = node.getAttribute('data-wiki-anchor') ?? undefined;
				if (slug) {
					this.navigateToPage(slug, anchor);
				}
				return;
			}

			if (node.matches('a[data-wiki-anchor]')) {
				event.preventDefault();
				const anchor = node.getAttribute('data-wiki-anchor');
				if (anchor) {
					this.#scrollToAnchor(anchor);
				}
				return;
			}
		}
	}

	async #copyCodeBlock(button: HTMLElement) {
		const block = button.closest('.wiki-code-block');
		const codeEl = block?.querySelector('pre code');
		const text = codeEl?.textContent ?? '';
		if (!text) return;

		try {
			await navigator.clipboard?.writeText(text);
			const original = button.textContent ?? 'Copy';
			button.textContent = 'Copied';
			setTimeout(() => {
				button.textContent = original;
			}, 1600);
		} catch {
			// Clipboard API may be unavailable in non-secure contexts
		}
	}

	#getCurrentPage(): WikiPage | undefined {
		if (!this.bundle) return undefined;
		return this.bundle.pages[this._activeSlug] ?? this.bundle.pages['Home'] ?? Object.values(this.bundle.pages)[0];
	}

	render() {
		if (!this.bundle) {
			return html`<div class="empty">No documentation bundle available.</div>`;
		}

		const page = this.#getCurrentPage();
		const orderedPages = flattenSidebarOrder(this.bundle);
		const currentIndex = page ? orderedPages.findIndex((item) => item.slug === page.slug) : -1;
		const prevPage = currentIndex > 0 ? orderedPages[currentIndex - 1] : undefined;
		const nextPage = currentIndex >= 0 && currentIndex < orderedPages.length - 1 ? orderedPages[currentIndex + 1] : undefined;

		const isSearching = this._searchQuery.trim().length > 0;
		const searchResults = isSearching ? searchWikiDocs(this.bundle, this._searchQuery) : [];

		return html`
			<div class="wiki-shell">
				<aside class="sidebar" aria-label="Documentation navigation">
					<div class="search-box">
						<uui-input
							label="Search documentation"
							placeholder="Search docs..."
							.value=${this._searchQuery}
							@input=${this.#onSearchInput}
						>
							<uui-icon name="icon-search" slot="prepend"></uui-icon>
							${isSearching
								? html`
									<uui-button
										slot="append"
										compact
										look="placeholder"
										label="Clear search"
										@click=${this.#clearSearch}
									>
										&times;
									</uui-button>
								`
								: ''}
						</uui-input>
					</div>

					<div class="sidebar-scroll">
						${isSearching
							? this.#renderSearchResults(searchResults)
							: this.#renderSidebarNav(page?.slug)}
					</div>
				</aside>

				<section class="reader-pane" aria-label="Documentation article">
					${page ? this.#renderPage(page, prevPage, nextPage) : html`<p class="empty">Select a page from the sidebar.</p>`}
				</section>
			</div>
		`;
	}

	#renderSearchResults(results: ReturnType<typeof searchWikiDocs>) {
		if (results.length === 0) {
			return html`
				<div class="search-empty">
					No pages match "<strong>${this._searchQuery.trim()}</strong>".
				</div>
			`;
		}

		return html`
			<div class="search-count">${results.length} ${results.length === 1 ? 'result' : 'results'}</div>
			<ul class="search-results">
				${results.map(
					(result) => html`
						<li>
							<button
								type="button"
								class="search-result-btn ${result.slug === this._activeSlug ? 'active' : ''}"
								@click=${() => this.navigateToPage(result.slug)}
							>
								<span class="search-result-title">${result.title}</span>
								${result.category ? html`<span class="search-result-cat">${result.category}</span>` : ''}
								${result.matchedHeading
									? html`<span class="search-result-heading"># ${result.matchedHeading}</span>`
									: ''}
								${result.snippet ? html`<span class="search-result-snippet">${result.snippet}</span>` : ''}
							</button>
						</li>
					`,
				)}
			</ul>
		`;
	}

	#renderSidebarNav(activeSlug?: string) {
		if (!this.bundle) return null;

		return html`
			<nav class="nav-tree">
				${this.bundle.sections.map(
					(section) => html`
						<div class="nav-section">
							${section.title ? html`<div class="nav-section-title">${section.title}</div>` : ''}
							<ul class="nav-list">
								${section.items.map(
									(item) => html`
										<li>
											<button
												type="button"
												class="nav-item ${item.slug === activeSlug ? 'active' : ''}"
												aria-current=${item.slug === activeSlug ? 'page' : 'false'}
												@click=${() => this.navigateToPage(item.slug)}
											>
												${item.label}
											</button>
										</li>
									`,
								)}
							</ul>
						</div>
					`,
				)}
			</nav>
		`;
	}

	#renderPage(
		page: WikiPage,
		prevPage?: { slug: string; label: string },
		nextPage?: { slug: string; label: string },
	) {
		const sanitizedHtml = sanitizeWikiHtml(page.html);
		const tocHeadings = page.headings.filter((h) => h.level === 2);

		return html`
			<div class="article-container">
				<header class="article-header">
					<div class="article-meta">
						<div class="history-nav">
							<uui-button
								compact
								look="secondary"
								label="Previous viewed page"
								?disabled=${this._historyIndex <= 0}
								@click=${this.#goBack}
							>
								&larr;
							</uui-button>
							<uui-button
								compact
								look="secondary"
								label="Next viewed page"
								?disabled=${this._historyIndex >= this._history.length - 1}
								@click=${this.#goForward}
							>
								&rarr;
							</uui-button>
						</div>
						${page.category ? html`<uui-tag look="secondary">${page.category}</uui-tag>` : ''}
					</div>
					<div class="article-title-row">
						<h2 class="article-title">${page.title}</h2>
						<uui-button
							compact
							look="outline"
							label="View on GitHub"
							href=${page.githubUrl}
							target="_blank"
							rel="noopener noreferrer"
						>
							View on GitHub
						</uui-button>
					</div>
				</header>

				${tocHeadings.length >= 2
					? html`
						<nav class="page-toc" aria-label="On this page">
							<span class="toc-label">On this page:</span>
							<div class="toc-links">
								${tocHeadings.map(
									(h) => html`
										<button
											type="button"
											class="toc-link"
											@click=${() => this.#scrollToAnchor(h.id)}
										>
											${h.text}
										</button>
									`,
								)}
							</div>
						</nav>
					`
					: ''}

				<article class="wiki-prose" @click=${this.#onArticleClick}>
					${unsafeHTML(sanitizedHtml)}
				</article>

				${prevPage || nextPage
					? html`
						<footer class="article-footer">
							<div>
								${prevPage
									? html`
										<uui-button
											look="secondary"
											label=${`Previous: ${prevPage.label}`}
											@click=${() => this.navigateToPage(prevPage.slug)}
										>
											&larr; ${prevPage.label}
										</uui-button>
									`
									: ''}
							</div>
							<div>
								${nextPage
									? html`
										<uui-button
											look="secondary"
											label=${`Next: ${nextPage.label}`}
											@click=${() => this.navigateToPage(nextPage.slug)}
										>
											${nextPage.label} &rarr;
										</uui-button>
									`
									: ''}
							</div>
						</footer>
					`
					: ''}
			</div>
		`;
	}

	static styles = css`
		:host {
			display: block;
			height: 100%;
		}

		.wiki-shell {
			display: grid;
			grid-template-columns: 270px minmax(0, 1fr);
			gap: var(--uui-size-space-5, 20px);
			align-items: start;
		}

		@media (max-width: 900px) {
			.wiki-shell {
				grid-template-columns: 1fr;
			}
		}

		.sidebar {
			position: sticky;
			top: var(--uui-size-space-4, 16px);
			max-height: calc(100vh - 180px);
			display: flex;
			flex-direction: column;
			background: var(--uui-color-surface, #ffffff);
			border: 1px solid var(--uui-color-border, #d8d7d9);
			border-radius: var(--uui-border-radius, 3px);
			overflow: hidden;
		}

		@media (max-width: 900px) {
			.sidebar {
				position: static;
				max-height: 360px;
			}
		}

		.search-box {
			padding: var(--uui-size-space-3, 12px);
			border-bottom: 1px solid var(--uui-color-border, #d8d7d9);
			background: var(--uui-color-surface-alt, #f9f9fb);
		}

		.search-box uui-input {
			width: 100%;
		}

		.sidebar-scroll {
			overflow-y: auto;
			padding: var(--uui-size-space-3, 12px);
			flex: 1;
		}

		.nav-section {
			margin-bottom: var(--uui-size-space-4, 16px);
		}

		.nav-section:last-child {
			margin-bottom: 0;
		}

		.nav-section-title {
			font-size: 11px;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			color: var(--uui-color-text-alt, #6b7280);
			padding: 4px 8px;
		}

		.nav-list,
		.search-results {
			list-style: none;
			margin: 0;
			padding: 0;
		}

		.nav-item {
			display: block;
			width: 100%;
			text-align: left;
			background: transparent;
			border: none;
			border-radius: var(--uui-border-radius, 3px);
			padding: 6px 8px;
			font: inherit;
			font-size: 13px;
			color: var(--uui-color-text, #1b264f);
			cursor: pointer;
			transition: background-color 120ms ease;
		}

		.nav-item:hover {
			background: var(--uui-color-surface-emphasis, #f3f3f5);
		}

		.nav-item.active {
			background: var(--uui-color-selected, #3544b1);
			color: var(--uui-color-selected-contrast, #ffffff);
			font-weight: 600;
		}

		.search-count {
			font-size: 12px;
			color: var(--uui-color-text-alt, #6b7280);
			margin-bottom: 8px;
			padding: 0 4px;
		}

		.search-empty {
			font-size: 13px;
			color: var(--uui-color-text-alt, #6b7280);
			padding: 12px 4px;
		}

		.search-result-btn {
			display: flex;
			flex-direction: column;
			gap: 2px;
			width: 100%;
			text-align: left;
			background: transparent;
			border: 1px solid transparent;
			border-radius: var(--uui-border-radius, 3px);
			padding: 8px;
			margin-bottom: 6px;
			cursor: pointer;
			font: inherit;
			color: var(--uui-color-text, #1b264f);
		}

		.search-result-btn:hover {
			background: var(--uui-color-surface-emphasis, #f3f3f5);
			border-color: var(--uui-color-border, #d8d7d9);
		}

		.search-result-btn.active {
			border-color: var(--uui-color-selected, #3544b1);
			background: var(--uui-color-surface-alt, #f3f3f5);
		}

		.search-result-title {
			font-size: 13px;
			font-weight: 600;
		}

		.search-result-cat {
			font-size: 11px;
			color: var(--uui-color-text-alt, #6b7280);
		}

		.search-result-heading {
			font-size: 11px;
			color: var(--uui-color-interactive, #3544b1);
		}

		.search-result-snippet {
			font-size: 12px;
			color: var(--uui-color-text-alt, #6b7280);
			display: -webkit-box;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
			overflow: hidden;
		}

		.reader-pane {
			min-width: 0;
			background: var(--uui-color-surface, #ffffff);
			border: 1px solid var(--uui-color-border, #d8d7d9);
			border-radius: var(--uui-border-radius, 3px);
			padding: var(--uui-size-space-6, 24px) var(--uui-size-space-6, 28px);
		}

		.article-container {
			max-width: 920px;
		}

		.article-header {
			border-bottom: 1px solid var(--uui-color-border, #d8d7d9);
			padding-bottom: var(--uui-size-space-4, 16px);
			margin-bottom: var(--uui-size-space-5, 20px);
		}

		.article-meta {
			display: flex;
			align-items: center;
			gap: var(--uui-size-space-3, 12px);
			margin-bottom: var(--uui-size-space-2, 8px);
		}

		.history-nav {
			display: inline-flex;
			gap: 4px;
		}

		.article-title-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: var(--uui-size-space-4, 16px);
			flex-wrap: wrap;
		}

		.article-title {
			margin: 0;
			font-size: 1.65rem;
			line-height: 1.25;
			color: var(--uui-color-text, #1b264f);
		}

		.page-toc {
			display: flex;
			align-items: baseline;
			flex-wrap: wrap;
			gap: 6px 12px;
			padding: 10px 14px;
			margin-bottom: var(--uui-size-space-5, 20px);
			background: var(--uui-color-surface-alt, #f9f9fb);
			border: 1px solid var(--uui-color-border, #d8d7d9);
			border-radius: var(--uui-border-radius, 3px);
			font-size: 12.5px;
		}

		.toc-label {
			font-weight: 600;
			color: var(--uui-color-text-alt, #6b7280);
		}

		.toc-links {
			display: flex;
			flex-wrap: wrap;
			gap: 4px 12px;
		}

		.toc-link {
			background: none;
			border: none;
			padding: 0;
			font: inherit;
			color: var(--uui-color-interactive, #3544b1);
			cursor: pointer;
			text-decoration: none;
		}

		.toc-link:hover {
			text-decoration: underline;
		}

		/* Markdown prose typography */
		.wiki-prose {
			color: var(--uui-color-text, #1b264f);
			font-size: 14.5px;
			line-height: 1.65;
		}

		.wiki-prose h2 {
			margin: 1.8em 0 0.6em;
			padding-bottom: 0.25em;
			border-bottom: 1px solid var(--uui-color-border, #d8d7d9);
			font-size: 1.3rem;
			line-height: 1.3;
		}

		.wiki-prose h3 {
			margin: 1.4em 0 0.5em;
			font-size: 1.08rem;
			line-height: 1.35;
		}

		.wiki-prose h4 {
			margin: 1.2em 0 0.4em;
			font-size: 0.98rem;
		}

		.wiki-prose p {
			margin: 0 0 1em;
		}

		.wiki-prose ul,
		.wiki-prose ol {
			margin: 0 0 1em;
			padding-left: 1.5em;
		}

		.wiki-prose li {
			margin-bottom: 0.35em;
		}

		.wiki-prose a {
			color: var(--uui-color-interactive, #3544b1);
			text-decoration: underline;
			text-underline-offset: 2px;
		}

		.wiki-prose a:hover {
			color: var(--uui-color-interactive-emphasis, #2152a3);
		}

		.wiki-prose blockquote {
			margin: 1em 0;
			padding: 10px 16px;
			border-left: 3px solid var(--uui-color-interactive, #3544b1);
			background: var(--uui-color-surface-alt, #f9f9fb);
			color: var(--uui-color-text-alt, #515054);
		}

		.wiki-prose blockquote p:last-child {
			margin-bottom: 0;
		}

		.wiki-prose code {
			font-family: var(--uui-font-monospace, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
			font-size: 0.88em;
			background: var(--uui-color-surface-alt, #f3f3f5);
			border: 1px solid var(--uui-color-border, #e2e2e6);
			border-radius: 3px;
			padding: 0.1em 0.35em;
		}

		.wiki-prose .wiki-code-block {
			margin: 1em 0 1.25em;
			border: 1px solid var(--uui-color-border, #d8d7d9);
			border-radius: var(--uui-border-radius, 4px);
			overflow: hidden;
			background: var(--uui-color-surface-alt, #f6f6f9);
		}

		.wiki-prose .wiki-code-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 4px 10px;
			border-bottom: 1px solid var(--uui-color-border, #d8d7d9);
			background: var(--uui-color-surface-emphasis, #ececf0);
			font-size: 11.5px;
		}

		.wiki-prose .wiki-code-lang {
			font-family: var(--uui-font-monospace, ui-monospace, monospace);
			text-transform: lowercase;
			color: var(--uui-color-text-alt, #515054);
		}

		.wiki-prose .wiki-copy-btn {
			background: var(--uui-color-surface, #ffffff);
			color: var(--uui-color-text, #1b264f);
			border: 1px solid var(--uui-color-border, #d8d7d9);
			border-radius: 3px;
			padding: 2px 8px;
			font: inherit;
			font-size: 11px;
			cursor: pointer;
		}

		.wiki-prose .wiki-copy-btn:hover {
			border-color: var(--uui-color-interactive, #3544b1);
			color: var(--uui-color-interactive, #3544b1);
		}

		.wiki-prose pre {
			margin: 0;
			padding: 12px 14px;
			overflow-x: auto;
			line-height: 1.5;
		}

		.wiki-prose pre code {
			background: transparent;
			border: none;
			padding: 0;
			font-size: 12.5px;
		}

		.wiki-prose .wiki-table-wrap {
			overflow-x: auto;
			margin: 1em 0 1.25em;
		}

		.wiki-prose table {
			width: 100%;
			border-collapse: collapse;
			font-size: 13.5px;
		}

		.wiki-prose th,
		.wiki-prose td {
			text-align: left;
			padding: 8px 12px;
			border: 1px solid var(--uui-color-border, #d8d7d9);
			vertical-align: top;
		}

		.wiki-prose th {
			background: var(--uui-color-surface-alt, #f6f6f9);
			font-weight: 600;
		}

		/* Beautiful-Mermaid SVGs with live Umbraco UUI theme variables */
		.wiki-prose .wiki-diagram {
			margin: 1.25em 0;
			padding: 16px;
			background: var(--uui-color-surface-alt, #f9f9fb);
			border: 1px solid var(--uui-color-border, #d8d7d9);
			border-radius: var(--uui-border-radius, 4px);
		}

		.wiki-prose .wiki-diagram-svg {
			overflow-x: auto;
			text-align: center;
		}

		.wiki-prose .wiki-diagram-svg svg {
			max-width: 100%;
			height: auto;
			--bg: var(--uui-color-surface, #ffffff);
			--fg: var(--uui-color-text, #1b264f);
			--line: var(--uui-color-border-emphasis, #8b8b96);
			--accent: var(--uui-color-interactive, #3544b1);
			--muted: var(--uui-color-text-alt, #6b7280);
			--surface: var(--uui-color-surface, #ffffff);
			--border: var(--uui-color-border-emphasis, #a1a1aa);
			--_text: var(--fg);
			--_text-sec: var(--muted);
			--_text-muted: var(--muted);
			--_text-faint: color-mix(in srgb, var(--fg) 25%, var(--bg));
			--_line: var(--line);
			--_arrow: var(--accent);
			--_node-fill: var(--surface);
			--_node-stroke: var(--border);
			--_group-fill: var(--bg);
			--_group-hdr: color-mix(in srgb, var(--fg) 5%, var(--bg));
			--_inner-stroke: color-mix(in srgb, var(--fg) 12%, var(--bg));
			--_key-badge: color-mix(in srgb, var(--fg) 10%, var(--bg));
		}

		.wiki-prose .wiki-diagram-svg svg text {
			font-family: var(--uui-font-family, system-ui, -apple-system, sans-serif);
		}

		/* Video cards (replaces bundled 1.68 MB YouTube thumbnail PNGs) */
		.wiki-prose a.wiki-video-card {
			display: flex;
			align-items: center;
			gap: 14px;
			padding: 14px 16px;
			margin: 0.75em 0 1.25em;
			border: 1px solid var(--uui-color-border, #d8d7d9);
			border-radius: var(--uui-border-radius, 4px);
			background: var(--uui-color-surface-alt, #f9f9fb);
			text-decoration: none;
			color: var(--uui-color-text, #1b264f);
			transition: border-color 120ms ease, background-color 120ms ease;
		}

		.wiki-prose a.wiki-video-card:hover {
			border-color: var(--uui-color-interactive, #3544b1);
			background: var(--uui-color-surface-emphasis, #f0f0f5);
		}

		.wiki-prose .wiki-video-icon {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 44px;
			height: 44px;
			border-radius: 50%;
			background: var(--uui-color-interactive, #3544b1);
			color: #ffffff;
			flex-shrink: 0;
		}

		.wiki-prose .wiki-video-body {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}

		.wiki-prose .wiki-video-title {
			font-weight: 600;
			font-size: 14px;
		}

		.wiki-prose .wiki-video-cta {
			font-size: 12.5px;
			color: var(--uui-color-interactive, #3544b1);
		}

		.article-footer {
			display: flex;
			justify-content: space-between;
			gap: var(--uui-size-space-4, 16px);
			flex-wrap: wrap;
			margin-top: var(--uui-size-space-6, 28px);
			padding-top: var(--uui-size-space-4, 16px);
			border-top: 1px solid var(--uui-color-border, #d8d7d9);
		}

		.empty {
			padding: var(--uui-size-space-5, 20px);
			color: var(--uui-color-text-alt, #6b7280);
		}
	`;
}

export default WikiViewerElement;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-wiki-viewer': WikiViewerElement;
	}
}
