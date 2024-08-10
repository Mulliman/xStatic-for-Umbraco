import type { ManifestPropertyEditorSchema, ManifestTypes } from '@umbraco-cms/backoffice/extension-registry';

export const dynamicFormSchema : ManifestPropertyEditorSchema = {
  type: 'propertyEditorSchema',
  name: 'Dynamic Form Editor Schema',
  alias: 'xstatic.schema.dynamicForm',
  meta: {
      defaultPropertyEditorUiAlias: 'xstatic.propertyEditorUi.dynamicForm',
      settings: {
          properties: [
              {
                  alias: 'fields',
                  label: 'Fields',
                  propertyEditorUiAlias: 'Umb.PropertyEditorUi.TextArea'
              }
          ]
      }
  }
};

export const deploymentTargetSchema : ManifestPropertyEditorSchema = {
  type: 'propertyEditorSchema',
  name: 'Deployment Target Editor Schema',
  alias: 'xstatic.schema.dynamicForm',
  meta: {
      defaultPropertyEditorUiAlias: 'xstatic.propertyEditorUi.dynamicForm',
      settings: {
          properties: [
              {
                  alias: 'fields',
                  label: 'Fields',
                  propertyEditorUiAlias: 'xstatic.propertyEditorUi.dynamicForm'
              }
          ]
      }
  }
};

export const dynamicConfigurableFormSchema : ManifestPropertyEditorSchema = {
    type: 'propertyEditorSchema',
    name: 'Configurable Dynamic Form Editor Schema',
    alias: 'xstatic.schema.dynamicConfigurableForm',
    meta: {
        defaultPropertyEditorUiAlias: 'xstatic.propertyEditorUi.dynamicConfigurableForm',
        settings: {
            properties: [
                {
                    alias: 'fields',
                    label: 'Fields',
                    propertyEditorUiAlias: 'xstatic.propertyEditorUi.dynamicConfigurableForm'
                }
            ]
        }
    }
  };

export const manifests: Array<ManifestTypes> = [
	{
		type: 'propertyEditorUi',
		alias: 'xstatic.propertyEditorUi.dynamicForm',
		name: 'xStatic Dynamic Form Editor UI',
		element: () => import('./editor.dynamicForm.ts'),
	},
    {
		type: 'propertyEditorUi',
		alias: 'xstatic.propertyEditorUi.dynamicConfigurableForm',
		name: 'xStatic Configurable Dynamic Form Editor UI',
		element: () => import('./editor.dynamicConfigurableForm.ts'),
	},
  {
		type: 'propertyEditorUi',
		alias: 'xstatic.propertyEditorUi.deploymentTargetForm',
		name: 'xStatic Deployment Target Form Editor UI',
		element: () => import('./editor.deploymentTarget.ts'),
	},
  dynamicFormSchema,
  deploymentTargetSchema,
  dynamicConfigurableFormSchema
];

