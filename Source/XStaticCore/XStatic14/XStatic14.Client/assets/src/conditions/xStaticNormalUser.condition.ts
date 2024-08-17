import { UMB_CURRENT_USER_CONTEXT } from '@umbraco-cms/backoffice/current-user';
import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import type {
	UmbConditionConfigBase,
	UmbConditionControllerArguments,
	UmbExtensionCondition,
} from '@umbraco-cms/backoffice/extension-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { Roles } from '../roles';

export default class XStaticNormalUserCondition extends UmbControllerBase implements UmbExtensionCondition {
	permitted = false;
	config: UmbConditionConfigBase<string> = { alias: 'Umb.Condition.XStaticNormalUser' };
	#onChange: () => void;

	constructor(host: UmbControllerHost, args: UmbConditionControllerArguments<UmbSectionUserPermissionConditionConfig>) {
		super(host);
		this.#onChange = args.onChange;

		this.consumeContext(UMB_CURRENT_USER_CONTEXT, (context) => {
			this.observe(
				context.currentUser,
				(currentUser) => {
					this.permitted = !!currentUser && (currentUser.fallbackPermissions.some(p => p === Roles.Admin) || currentUser.fallbackPermissions.some(p => p === Roles.NormalUser));
					this.#onChange();
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
