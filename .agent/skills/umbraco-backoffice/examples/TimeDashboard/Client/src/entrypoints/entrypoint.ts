import type {
  UmbEntryPointOnInit,
  UmbEntryPointOnUnload,
} from "@umbraco-cms/backoffice/extension-api";
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import { client } from "../api/client.gen.js";

export const onInit: UmbEntryPointOnInit = (_host, _extensionRegistry) => {
  console.log("Time Dashboard extension loaded");

  _host.consumeContext(UMB_AUTH_CONTEXT, async (authContext) => {
    if (!authContext) return;

    const config = authContext.getOpenApiConfiguration();
    if (config) {
      client.setConfig({
        baseUrl: config.base ?? '',
        credentials: config.credentials ?? 'same-origin',
      });

      // Set up auth interceptor
      client.interceptors.request.use(async (request) => {
        const token = config.token;
        if (token) {
          const tokenValue = typeof token === 'function' ? await token() : token;
          if (tokenValue) {
            request.headers.set('Authorization', `Bearer ${tokenValue}`);
          }
        }
        return request;
      });
    }
  });
};

export const onUnload: UmbEntryPointOnUnload = (_host, _extensionRegistry) => {
  console.log("Time Dashboard extension unloaded");
};
