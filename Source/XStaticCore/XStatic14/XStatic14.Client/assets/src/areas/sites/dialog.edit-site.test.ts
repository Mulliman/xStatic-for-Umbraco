import { afterEach, describe, expect, it } from 'vitest';
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
});
