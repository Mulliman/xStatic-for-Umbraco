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

		expect(model.name).toBe('Docs Site');
		expect(model.rootNode).toBe('node-guid-1');
		expect(model.cultures).toEqual(['en-US', 'da-DK']);
		expect(model.mediaRootNodes).toEqual(['media-1', 'media-2']);
		expect(model.exportFormat).toBe('3');
		expect(model.assetPaths).toBe('/css,/js/*');
		expect(model.imageCrops).toBe('800x600@80');
		expect(model.postGenerationActionIds).toEqual(['1', '2']);
		expect(model.autoPublish).toBe(true);
		expect(model.deploymentTarget).toBe('5');
		expect(model.targetHostname).toBe('docs.example.com');
	});

	it('handles empty arrays cleanly in helper methods', () => {
		const el = document.createElement('xstatic-edit-site-modal') as EditSiteModalElement;

		expect(el.createCsvString([])).toBeNull();
		expect(el.createCsvString(['a', 'b'])).toBe('a,b');
		expect(el.getFirst([])).toBeNull();
		expect(el.getFirst(['only'])).toBe('only');
		expect(el.getIds(null)).toBeNull();
		expect(el.getIds(['1'])).toEqual(['1']);
	});
});
