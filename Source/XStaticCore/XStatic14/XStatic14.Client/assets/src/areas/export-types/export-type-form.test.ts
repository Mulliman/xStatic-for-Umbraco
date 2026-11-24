import { describe, expect, it } from 'vitest';
import type { ExportTypeModel, XStaticConfig } from '../../api';
import {
	buildExportTypeFormProperties,
	mapExportTypeToFormValues,
	mapExportTypeToUpdateModel,
	mapFormValuesToExportTypeUpdate,
	validateExportTypeUpdate,
} from './export-type-form';

describe('export type form', () => {
	it('round-trips a saved export type through the form values', () => {
		const exportType = {
			id: 5,
			name: 'HTML',
			generator: { id: 'gen', name: 'Generator' },
			transformerFactory: { id: 'tf', name: 'Transformers' },
			fileNameGenerator: { id: 'fng', name: 'File names' },
		} as ExportTypeModel;

		const expected = { id: 5, name: 'HTML', generator: 'gen', transformerFactory: 'tf', fileNameGenerator: 'fng' };

		expect(mapExportTypeToUpdateModel(exportType)).toEqual(expected);
		expect(mapFormValuesToExportTypeUpdate(mapExportTypeToFormValues(exportType), 5)).toEqual(expected);
	});

	it('fills the three dropdowns from the config', () => {
		const properties = buildExportTypeFormProperties({
			generators: [{ id: 'gen', name: 'Generator' }],
			transformerFactories: [{ id: 'tf', name: 'Transformers' }],
			fileNameGenerators: [{ id: 'fng', name: 'File names' }],
		} as XStaticConfig);

		expect(properties.map((p) => p.alias)).toEqual(['name', 'transformerFactory', 'generator', 'fileNameGenerator']);
		expect(properties[2].config?.[0]).toEqual({ alias: 'items', value: [{ name: 'Generator', value: 'gen' }] });
	});

	it('requires a name and all three components', () => {
		expect([...validateExportTypeUpdate(mapFormValuesToExportTypeUpdate([], undefined)).keys()]).toEqual([
			'name',
			'fileNameGenerator',
			'generator',
			'transformerFactory',
		]);
	});
});
