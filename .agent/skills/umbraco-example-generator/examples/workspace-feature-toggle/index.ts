import { UMB_WORKSPACE_CONDITION_ALIAS } from '@umbraco-cms/backoffice/workspace';

export const manifests = [
	{
		type: 'workspaceContext',
		name: 'Example Feature Toggle Workspace Context',
		alias: 'example.workspaceContext.featureToggle',
		api: () => import('./feature-toggle-context.js'),
		conditions: [
			{
				alias: UMB_WORKSPACE_CONDITION_ALIAS,
				match: 'Umb.Workspace.Document',
			},
		],
	},
	{
		type: 'workspaceAction',
		kind: 'default',
		name: 'Example Toggle All Features Action',
		alias: 'example.workspaceAction.toggleAllFeatures',
		weight: 900,
		api: () => import('./feature-toggle-action.js'),
		meta: {
			label: 'Toggle All Features',
			look: 'secondary',
		},
		conditions: [
			{
				alias: UMB_WORKSPACE_CONDITION_ALIAS,
				match: 'Umb.Workspace.Document',
			},
		],
	},
	{
		type: 'workspaceView',
		name: 'Example Feature Toggle Workspace View',
		alias: 'example.workspaceView.featureToggle',
		element: () => import('./feature-toggle-view.element.js'),
		weight: 800,
		meta: {
			label: 'Feature Toggles',
			pathname: 'feature-toggles',
			icon: 'icon-settings',
		},
		conditions: [
			{
				alias: UMB_WORKSPACE_CONDITION_ALIAS,
				match: 'Umb.Workspace.Document',
			},
		],
	},
	{
		type: 'workspaceFooterApp',
		alias: 'example.workspaceFooterApp.featureToggleStatus',
		name: 'Feature Toggle Status Footer App',
		element: () => import('./feature-toggle-footer.element.js'),
		weight: 800,
		conditions: [
			{
				alias: UMB_WORKSPACE_CONDITION_ALIAS,
				match: 'Umb.Workspace.Document',
			},
		],
	},
];
