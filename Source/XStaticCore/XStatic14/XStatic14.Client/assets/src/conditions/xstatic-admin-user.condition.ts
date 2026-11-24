import { Roles } from '../roles';
import { XStaticRoleConditionBase } from "./xstatic-role.condition-base";
import type { XStaticAdminUserConditionConfig } from "./constants";

/** Permits xStatic admins only (when xStatic user groups are turned on). */
export default class XStaticAdminUserCondition extends XStaticRoleConditionBase<XStaticAdminUserConditionConfig> {
	protected readonly allowedRoles = [Roles.Admin];
}
