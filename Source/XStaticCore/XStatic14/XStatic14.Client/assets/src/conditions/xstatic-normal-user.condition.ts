import { Roles } from '../roles';
import { XStaticRoleConditionBase } from "./xstatic-role.condition-base";
import type { XStaticNormalUserConditionConfig } from "./constants";

/** Permits xStatic admins and normal users (when xStatic user groups are turned on). */
export default class XStaticNormalUserCondition extends XStaticRoleConditionBase<XStaticNormalUserConditionConfig> {
	protected readonly allowedRoles = [Roles.Admin, Roles.NormalUser];
}
