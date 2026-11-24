import { describe, expect, it } from 'vitest';
import type { ActionModel, XStaticConfig } from '../../api';
import {
	buildActionFormProperties,
	getActionConfigFields,
	mapActionToFormValues,
	mapActionToUpdateModel,
	mapFormValuesToActionUpdate,
	validateActionUpdate,
} from './action-form';

const sitemapType = {
	id: 'sitemap',
	name: 'Sitemap',
	fields: [{ alias: 'path', name: 'Path', value: '/sitemap.xml', editorUiAlias: null }],
};
const config = { postGenerationActions: [sitemapType, { id: 'empty', name: 'Empty', fields: null }] } as XStaticConfig;

describe('action form', () => {
	it('maps a saved action to form values and an update model keyed by field name', () => {
		const action: ActionModel = { id: 9, name: 'My sitemap', type: sitemapType };

		expect(mapActionToFormValues(action)).toEqual([
			{ alias: 'id', value: 9 },
			{ alias: 'name', value: 'My sitemap' },
			{ alias: 'type', value: ['sitemap'] },
			{ alias: 'config', value: sitemapType.fields },
		]);
		expect(mapActionToUpdateModel(action)).toEqual({
			id: 9,
			name: 'My sitemap',
			type: 'sitemap',
			config: { Path: '/sitemap.xml' },
		});
		expect(mapFormValuesToActionUpdate(mapActionToFormValues(action), 9)).toEqual(mapActionToUpdateModel(action));
	});

	it('keeps typed config values while they match the selected type, otherwise uses the type fields', () => {
		const edited = [{ alias: 'path', name: 'Path', value: '/custom.xml', editorUiAlias: null }];
		const values = [
			{ alias: 'type', value: ['sitemap'] },
			{ alias: 'config', value: edited },
		];

		expect(getActionConfigFields(values, sitemapType)).toBe(edited);
		expect(getActionConfigFields([{ alias: 'config', value: [{ alias: 'other' }] }], sitemapType)).toBe(sitemapType.fields);
		expect(getActionConfigFields(values, { id: 'empty', fields: null })).toEqual([]);
		expect(getActionConfigFields(values, undefined)).toBeUndefined();
	});

	it('passes the selected type fields to the configuration editor', () => {
		const properties = buildActionFormProperties(config, [{ alias: 'type', value: ['sitemap'] }]);
		const fields = properties.find((p) => p.alias === 'config')?.config?.find((c) => c.alias === 'fields')?.value;

		expect(properties.map((p) => p.alias)).toEqual(['name', 'type', 'config']);
		expect(fields).toBe(sitemapType.fields);
	});

	it('requires a name and a type', () => {
		expect([...validateActionUpdate(mapFormValuesToActionUpdate([], undefined)).keys()]).toEqual(['name', 'type']);
	});
});
