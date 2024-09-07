import { ManifestGlobalContext, ManifestModal } from '@umbraco-cms/backoffice/extension-registry';

export const deploymentTargetModalManifests: Array<ManifestModal> = [
    {
        type: 'modal',
        alias: 'xstatic.deploymentTargetModal',
        name: 'Create / Edit Deployment Target',
        js: () => import('./dialog.deployment-target.ts'),
    },
    {
        type: 'modal',
        alias: 'xstatic.deploymentTargetCreatorModal',
        name: 'Automatically Create Deployment Target',
        js: () => import('./dialog.deployment-target-creator.ts'),
    }
];

export const deploymentTargetContextManifests : Array<ManifestGlobalContext> = [
    {
        type: 'globalContext',
        alias: 'deploymentTarget.context',
        name: 'Deployment Target context',
        js: () => import('./context.deployment-targets.ts')
    }
]