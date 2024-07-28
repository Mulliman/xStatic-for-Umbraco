import { ManifestModal } from '@umbraco-cms/backoffice/extension-registry';

export const modalManifests: Array<ManifestModal> = [
    {
        type: 'modal',
        alias: 'xstatic.editSiteModal',
        name: 'Create / Edit Site',
        js: () => import('./site/editSiteDialog.ts'),
    }
];