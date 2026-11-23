import { UmbEntryPointOnInit } from '@umbraco-cms/backoffice/extension-api';
// import { ManifestTypes } from '@umbraco-cms/backoffice/extension-registry';
import { UMB_AUTH_CONTEXT } 
  from '@umbraco-cms/backoffice/auth';
import { OpenAPI } 
  from './api/index.ts';

// load up the manifests here.
import manifests from './manifests.ts';

const manifestsList: Array<UmbExtensionManifest> = [
    ...manifests
];

export const onInit: UmbEntryPointOnInit = (_host, extensionRegistry) => {
    manifestsList.forEach((manifest) => {
      if(!extensionRegistry.isRegistered(manifest.alias)){
        extensionRegistry.register(manifest);
      }
    });

    _host.consumeContext(UMB_AUTH_CONTEXT, (_auth) =>  {
        const umbOpenApi = _auth?.getOpenApiConfiguration();

        if (!umbOpenApi) {
            console.warn('No OpenAPI configuration found in auth context.');
            return;
        }

        // Umbraco 19 signs the backoffice in with an auth cookie (no bearer token), so send credentials.
        OpenAPI.BASE = umbOpenApi.base!;
        OpenAPI.WITH_CREDENTIALS = true;
        OpenAPI.CREDENTIALS = umbOpenApi.credentials ?? 'include';
    });
};