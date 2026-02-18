import type { UmbWorkspaceActionArgs } from "@umbraco-cms/backoffice/workspace";
import { UmbWorkspaceActionBase } from "@umbraco-cms/backoffice/workspace";
import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import type { UmbNotificationContext } from "@umbraco-cms/backoffice/notification";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";

export class TimeAction extends UmbWorkspaceActionBase {
    #notificationContext?: UmbNotificationContext;

    constructor(host: UmbControllerHost, args: UmbWorkspaceActionArgs<never>) {
        super(host, args);

        this.consumeContext(UMB_NOTIFICATION_CONTEXT, (instance) => {
            this.#notificationContext = instance;
        });
    }

    override async execute(): Promise<void> {
        this.#notificationContext?.peek('warning', {
            data: {
                headline: 'A thing has happened!',
                message: 'What that thing is? Only time will tell.',
            },
        });
    }
}
