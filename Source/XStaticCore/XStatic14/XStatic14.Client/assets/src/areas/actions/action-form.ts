import type { UmbPropertyValueData } from '@umbraco-cms/backoffice/property';
import type { ActionModel, ActionUpdateModel, ConfigurableTypeField, ConfigurableTypeModel, XStaticConfig } from '../../api';
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

/** The id of the action type picked in the form. */
export function getSelectedActionTypeId(values: ReadonlyArray<UmbPropertyValueData>): string | null {
	return getFirst(getValue<Array<string>>(values, 'type'));
}

/**
 * The fields to show in the configuration editor: the values already in the form while they still match the
 * selected action type, otherwise the selected type's own fields. `undefined` means no type is selected.
 */
export function getActionConfigFields(
	values: ReadonlyArray<UmbPropertyValueData>,
	selectedType: ConfigurableTypeModel | undefined,
): ConfigurableTypeField[] | undefined {
	if (!selectedType) {
		return undefined;
	}

	const existing = getValue<ConfigurableTypeField[] | null>(values, 'config');
	const selectedFields = selectedType.fields ?? [];

	return existing && hasMatchingFields(existing, selectedFields) ? existing : selectedFields;
}

/** The properties shown in the create/edit action dialog. */
export function buildActionFormProperties(
	config: XStaticConfig | undefined,
	values: ReadonlyArray<UmbPropertyValueData>,
): XStaticFormProperty[] {
	const selectedTypeId = getSelectedActionTypeId(values);
	const selectedType = config?.postGenerationActions?.find((x) => x.id === selectedTypeId);

	return [
		{
			alias: 'name',
			label: 'Action Name *',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.TextBox',
			config: [MANDATORY_NAME_VALIDATION],
		},
		{
			alias: 'type',
			label: 'Action Type *',
			description: 'This is the type of action that you want to configure a specific instance of.',
			propertyEditorUiAlias: 'Umb.PropertyEditorUi.Dropdown',
			config: [{ alias: 'items', value: toOptions(config?.postGenerationActions, (x) => x.name, (x) => x.id) }],
		},
		{
			alias: 'config',
			label: 'Configuration',
			description:
				'Use this to set what specific configuration you want to use for the selected type. The fields may change depending on the type selected.',
			propertyEditorUiAlias: 'xstatic.propertyEditorUi.dynamicConfigurableForm',
			config: [{ alias: 'fields', value: getActionConfigFields(values, selectedType) }],
		},
	];
}

/** Converts a saved action into the values of the action form. */
export function mapActionToFormValues(action: ActionModel): UmbPropertyValueData[] {
	return [
		{ alias: 'id', value: action.id ?? 0 },
		{ alias: 'name', value: action.name },
		{ alias: 'type', value: [action.type?.id] },
		{ alias: 'config', value: action.type?.fields },
	];
}

/** Converts a saved action into the model the update endpoint expects. */
export function mapActionToUpdateModel(action: ActionModel): ActionUpdateModel {
	return {
		id: action.id ?? 0,
		name: action.name,
		type: action.type?.id,
		config: fieldsToRecord(action.type?.fields, (field) => field.name),
	};
}

/** Converts the values of the action form into the model the create and update endpoints expect. */
export function mapFormValuesToActionUpdate(
	values: ReadonlyArray<UmbPropertyValueData>,
	id: number | undefined,
): ActionUpdateModel {
	return {
		id: id ?? 0,
		name: getValue<string>(values, 'name'),
		type: getSelectedActionTypeId(values),
		// Action config is keyed by field name (deployment target fields are keyed by alias).
		config: fieldsToRecord(getValue<ConfigurableTypeField[]>(values, 'config'), (field) => field.name),
	};
}

/** Checks the required action fields. */
export function validateActionUpdate(model: ActionUpdateModel): XStaticFormErrors {
	const errors: XStaticFormErrors = new Map();

	if (!model.name) {
		errors.set('name', 'Name is required');
	}

	if (!model.type) {
		errors.set('type', 'Action Type is required');
	}

	return errors;
}
