import { ManifestGlobalContext, ManifestModal } from '@umbraco-cms/backoffice/extension-registry';

export const modalManifests: Array<ManifestModal> = [
    {
        type: 'modal',
        alias: 'xstatic.editSiteModal',
        name: 'Create / Edit Site',
        js: () => import('./dialog.edit-site.ts'),
    }
];

export const contextManifests : Array<ManifestGlobalContext> = [
    {
        type: 'globalContext',
        alias: 'site.context',
        name: 'Site context',
        js: () => import('./context.site.ts')
    }
]