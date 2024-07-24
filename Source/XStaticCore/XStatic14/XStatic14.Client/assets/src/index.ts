import { UmbEntryPointOnInit } from '@umbraco-cms/backoffice/extension-api';
import { ManifestTypes } from '@umbraco-cms/backoffice/extension-registry';
import { UMB_AUTH_CONTEXT } 
  from '@umbraco-cms/backoffice/auth';
import { OpenAPI } 
  from './api/index.ts';

// load up the manifests here.
import manifests from './manifests.ts';

const manifestsList: Array<ManifestTypes> = [
    ...manifests
];

export const onInit: UmbEntryPointOnInit = (_host, extensionRegistry) => {
    
    // register them here. 
    extensionRegistry.registerMany(manifestsList);

    _host.consumeContext(UMB_AUTH_CONTEXT, (_auth) => {
        const umbOpenApi = _auth.getOpenApiConfiguration();
        OpenAPI.BASE = umbOpenApi.base;
        OpenAPI.TOKEN = umbOpenApi.token;
        OpenAPI.WITH_CREDENTIALS = umbOpenApi.withCredentials;
        OpenAPI.CREDENTIALS = umbOpenApi.credentials;
    });
};