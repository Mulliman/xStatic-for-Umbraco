import { ManifestGlobalContext, ManifestModal } from '@umbraco-cms/backoffice/extension-registry';

export const deploymentTargetModalManifests: Array<ManifestModal> = [
    {
        type: 'modal',
        alias: 'xstatic.deploymentTargetModal',
        name: 'Create / Edit Deployment Target',
        js: () => import('./dialog.deploymentTarget.ts'),
    }
];

export const deploymentTargetContextManifests : Array<ManifestGlobalContext> = [
    {
        type: 'globalContext',
        alias: 'deploymentTarget.context',
        name: 'Deployment Target context',
        js: () => import('./context.deploymentTargets.ts')
    }
]