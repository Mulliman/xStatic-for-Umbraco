import type { ManifestCondition } from '@umbraco-cms/backoffice/extension-api';
import { XSTATIC_ADMIN_USER_CONDITION_ALIAS, XSTATIC_NORMAL_USER_CONDITION_ALIAS } from './constants';

export const conditionsManifests: Array<ManifestCondition> = [
	{
		type: 'condition',
		name: 'xStaticNormalUser Condition',
		alias: XSTATIC_NORMAL_USER_CONDITION_ALIAS,
		api: () => import('./xstatic-normal-user.condition'),
	},
	{
		type: 'condition',
		name: 'xStaticAdminUser Condition',
		alias: XSTATIC_ADMIN_USER_CONDITION_ALIAS,
		api: () => import('./xstatic-admin-user.condition'),
	},
];
