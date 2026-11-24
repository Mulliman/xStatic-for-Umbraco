import type { UmbPropertyValueData } from '@umbraco-cms/backoffice/property';
import type {
	DeployerField,
	DeploymentTargetCreatorPostModel,
	DeploymentTargetModel,
	DeploymentTargetUpdateModel,
	XStaticConfig,
} from '../../api';
import {
	fieldsToRecord,
	getFirst,
	getValue,
	hasMatchingFields,
	MANDATORY_NAME_VALIDATION,
	toOptions,
	type XStaticFormErrors,
	type XStaticFormProperty,
} from '../../code/form';

/** A deployer or a deployment target creator: both have an id, a name, help text and fields. */
interface DeployerLikeModel {
	readonly id?: string | null;
	readonly name?: string | null;
	readonly help?: string | null;
	readonly fields?: Array<DeployerField> | null;
}

/** The fields to show: the values already in the form while they still match the selected type, otherwise its own fields. */
export function getDeployerFields(
	values: ReadonlyArray<UmbPropertyValueData>,
	selected: DeployerLikeModel | undefined,
): DeployerField[] | null | undefined {
	const existing = getValue<DeployerField[] | null>(values, 'fields');

	return selected && hasMatchingFields(existing, selected.fields) ? existing : selected?.fields;
}

function buildProperties(
	typeAlias: string,
	typeLabel: string,
	typeDescription: string,
	fieldsDescription: string,
	types: ReadonlyArray<DeployerLikeModel> | null | undefined,
	values: ReadonlyArray<UmbPropertyValueData>,
): XStaticFormProperty[] {
	const selectedId = getFirst(getValue<Array<string>>(values, typeAlias));
	const selected = types?.find((x) => x.id === selectedId);

	return [
		{
			alias: 'name',
			label: 'Name *',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.TextBox',
			config: [MANDATORY_NAME_VALIDATION],
		},
		{
			alias: typeAlias,
			label: typeLabel,
			description: typeDescription,
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.Dropdown.Single',
			config: [{ alias: 'items', value: toOptions(types, (x) => x.name, (x) => x.id) }],
		},
		{
			alias: 'fields',
			label: 'Configuration',
			description: fieldsDescription,
			propertyEditorUiAlias: 'xstatic.propertyEditorUi.deploymentTargetForm',
			config: [
				{ alias: 'fields', value: getDeployerFields(values, selected) },
				{ alias: 'help', value: selected?.help },
			],
		},
	];
}

// #region Deployment target (manual)

/** The id of the deployer picked in the deployment target form. */
export function getSelectedDeployerId(values: ReadonlyArray<UmbPropertyValueData>): string | null {
	return getFirst(getValue<Array<string>>(values, 'deployerDefinition'));
}

/** The properties shown in the create/edit deployment target dialog. */
export function buildDeploymentTargetFormProperties(
	config: XStaticConfig | undefined,
	values: ReadonlyArray<UmbPropertyValueData>,
): XStaticFormProperty[] {
	return buildProperties(
		'deployerDefinition',
		'Deployer *',
		'This is the type of deployer that you want to configure a specific instance of.',
		'Use this to set what specific configuration you want to use for the selected deployer. The fields may change depending on the type selected.',
		config?.deployers,
		values,
	);
}

/** Converts a saved deployment target into the values of the form. */
export function mapDeploymentTargetToFormValues(target: DeploymentTargetModel): UmbPropertyValueData[] {
	return [
		{ alias: 'id', value: target.id ?? 0 },
		{ alias: 'name', value: target.name },
		{ alias: 'deployerDefinition', value: [target.deployerDefinition] },
		{ alias: 'fields', value: target.fields },
	];
}

/** Converts a saved deployment target into the model the update endpoint expects. */
export function mapDeploymentTargetToUpdateModel(target: DeploymentTargetModel): DeploymentTargetUpdateModel {
	return {
		id: target.id ?? 0,
		name: target.name,
		deployerDefinition: target.deployerDefinition,
		fields: fieldsToRecord(target.fields),
	};
}

/** Converts the values of the form into the model the create and update endpoints expect. */
export function mapFormValuesToDeploymentTargetUpdate(
	values: ReadonlyArray<UmbPropertyValueData>,
	id: number | undefined,
): DeploymentTargetUpdateModel {
	return {
		id: id ?? 0,
		name: getValue<string>(values, 'name'),
		deployerDefinition: getSelectedDeployerId(values),
		fields: fieldsToRecord(getValue<DeployerField[]>(values, 'fields')),
	};
}

/** Checks the required deployment target fields. */
export function validateDeploymentTargetUpdate(model: DeploymentTargetUpdateModel): XStaticFormErrors {
	const errors: XStaticFormErrors = new Map();

	if (!model.name) {
		errors.set('name', 'Name is required');
	}

	if (!model.deployerDefinition) {
		errors.set('deployerDefinition', 'Deployer Definition is required');
	}

	return errors;
}

// #endregion

// #region Deployment target creator (automatic)

/** The id of the creator picked in the automatic creation form. */
export function getSelectedCreatorId(values: ReadonlyArray<UmbPropertyValueData>): string | null {
	return getFirst(getValue<Array<string>>(values, 'creator'));
}

/** The properties shown in the "Automatically Create New Deployment Target" dialog. */
export function buildDeploymentTargetCreatorFormProperties(
	config: XStaticConfig | undefined,
	values: ReadonlyArray<UmbPropertyValueData>,
): XStaticFormProperty[] {
	return buildProperties(
		'creator',
		'Creator Template *',
		'This is the creator that will be used to configure the remote service that you intend to deploy to.',
		'Use this to set what specific configuration you want to use for the selected creator. The fields may change depending on the type selected.',
		config?.deploymentTargetCreators,
		values,
	);
}

/** Converts the values of the creator form into the model the auto-create endpoint expects. */
export function mapFormValuesToCreatorPost(values: ReadonlyArray<UmbPropertyValueData>): DeploymentTargetCreatorPostModel {
	return {
		name: getValue<string>(values, 'name'),
		creator: getSelectedCreatorId(values),
		fields: fieldsToRecord(getValue<DeployerField[]>(values, 'fields')),
	};
}

/** Checks the required creator fields. */
export function validateCreatorPost(model: DeploymentTargetCreatorPostModel): XStaticFormErrors {
	const errors: XStaticFormErrors = new Map();

	if (!model.name) {
		errors.set('name', 'Name is required');
	}

	if (!model.creator) {
		errors.set('creator', 'Creator is required');
	}

	return errors;
}

// #endregion
