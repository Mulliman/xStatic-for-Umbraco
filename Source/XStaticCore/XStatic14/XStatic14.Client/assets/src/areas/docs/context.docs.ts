import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { Observable, UmbArrayState, UmbBooleanState, UmbObjectState } from '@umbraco-cms/backoffice/observable-api';

import type { DocModel } from './element.doc';
import type { WikiDocsBundle, WikiPlugin } from './types.docs';

export const DOCS_BUNDLE_URL = '/App_Plugins/xstatic14/docs/docs-bundle.json';

export class DocsContext extends UmbControllerBase {
	#docsInitStarted = false;

	#bundle = new UmbObjectState<WikiDocsBundle | undefined>(undefined);
	#docsLoaded = new UmbBooleanState(false);
	#docsError = new UmbBooleanState(false);
	#plugins = new UmbArrayState<DocModel>([], (d) => d.heading);

	public get bundle(): Observable<WikiDocsBundle | undefined> {
		this.#ensureDocsLoaded();
		return this.#bundle.asObservable();
	}

	public get docsLoaded(): Observable<boolean> {
		this.#ensureDocsLoaded();
		return this.#docsLoaded.asObservable();
	}

	public get docsError(): Observable<boolean> {
		return this.#docsError.asObservable();
	}

	public get plugins(): Observable<Array<DocModel>> {
		this.#ensureDocsLoaded();
		return this.#plugins.asObservable();
	}

	constructor(host: UmbControllerHost) {
		super(host);

		this.provideContext(DOCS_CONTEXT_TOKEN, this);
	}

	#ensureDocsLoaded() {
		if (this.#docsInitStarted) return;
		this.#docsInitStarted = true;
		void this.#fetchDocsBundle();
	}

	async #fetchDocsBundle() {
		try {
			const response = await fetch(DOCS_BUNDLE_URL);
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			const data = (await response.json()) as WikiDocsBundle;
			if (!data || typeof data.pages !== 'object') {
				throw new Error('Invalid docs bundle format');
			}
			this.#bundle.setValue(data);
			this.#plugins.setValue(this.#mapPlugins(data.plugins ?? []));
			this.#docsError.setValue(false);
		} catch {
			this.#docsError.setValue(true);
		} finally {
			this.#docsLoaded.setValue(true);
		}
	}

	#mapPlugins(items: Array<WikiPlugin>): Array<DocModel> {
		return items.map((item) => {
			const links: Array<{ href: string; text: string }> = [];
			if (item.packageUrl) {
				links.push({ href: item.packageUrl, text: item.kind === 'npm' ? 'npm' : 'NuGet' });
			}
			if (item.gitUrl) {
				links.push({ href: item.gitUrl, text: 'Git Repo' });
			}

			return {
				heading: item.id,
				author: item.author,
				description: item.description,
				docSlug: item.docSlug,
				links,
			};
		});
	}
}

export default DocsContext;

export const DOCS_CONTEXT_TOKEN = new UmbContextToken<DocsContext>('xStatic.DocsContext');
