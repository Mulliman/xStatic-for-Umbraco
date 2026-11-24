import type { UmbPropertyValueData } from '@umbraco-cms/backoffice/property';
import type { ExportTypeModel, ExportTypeUpdateModel, XStaticConfig } from '../../api';
import {
	getFirst,
	getValue,
	MANDATORY_NAME_VALIDATION,
	toOptions,
	type XStaticFormErrors,
	type XStaticFormProperty,
} from '../../code/form';

/** The properties shown in the create/edit export type dialog. */
export function buildExportTypeFormProperties(config: XStaticConfig | undefined): XStaticFormProperty[] {
	return [
		{
			alias: 'name',
			label: 'Export Type Name *',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.TextBox',
			config: [MANDATORY_NAME_VALIDATION],
		},
		{
			alias: 'transformerFactory',
			label: 'Transformer Factory *',
			description: 'This is the component that decides what transformers are run and in which order.',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.Dropdown.Single',
			config: [{ alias: 'items', value: toOptions(config?.transformerFactories, (x) => x.name, (x) => x.id) }],
		},
		{
			alias: 'generator',
			label: 'Generator *',
			description: 'This is the component that creates the static files for each page.',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.Dropdown.Single',
			config: [{ alias: 'items', value: toOptions(config?.generators, (x) => x.name, (x) => x.id) }],
		},
		{
			alias: 'fileNameGenerator',
			label: 'File Name Generator *',
			description: 'This is the component that decides the folder and the file name for each page.',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.Dropdown.Single',
			config: [{ alias: 'items', value: toOptions(config?.fileNameGenerators, (x) => x.name, (x) => x.id) }],
		},
	];
}

/** Converts a saved export type into the model the update endpoint expects. */
export function mapExportTypeToUpdateModel(exportType: ExportTypeModel): ExportTypeUpdateModel {
	return {
		id: exportType.id ?? 0,
		name: exportType.name,
		fileNameGenerator: exportType.fileNameGenerator?.id,
		generator: exportType.generator?.id,
		transformerFactory: exportType.transformerFactory?.id,
	};
}

/** Converts a saved export type into the values of the export type form. */
export function mapExportTypeToFormValues(exportType: ExportTypeModel): UmbPropertyValueData[] {
	const model = mapExportTypeToUpdateModel(exportType);

	return [
		{ alias: 'id', value: model.id },
		{ alias: 'name', value: model.name },
		{ alias: 'fileNameGenerator', value: [model.fileNameGenerator] },
		{ alias: 'generator', value: [model.generator] },
		{ alias: 'transformerFactory', value: [model.transformerFactory] },
	];
}

/** Converts the values of the export type form into the model the create and update endpoints expect. */
export function mapFormValuesToExportTypeUpdate(
	values: ReadonlyArray<UmbPropertyValueData>,
	id: number | undefined,
): ExportTypeUpdateModel {
	return {
		id: id ?? 0,
		name: getValue<string>(values, 'name'),
		fileNameGenerator: getFirst(getValue<Array<string>>(values, 'fileNameGenerator')),
		generator: getFirst(getValue<Array<string>>(values, 'generator')),
		transformerFactory: getFirst(getValue<Array<string>>(values, 'transformerFactory')),
	};
}

/** Checks the required export type fields. */
export function validateExportTypeUpdate(model: ExportTypeUpdateModel): XStaticFormErrors {
	const errors: XStaticFormErrors = new Map();

	if (!model.name) {
		errors.set('name', 'Name is required');
	}

	if (!model.fileNameGenerator) {
		errors.set('fileNameGenerator', 'File Name Generator is required');
	}

	if (!model.generator) {
		errors.set('generator', 'Generator is required');
	}

	if (!model.transformerFactory) {
		errors.set('transformerFactory', 'Transformer Factory is required');
	}

	return errors;
}
