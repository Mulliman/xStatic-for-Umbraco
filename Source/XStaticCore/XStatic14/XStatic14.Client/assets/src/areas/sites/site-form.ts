import type { UmbPropertyValueData } from '@umbraco-cms/backoffice/property';
import type { SafeActionModel, SafeDeploymentTargetModel, SiteApiModel, SiteUpdateModel, XStaticConfig } from '../../api';
import {
	asArrayOrNull,
	fromCsv,
	getFirst,
	getValue,
	toCsv,
	toNumberOrNull,
	toOptions,
	type XStaticFormErrors,
	type XStaticFormProperty,
} from '../../code/form';

/** The options the site form's dropdowns and checkbox lists are built from. */
export interface SiteFormOptions {
	cultures?: ReadonlyArray<{ name?: string | null; unique: string }>;
	config?: XStaticConfig;
	actions?: ReadonlyArray<SafeActionModel>;
	deploymentTargets?: ReadonlyArray<SafeDeploymentTargetModel>;
}

/** The properties shown in the create/edit site dialog. */
export function buildSiteFormProperties(options: SiteFormOptions): XStaticFormProperty[] {
	return [
		{
			alias: 'name',
			label: 'Site Name *',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.TextBox',
		},
		{
			alias: 'rootNode',
			label: 'Root Node *',
			description: 'Select the root of the site you want to create a static version of.',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.ContentPicker',
			config: [{ alias: 'maxNumber', value: 1 }],
		},
		{
			alias: 'cultures',
			label: 'Cultures',
			description: 'Choose which language variant(s) should be used. Leave blank to use the default language.',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.CheckBoxList',
			config: [{ alias: 'items', value: toOptions(options.cultures, (x) => x.name, (x) => x.unique) }],
		},
		{
			alias: 'mediaRootNodes',
			label: 'Media Root Nodes',
			description: 'Select the media folders you want to include in your static site.',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.MediaPicker',
			config: [{ alias: 'multiple', value: true }],
		},
		{
			alias: 'exportFormat',
			label: 'Export Format *',
			description: 'Do you want to export this site as a JSON API or as a static HTML website.',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.Dropdown',
			config: [{ alias: 'items', value: toOptions(options.config?.exportTypes, (x) => x.name, (x) => x.id) }],
		},
		{
			alias: 'assetPaths',
			label: 'Asset Paths',
			description:
				'Add folder names of files on disk that should also be packaged up. e.g. /assets/file.js will include the specific file, /assets will include the entire folder, /assets/* will recursively include all folders and files.',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.Tags',
			config: [{ alias: 'storageType', value: 'csv' }],
		},
		{
			alias: 'imageCrops',
			label: 'Image Crops',
			description:
				'The image crops you want to generate in the format {width}x{height}. You can also optionally add compression after each with @{quality}. E.g. 1600x900@80,800x450@50,320x0',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.Tags',
			config: [{ alias: 'storageType', value: 'csv' }],
		},
		{
			alias: 'postGenerationActionIds',
			label: 'Post Generation Actions',
			description: 'Choose which actions should be performed once the pages have been created.',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.CheckBoxList',
			config: [{ alias: 'items', value: toOptions(options.actions, (x) => x.name, (x) => x.id) }],
		},
		{
			alias: 'autoPublish',
			label: 'Auto Publish',
			description: 'Select this is you want to generate the site automatically when a node is published.',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.Toggle',
		},
		{
			alias: 'deploymentTarget',
			label: 'Deployment Target',
			description:
				'Create and configure your Deployment Targets in the corresponding dashboard, before choosing here.',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.Dropdown',
			config: [
				{ alias: 'items', value: toOptions(options.deploymentTargets, (x) => x.name, (x) => x.id) },
				{ alias: 'placeholder', value: 'Please select...' },
			],
		},
		{
			alias: 'targetHostname',
			label: 'Target Hostname',
			description:
				"The site hostname you've configured for viewing the site locally will be replaced with this value. Do not include the protocol, just the hostname.",
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.TextBox',
		},
	];
}

/** Converts a saved site into the values of the site form. */
export function mapSiteToFormValues(site: SiteApiModel): UmbPropertyValueData[] {
	return [
		{ alias: 'name', value: site.name },
		{ alias: 'rootNode', value: [{ unique: site.rootNode }] },
		{ alias: 'cultures', value: site.cultures },
		{ alias: 'mediaRootNodes', value: site.mediaRootNodes?.map((x) => ({ key: x, mediaKey: x, unique: x })) },
		{ alias: 'exportFormat', value: site.exportFormat != null ? [site.exportFormat.toString()] : [] },
		{ alias: 'assetPaths', value: fromCsv(site.assetPaths) },
		{ alias: 'imageCrops', value: fromCsv(site.imageCrops) },
		{ alias: 'postGenerationActionIds', value: site.postGenerationActionIds?.map((x) => x.toString()) },
		{ alias: 'autoPublish', value: site.autoPublish },
		{ alias: 'deploymentTarget', value: site.deploymentTarget != null ? [site.deploymentTarget.toString()] : [] },
		{ alias: 'targetHostname', value: site.targetHostname },
	];
}

/** Converts the values of the site form into the model the create and update endpoints expect. */
export function mapFormValuesToSiteUpdate(
	values: ReadonlyArray<UmbPropertyValueData>,
	id: number | undefined,
): SiteUpdateModel {
	const rootNodes = getValue<Array<{ unique?: string }>>(values, 'rootNode');
	const mediaRootNodes = getValue<Array<{ mediaKey?: string }>>(values, 'mediaRootNodes');
	const actionIds = asArrayOrNull<unknown>(getValue(values, 'postGenerationActionIds'));

	return {
		id: id ?? 0,
		name: getValue<string>(values, 'name'),
		rootNode: getFirst(rootNodes)?.unique ?? '',
		cultures: asArrayOrNull<string>(getValue(values, 'cultures')),
		mediaRootNodes: mediaRootNodes?.map((x) => x?.mediaKey).filter((x): x is string => !!x),
		exportFormat: toNumberOrNull(getFirst(getValue<string[]>(values, 'exportFormat'))) ?? 0,
		assetPaths: toCsv(getValue<string[]>(values, 'assetPaths')),
		imageCrops: toCsv(getValue<string[]>(values, 'imageCrops')),
		postGenerationActionIds: actionIds
			? actionIds.map(toNumberOrNull).filter((x): x is number => x !== null)
			: null,
		autoPublish: getValue<boolean>(values, 'autoPublish') === true,
		deploymentTarget: toNumberOrNull(getFirst(getValue<string[]>(values, 'deploymentTarget'))),
		targetHostname: getValue<string>(values, 'targetHostname'),
	};
}

/** Checks the required site fields. */
export function validateSiteUpdate(model: SiteUpdateModel): XStaticFormErrors {
	const errors: XStaticFormErrors = new Map();

	if (!model.name) {
		errors.set('name', 'Name is required');
	}

	if (!model.rootNode) {
		errors.set('rootNode', 'Root node is required');
	}

	if (!model.exportFormat) {
		errors.set('exportFormat', 'Export format is required');
	}

	return errors;
}
