import type { ManifestPropertyEditorSchema, ManifestTypes } from '@umbraco-cms/backoffice/extension-registry';

export const styledTextSchema : ManifestPropertyEditorSchema = {
  type: 'propertyEditorSchema',
  name: 'Styled textbox',
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

export const manifests: Array<ManifestTypes> = [
	{
		type: 'propertyEditorUi',
		alias: 'xstatic.propertyEditorUi.dynamicForm',
		name: 'xStatic Dynamic Form Editor UI',
		element: () => import('./editor.dynamicForm.ts'),
	},
  styledTextSchema
];
