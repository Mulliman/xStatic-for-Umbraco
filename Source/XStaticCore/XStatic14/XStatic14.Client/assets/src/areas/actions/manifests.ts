import { ManifestGlobalContext, ManifestModal } from '@umbraco-cms/backoffice/extension-registry';

export const actionModalManifests: Array<ManifestModal> = [
    {
        type: 'modal',
        alias: 'xstatic.editActionModal',
        name: 'Create / Edit Action',
        js: () => import('./dialog.action.ts'),
    }
];

export const actionContextManifests : Array<ManifestGlobalContext> = [
    {
        type: 'globalContext',
        alias: 'action.context',
        name: 'Action context',
        js: () => import('./context.action.ts')
    }
]