import { ManifestGlobalContext, ManifestModal } from '@umbraco-cms/backoffice/extension-registry';

export const exportTypesModalManifests: Array<ManifestModal> = [
    {
        type: 'modal',
        alias: 'xstatic.editExportTypeModal',
        name: 'Create / Edit Export Type',
        js: () => import('./dialog.edit-export-type.ts'),
    }
];

export const exportTypesContextManifests : Array<ManifestGlobalContext> = [
    {
        type: 'globalContext',
        alias: 'exportType.context',
        name: 'Export Type context',
        js: () => import('./context.export-type.ts')
    }
]