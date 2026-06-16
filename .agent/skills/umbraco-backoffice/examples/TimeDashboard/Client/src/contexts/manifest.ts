export const manifests: Array<UmbExtensionManifest> = [
    {
        type: 'globalContext',
        alias: 'time.context',
        name: 'Time context',
        api: () => import('./time.context.js')
    }
];
