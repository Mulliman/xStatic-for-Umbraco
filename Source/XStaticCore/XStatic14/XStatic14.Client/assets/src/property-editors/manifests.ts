// import type { ManifestPropertyEditorSchema, ManifestTypes } from '@umbraco-cms/backoffice/extension-registry';

import { ManifestPropertyEditorSchema } from '@umbraco-cms/backoffice/property-editor';

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

export const manifests: Array<UmbExtensionManifest> = [
    {
		type: 'propertyEditorUi',
		alias: 'xstatic.propertyEditorUi.password',
		name: 'xStatic Password',
		element: () => import('./editor.password.ts'),
        meta: {
            label: '',
            icon: 'icon-box-alt',
            group: 'xStatic',
        },
	},
    {
		type: 'propertyEditorUi',
		alias: 'xstatic.propertyEditorUi.netlifySubdomain',
		name: 'xStatic Netlify Subdomain',
		element: () => import('./editor.netlify-subdomain.ts'),
        meta: {
            label: '',
            icon: 'icon-box-alt',
            group: 'xStatic',
        },
	},
    {
		type: 'propertyEditorUi',
		alias: 'xstatic.propertyEditorUi.dynamicConfigurableForm',
		name: 'xStatic Configurable Dynamic Form Editor UI',
		element: () => import('./editor.dynamic-configurable-form.ts'),
        meta: {
            label: '',
            icon: 'icon-box-alt',
            group: 'xStatic',
        },
	},
  {
		type: 'propertyEditorUi',
		alias: 'xstatic.propertyEditorUi.deploymentTargetForm',
		name: 'xStatic Deployment Target Form Editor UI',
		element: () => import('./editor.deployment-target.ts'),
        meta: {
            label: '',
            icon: 'icon-box-alt',
            group: 'xStatic',
        },
	},
  dynamicFormSchema,
  deploymentTargetSchema,
  dynamicConfigurableFormSchema
];