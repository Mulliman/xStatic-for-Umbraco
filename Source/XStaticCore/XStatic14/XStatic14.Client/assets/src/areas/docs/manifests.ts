import { ManifestGlobalContext } from '@umbraco-cms/backoffice/extension-registry';

export const docsContextManifests : Array<ManifestGlobalContext> = [
    {
        type: 'globalContext',
        alias: 'docs.context',
        name: 'Docs context',
        js: () => import('./context.docs.ts')
    }
]