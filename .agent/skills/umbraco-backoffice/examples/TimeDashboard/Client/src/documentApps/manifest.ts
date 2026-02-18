export const manifests: Array<UmbExtensionManifest> = [
    {
        type: 'workspaceView',
        alias: 'time.document.workspace',
        name: 'time contentapp',
        js: () => import('./views/time-workspace-view.js'),
        weight: 10,
        meta: {
            icon: 'icon-alarm-clock',
            pathname: 'time',
            label: 'time'
        },
        conditions: [
            {
                alias: 'Umb.Condition.WorkspaceAlias',
                match: 'Umb.Workspace.Document'
            },
        ],
    }
];
