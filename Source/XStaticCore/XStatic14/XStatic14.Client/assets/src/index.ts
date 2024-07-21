import { UmbEntryPointOnInit } from '@umbraco-cms/backoffice/extension-api';
import { ManifestTypes } from '@umbraco-cms/backoffice/extension-registry';

// load up the manifests here.
import manifests from './manifests.ts';

const manifestsList: Array<ManifestTypes> = [
    ...manifests
];

export const onInit: UmbEntryPointOnInit = (_host, extensionRegistry) => {
    
    // register them here. 
    extensionRegistry.registerMany(manifestsList);
};
