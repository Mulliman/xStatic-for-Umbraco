import { UMB_CURRENT_USER_CONTEXT } from '@umbraco-cms/backoffice/current-user';
import { UmbConditionBase } from '@umbraco-cms/backoffice/extension-registry';
import type {
	UmbConditionConfigBase,
	UmbConditionControllerArguments,
	UmbExtensionCondition,
} from '@umbraco-cms/backoffice/extension-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { Roles } from '../roles';

import { CONFIG_CONTEXT_TOKEN } from '../areas/config/context.config';

export default class XStaticNormalUserCondition extends UmbConditionBase<UmbSectionUserPermissionConditionConfig> implements UmbExtensionCondition {
	isUsingXStaticRoles = false;
	isInValidRole = false;

	constructor(host: UmbControllerHost, args: UmbConditionControllerArguments<UmbSectionUserPermissionConditionConfig>) {
		super(host, args);

		this.#init();
	}

	async #init() {

		this.consumeContext(CONFIG_CONTEXT_TOKEN, (context) => {
			this.observe(context?.settings, (settings) => {
				this.isUsingXStaticRoles = settings?.isUsingXStaticRoles || false;
				this.permitted = !this.isUsingXStaticRoles || this.isInValidRole;
			});
		});

		this.consumeContext(UMB_CURRENT_USER_CONTEXT, (context) => {
			this.observe(
				context?.currentUser,
				(currentUser) => {
					this.isInValidRole = !!currentUser && (currentUser.fallbackPermissions?.some(p => p === Roles.Admin) || currentUser.fallbackPermissions?.some(p => p === Roles.NormalUser));
					this.permitted = !this.isUsingXStaticRoles || this.isInValidRole;
				},
			);
		});
	}
}

export type UmbSectionUserPermissionConditionConfig = UmbConditionConfigBase<'Umb.Condition.SectionUserPermission'> & {
	/**
	 *
	 *
	 * @example
	 * "Umb.Section.Content"
	 */
	match: string;
};
