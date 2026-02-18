import type {
  UmbEntryPointOnInit,
  UmbEntryPointOnUnload,
} from "@umbraco-cms/backoffice/extension-api";

// Entry point for the extension
// This runs when the extension is loaded into the backoffice
export const onInit: UmbEntryPointOnInit = (_host, _extensionRegistry) => {
  console.log("Blueprint extension loaded");

  // If you have a custom API client, configure it here:
  // _host.consumeContext(UMB_AUTH_CONTEXT, async (authContext) => {
  //   const config = authContext?.getOpenApiConfiguration();
  //   // Set up your API client with auth token
  // });
};

export const onUnload: UmbEntryPointOnUnload = (_host, _extensionRegistry) => {
  console.log("Blueprint extension unloaded");
};
