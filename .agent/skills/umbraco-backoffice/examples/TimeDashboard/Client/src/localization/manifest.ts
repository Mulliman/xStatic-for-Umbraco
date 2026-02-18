export const manifests: Array<UmbExtensionManifest> = [
    {
        type: 'localization',
        alias: 'time.lang.enus',
        name: 'English (US)',
        weight: 0,
        meta: {
            culture: 'en-us'
        },
        js: () => import('./files/en-us.js')
    },
    {
        type: 'localization',
        alias: 'time.lang.engb',
        name: 'English (UK)',
        weight: 0,
        meta: {
            culture: 'en-gb'
        },
        js: () => import('./files/en-gb.js')
    },
];
