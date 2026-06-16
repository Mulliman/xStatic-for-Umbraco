export const manifests: Array<UmbExtensionManifest> = [
    {
        type: 'headerApp',
        alias: 'time.header.app',
        name: 'time app',
        js: () => import('./time-header-element.js'),
        weight: 850,
        meta: {
            label: 'time',
            icon: 'icon-alarm-clock',
            pathname: 'time'
        }
    },
    {
        type: 'modal',
        alias: 'time.header.modal',
        name: 'time header modal',
        js: () => import('./time-header-modal.js'),
    }
];
