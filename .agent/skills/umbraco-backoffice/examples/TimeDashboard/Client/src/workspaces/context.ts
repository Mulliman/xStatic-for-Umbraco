import { UmbControllerBase } from "@umbraco-cms/backoffice/class-api";
import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import { UmbControllerHostElement } from "@umbraco-cms/backoffice/controller-api";
import { UMB_WORKSPACE_CONTEXT, type UmbWorkspaceContext } from '@umbraco-cms/backoffice/workspace';


export class TimeWorkspaceContext extends UmbControllerBase implements UmbWorkspaceContext {
    public readonly workspaceAlias: string = 'time.workspace';

    constructor(host: UmbControllerHostElement) {
        super(host);
        this.provideContext(UMB_WORKSPACE_CONTEXT, this);
        this.provideContext(TIME_WORKSPACE_CONTEXT, this);
    }

    getEntityType(): string {
        return 'time-workspace';
    }

    getUnique(): string | undefined {
        return undefined;
    }
}

export default TimeWorkspaceContext;

export const TIME_WORKSPACE_CONTEXT = new UmbContextToken<TimeWorkspaceContext>(
    TimeWorkspaceContext.name,
);
