import type { ManifestCondition } from '@umbraco-cms/backoffice/extension-api';

export const conditionsManifests: Array<ManifestCondition> = [
	{
		type: 'condition',
		name: 'xStaticNormalUser Condition',
		alias: 'xStatic.xStaticNormalUserCondition',
		api: () => import('./xstatic-normal-user.condition'),
	},
    {
		type: 'condition',
		name: 'xStaticAdminUser Condition',
		alias: 'xStatic.xStaticAdminUserCondition',
		api: () => import('./xstatic-admin-user.condition'),
	},
];