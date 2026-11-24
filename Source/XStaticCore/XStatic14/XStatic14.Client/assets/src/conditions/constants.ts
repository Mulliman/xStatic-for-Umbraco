import type { UmbConditionConfigBase } from '@umbraco-cms/backoffice/extension-api';

/** The alias of the condition that allows xStatic admins and normal users. */
export const XSTATIC_NORMAL_USER_CONDITION_ALIAS = 'xStatic.xStaticNormalUserCondition';

/** The alias of the condition that only allows xStatic admins. */
export const XSTATIC_ADMIN_USER_CONDITION_ALIAS = 'xStatic.xStaticAdminUserCondition';

/** The xStatic role conditions take no settings, so their config is just the alias. */
export type XStaticNormalUserConditionConfig = UmbConditionConfigBase<typeof XSTATIC_NORMAL_USER_CONDITION_ALIAS>;
export type XStaticAdminUserConditionConfig = UmbConditionConfigBase<typeof XSTATIC_ADMIN_USER_CONDITION_ALIAS>;

declare global {
	interface UmbExtensionConditionConfigMap {
		xStaticNormalUser: XStaticNormalUserConditionConfig;
		xStaticAdminUser: XStaticAdminUserConditionConfig;
	}
}
