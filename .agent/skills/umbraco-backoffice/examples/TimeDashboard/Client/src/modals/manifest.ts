export const manifests: Array<UmbExtensionManifest> = [
    {
        type: 'modal',
        alias: 'time.custom.modal',
        name: 'Time custom modal',
        js: () => import('./custom-modal-element.js')
    }
];
