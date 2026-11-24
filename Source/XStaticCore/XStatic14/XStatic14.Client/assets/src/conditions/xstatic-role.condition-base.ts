import { UMB_CURRENT_USER_CONTEXT } from '@umbraco-cms/backoffice/current-user';
import { UmbConditionBase } from '@umbraco-cms/backoffice/extension-registry';
import type {
	UmbConditionConfigBase,
	UmbConditionControllerArguments,
	UmbExtensionCondition,
} from '@umbraco-cms/backoffice/extension-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { CONFIG_CONTEXT_TOKEN } from '../areas/config/context.config';

/**
 * Permits an extension when xStatic's own user groups are turned off, or when the current user is in one of the
 * groups that `allowedRoles` lists. Subclasses only choose the roles.
 */
export abstract class XStaticRoleConditionBase<ConfigType extends UmbConditionConfigBase>
	extends UmbConditionBase<ConfigType>
	implements UmbExtensionCondition
{
	isUsingXStaticRoles = false;
	isInValidRole = false;

	protected abstract readonly allowedRoles: ReadonlyArray<string>;

	constructor(host: UmbControllerHost, args: UmbConditionControllerArguments<ConfigType>) {
		super(host, args);

		this.consumeContext(CONFIG_CONTEXT_TOKEN, (context) => {
			this.observe(context?.settings, (settings) => {
				this.isUsingXStaticRoles = settings?.isUsingXStaticRoles ?? false;
				this.#update();
			}, '_observeSettings');
		});

		this.consumeContext(UMB_CURRENT_USER_CONTEXT, (context) => {
			this.observe(context?.currentUser, (currentUser) => {
				const permissions = currentUser?.fallbackPermissions ?? [];
				this.isInValidRole = permissions.some((p) => this.allowedRoles.includes(p));
				this.#update();
			}, '_observeCurrentUser');
		});
	}

	#update() {
		this.permitted = !this.isUsingXStaticRoles || this.isInValidRole;
	}
}
