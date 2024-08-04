import { ManifestGlobalContext } from '@umbraco-cms/backoffice/extension-registry';

export const configContextManifests : Array<ManifestGlobalContext> = [
    {
        type: 'globalContext',
        alias: 'config.context',
        name: 'Config context',
        js: () => import('./context.config.ts')
    }
]