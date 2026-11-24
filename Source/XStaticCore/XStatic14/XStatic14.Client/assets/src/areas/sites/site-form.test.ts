import { describe, expect, it } from 'vitest';
import type { SiteApiModel, XStaticConfig } from '../../api';
import { buildSiteFormProperties, mapFormValuesToSiteUpdate, mapSiteToFormValues, validateSiteUpdate } from './site-form';

const site: SiteApiModel = {
	id: 4,
	name: 'Marketing',
	rootNode: 'root-guid',
	cultures: ['en-US'],
	mediaRootNodes: ['media-1'],
	exportFormat: 2,
	assetPaths: '/css,/js',
	imageCrops: '800x600',
	postGenerationActionIds: [7],
	autoPublish: false,
	deploymentTarget: 3,
	targetHostname: 'example.com',
};

describe('site form', () => {
	it('round-trips a saved site through the form values', () => {
		const values = mapSiteToFormValues(site);

		expect(mapFormValuesToSiteUpdate(values, site.id)).toEqual({
			id: 4,
			name: 'Marketing',
			rootNode: 'root-guid',
			cultures: ['en-US'],
			mediaRootNodes: ['media-1'],
			exportFormat: 2,
			assetPaths: '/css,/js',
			imageCrops: '800x600',
			postGenerationActionIds: [7],
			autoPublish: false,
			deploymentTarget: 3,
			targetHostname: 'example.com',
		});
	});

	it('maps an empty form to a model with no deployment target and no actions', () => {
		const model = mapFormValuesToSiteUpdate([], undefined);

		expect(model.id).toBe(0);
		expect(model.deploymentTarget).toBeNull();
		expect(model.postGenerationActionIds).toBeNull();
		expect(model.autoPublish).toBe(false);
	});

	it('requires a name, a root node and an export format', () => {
		const errors = validateSiteUpdate(mapFormValuesToSiteUpdate([], undefined));

		expect([...errors.keys()]).toEqual(['name', 'rootNode', 'exportFormat']);
		expect(validateSiteUpdate(mapFormValuesToSiteUpdate(mapSiteToFormValues(site), site.id)).size).toBe(0);
	});

	it('fills the dropdowns from the config, actions, deployment targets and cultures', () => {
		const properties = buildSiteFormProperties({
			cultures: [{ name: 'English', unique: 'en-US' }],
			config: { exportTypes: [{ id: 2, name: 'HTML' }] } as XStaticConfig,
			actions: [{ id: 7, name: 'Sitemap' }],
			deploymentTargets: [{ id: 3, name: 'Netlify' }],
		});
		const itemsOf = (alias: string) =>
			properties.find((p) => p.alias === alias)?.config?.find((c) => c.alias === 'items')?.value;

		expect(properties.map((p) => p.alias)).toEqual([
			'name',
			'rootNode',
			'cultures',
			'mediaRootNodes',
			'exportFormat',
			'assetPaths',
			'imageCrops',
			'postGenerationActionIds',
			'autoPublish',
			'deploymentTarget',
			'targetHostname',
		]);
		expect(itemsOf('cultures')).toEqual([{ name: 'English', value: 'en-US' }]);
		expect(itemsOf('exportFormat')).toEqual([{ name: 'HTML', value: '2' }]);
		expect(itemsOf('postGenerationActionIds')).toEqual([{ name: 'Sitemap', value: '7' }]);
		expect(itemsOf('deploymentTarget')).toEqual([{ name: 'Netlify', value: '3' }]);
	});
});
