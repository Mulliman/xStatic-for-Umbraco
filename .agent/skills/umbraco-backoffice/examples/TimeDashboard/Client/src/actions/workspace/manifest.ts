import { UMB_WORKSPACE_CONDITION_ALIAS } from "@umbraco-cms/backoffice/workspace";
import { TimeAction } from "./time.action.js";

export const manifests: Array<UmbExtensionManifest> = [
    {
        type: 'workspaceAction',
        kind: 'default',
        alias: 'time.workspace.action',
        name: 'Time Workspace Action',
        weight: 900,
        api: TimeAction,
        meta: {
            label: 'Time Action',
            look: 'primary',
            color: 'default',
        },
        conditions: [
            {
                alias: UMB_WORKSPACE_CONDITION_ALIAS,
                match: 'Umb.Workspace.Document',
            },
        ],
    },
];
