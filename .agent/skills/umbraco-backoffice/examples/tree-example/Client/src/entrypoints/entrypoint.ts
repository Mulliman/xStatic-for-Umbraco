import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import type {
  UmbEntryPointOnInit,
  UmbEntryPointOnUnload,
} from "@umbraco-cms/backoffice/extension-api";
import { client } from "../api";

// load up the manifests here
export const onInit: UmbEntryPointOnInit = (_host, _extensionRegistry) => {
  console.log('🚀 Entrypoint onInit called');
  _host.consumeContext(UMB_AUTH_CONTEXT, (_auth) => {
    console.log('🔐 Auth context received:', !!_auth);
    if (!_auth) return;
    const config = _auth.getOpenApiConfiguration();
    console.log('🔧 OpenAPI config:', { base: config.base, credentials: config.credentials });

    client.setConfig({
      baseUrl: config.base,
      credentials: config.credentials,
    });
    console.log('✅ API client configured with baseUrl:', config.base);

    client.interceptors.request.use(async (request, _options) => {
      const token = await _auth.getLatestToken();
      request.headers.set("Authorization", `Bearer ${token}`);
      return request;
    });
  });
};

export const onUnload: UmbEntryPointOnUnload = (_host, _extensionRegistry) => {
  console.log("Goodbye from my extension 👋");
};
