import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { css, html, customElement, state } from '@umbraco-cms/backoffice/external/lit';
import { DOCS_CONTEXT_TOKEN } from './context.docs';
import type { DocModel } from './element.doc';
import type { WikiDocsBundle } from './types.docs';

import './element.doc';
import './element.wiki-viewer';

type ActiveTab = 'docs' | 'plugins';

const DEFAULT_WIKI_URL = 'https://mulliman.github.io/xStatic-for-Umbraco/';

@customElement('xstatic-docs-grid')
class DocsGrid extends UmbLitElement {
	@state()
	private _activeTab: ActiveTab = 'docs';

	@state()
	private _selectedDocSlug?: string;

	@state()
	private _bundle?: WikiDocsBundle;

	@state()
	private _docsLoaded = false;

	@state()
	private _docsError = false;

	@state()
	private _plugins: Array<DocModel> = [];

	constructor() {
		super();

		this.consumeContext(DOCS_CONTEXT_TOKEN, (context) => {
			if (!context) return;

			this.observe(context.bundle, (bundle) => {
				this._bundle = bundle;
			});

			this.observe(context.docsLoaded, (loaded) => {
				this._docsLoaded = loaded;
			});

			this.observe(context.docsError, (hasError) => {
				this._docsError = hasError;
			});

			this.observe(context.plugins, (plugins) => {
				this._plugins = plugins;
			});
		});
	}

	#selectTab(tab: ActiveTab) {
		this._activeTab = tab;
	}

	#onOpenWikiPage(event: CustomEvent<{ slug: string }>) {
		const slug = event.detail?.slug;
		if (!slug) return;
		this._selectedDocSlug = slug;
		this._activeTab = 'docs';
	}

	render() {
		const wikiUrl = this._bundle?.wikiUrl ?? DEFAULT_WIKI_URL;
		const version = this._bundle?.version;

		return html`
			<div class="docs-toolbar">
				<uui-tab-group class="sub-tabs">
					<uui-tab
						label="Documentation"
						?active=${this._activeTab === 'docs'}
						@click=${() => this.#selectTab('docs')}
					>
						Documentation
					</uui-tab>
					<uui-tab
						label="Plugins"
						?active=${this._activeTab === 'plugins'}
						@click=${() => this.#selectTab('plugins')}
					>
						Plugins ${this._plugins.length > 0 ? html`(${this._plugins.length})` : ''}
					</uui-tab>
				</uui-tab-group>

				<div class="toolbar-meta">
					${version ? html`<uui-tag look="secondary">v${version}</uui-tag>` : ''}
					<uui-button
						compact
						look="outline"
						label="Open the docs site"
						href=${wikiUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						Open the docs site
					</uui-button>
				</div>
			</div>

			${this._activeTab === 'docs' ? this.#renderDocsView(wikiUrl) : this.#renderPluginsView()}
		`;
	}

	#renderDocsView(wikiUrl: string) {
		if (!this._docsLoaded) {
			return html`<div class="status-box"><uui-loader-bar></uui-loader-bar><p>Loading documentation...</p></div>`;
		}

		if (this._docsError || !this._bundle) {
			return html`
				<uui-box headline="Documentation">
					<p>The bundled xStatic documentation could not be loaded.</p>
					<uui-button
						look="primary"
						label="Open the docs site"
						href=${wikiUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						Open the docs site
					</uui-button>
				</uui-box>
			`;
		}

		return html`
			<xstatic-wiki-viewer
				.bundle=${this._bundle}
				.initialSlug=${this._selectedDocSlug}
			></xstatic-wiki-viewer>
		`;
	}

	#renderPluginsView() {
		return html`
			<div class="plugins-section" @xstatic-open-wiki-page=${this.#onOpenWikiPage}>
				<h2>
					Plugins -
					<span>Official xStatic add-on packages available for this version. Install them from NuGet (or npm for the MCP server) or build your own using the extension APIs.</span>
				</h2>

				${!this._docsLoaded
					? html`<div class="status-box"><uui-loader-bar></uui-loader-bar><p>Loading plugins...</p></div>`
					: this._plugins.length === 0
						? html`
							<uui-box headline="No plugins listed">
								<p>No add-on packages were included in this build's documentation bundle.</p>
							</uui-box>
						`
						: html`
							<div class="grid">
								${this._plugins.map((plugin) => html`<xstatic-doc-element .doc=${plugin}></xstatic-doc-element>`)}
							</div>
						`}
			</div>
		`;
	}

	static styles = css`
		:host {
			display: block;
		}

		.docs-toolbar {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: var(--uui-size-space-4, 16px);
			flex-wrap: wrap;
			margin-bottom: var(--uui-size-space-5, 20px);
			border-bottom: 1px solid var(--uui-color-border, #d8d7d9);
		}

		.sub-tabs {
			--uui-tab-divider: transparent;
		}

		.toolbar-meta {
			display: flex;
			align-items: center;
			gap: var(--uui-size-space-3, 12px);
			padding-bottom: 6px;
		}

		.status-box {
			padding: var(--uui-size-space-5, 20px) 0;
			color: var(--uui-color-text-alt, #6b7280);
		}

		.grid {
			position: relative;
			display: grid;
			grid-gap: 20px;
			grid-template-columns: repeat(auto-fill, minmax(min(360px, 100%), 1fr));
			grid-auto-rows: 1fr;
		}

		h2 {
			margin: 0 0 1.5rem;
		}

		h2 > span {
			font-size: 0.8em;
			font-weight: normal;
			color: var(--uui-color-text-alt, #666);
		}
	`;
}

export default DocsGrid;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-docs-grid': DocsGrid;
	}
}
