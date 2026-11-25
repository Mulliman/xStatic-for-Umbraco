import { afterEach, describe, expect, it, vi } from 'vitest';
import { UmbObjectState } from '@umbraco-cms/backoffice/observable-api';
import { UmbLanguageCollectionRepository } from '@umbraco-cms/backoffice/language';
import type { SiteDependenciesModel, XStaticConfig } from '../../api';
import { SITE_CONTEXT_TOKEN } from './context.site';
import './dialog.edit-site';
import type EditSiteModalElement from './dialog.edit-site';

describe('xstatic-edit-site-modal', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('maps property dataset values into a SiteUpdateModel', () => {
		const el = document.createElement('xstatic-edit-site-modal') as EditSiteModalElement;
		el._values = [
			{ alias: 'name', value: 'Docs Site' },
			{ alias: 'rootNode', value: [{ unique: 'node-guid-1' }] },
			{ alias: 'cultures', value: ['en-US', 'da-DK'] },
			{ alias: 'mediaRootNodes', value: [{ mediaKey: 'media-1' }, { mediaKey: 'media-2' }] },
			{ alias: 'exportFormat', value: ['3'] },
			{ alias: 'assetPaths', value: ['/css', '/js/*'] },
			{ alias: 'imageCrops', value: ['800x600@80'] },
			{ alias: 'postGenerationActionIds', value: ['1', '2'] },
			{ alias: 'autoPublish', value: true },
			{ alias: 'deploymentTarget', value: ['5'] },
			{ alias: 'targetHostname', value: 'docs.example.com' },
		];

		const model = el.createPostModel();

		expect(model).toEqual({
			id: 0,
			name: 'Docs Site',
			rootNode: 'node-guid-1',
			cultures: ['en-US', 'da-DK'],
			mediaRootNodes: ['media-1', 'media-2'],
			exportFormat: 3,
			assetPaths: '/css,/js/*',
			imageCrops: '800x600@80',
			postGenerationActionIds: [1, 2],
			autoPublish: true,
			deploymentTarget: 5,
			targetHostname: 'docs.example.com',
		});
	});

	it('waits for the real dependencies and keeps unsaved edits when they are reloaded', async () => {
		vi.spyOn(UmbLanguageCollectionRepository.prototype, 'requestCollection').mockResolvedValue({
			data: { items: [], total: 0 },
		} as never);

		const dependencies = new UmbObjectState<SiteDependenciesModel>({});
		const siteContext = {
			siteDependencies: dependencies.asObservable(),
			config: new UmbObjectState<XStaticConfig | undefined>(undefined).asObservable(),
			refreshData: vi.fn(),
		};

		let provideSiteContext: ((ctx: unknown) => void) | undefined;
		const ModalCtor = customElements.get('xstatic-edit-site-modal')!;
		vi.spyOn(
			ModalCtor.prototype as unknown as { consumeContext: (token: unknown, cb: (ctx: unknown) => void) => void },
			'consumeContext',
		).mockImplementation((token, cb) => {
			if (token === SITE_CONTEXT_TOKEN) {
				provideSiteContext = cb;
			}
		});

		const el = document.createElement('xstatic-edit-site-modal') as EditSiteModalElement;
		el.data = { content: { id: 9, name: 'Saved name', rootNode: 'root', exportFormat: 1, autoPublish: false } };
		document.body.appendChild(el);
		provideSiteContext?.(siteContext);

		// The context's initial empty object is not "no actions": the form stays unseeded.
		expect(el.actions).toBeUndefined();
		expect(el._values).toEqual([]);

		dependencies.setValue({ actions: [], deployers: [], exportTypes: [] });
		expect(el.actions).toEqual([]);
		expect(el.deploymentTargets).toEqual([]);
		expect(el._values.find((v) => v.alias === 'name')?.value).toBe('Saved name');

		el._values = el._values.map((v) => (v.alias === 'name' ? { ...v, value: 'Unsaved edit' } : v));

		// A config change elsewhere reloads the dependencies.
		dependencies.setValue({ actions: [{ id: 1, name: 'Webhook' }], deployers: [], exportTypes: [] } as never);

		expect(el.actions).toHaveLength(1);
		expect(el._values.find((v) => v.alias === 'name')?.value).toBe('Unsaved edit');
	});
});
