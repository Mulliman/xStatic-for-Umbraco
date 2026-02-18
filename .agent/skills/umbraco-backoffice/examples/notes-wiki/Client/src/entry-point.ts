/**
 * @fileoverview Notes Wiki Entry Point
 *
 * The entry point is executed when the Notes Wiki extension loads.
 * It's responsible for one-time initialization tasks before the
 * extension's UI becomes available.
 *
 * Entry points in Umbraco implement two lifecycle methods:
 * 1. **onInit** - Called when the extension loads
 * 2. **onUnload** - Called when the extension unloads (cleanup)
 *
 * Common entry point tasks:
 * - Configure API clients with authentication
 * - Register global services
 * - Initialize third-party libraries
 * - Set up event listeners
 *
 * @example
 * // Entry point manifest in bundle.manifests.ts
 * {
 *   name: "Notes Wiki Entry Point",
 *   alias: "Notes.EntryPoint",
 *   type: "backofficeEntryPoint",
 *   js: () => import("./entry-point.js"),
 * }
 *
 * Skills demonstrated: umbraco-entry-point, umbraco-openapi-client
 */

import type {
  UmbEntryPointOnInit,
  UmbEntryPointOnUnload,
} from "@umbraco-cms/backoffice/extension-api";
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import { client } from "./api/client.gen.js";

/**
 * Initializes the Notes Wiki extension.
 *
 * This function runs once when the extension loads. It configures
 * the OpenAPI client with authentication from Umbraco's auth context,
 * enabling authenticated API requests.
 *
 * **Why is this needed?**
 *
 * The Notes Wiki API requires authentication. Umbraco's auth context
 * provides the bearer token and base URL configuration. We pass these
 * to the hey-api generated client so all API calls include proper
 * authentication headers.
 *
 * @param {UmbControllerHost} host - The controller host for context consumption
 * @param {UmbExtensionRegistry} _extensionRegistry - Extension registry (unused)
 *
 * @example
 * // This is called automatically by Umbraco when the extension loads.
 * // You don't need to call it manually.
 */
export const onInit: UmbEntryPointOnInit = (host, _extensionRegistry) => {
  // Consume the auth context to get authentication configuration
  host.consumeContext(UMB_AUTH_CONTEXT, (authContext) => {
    if (!authContext) {
      console.warn("Notes Wiki: Auth context not available");
      return;
    }

    // Get the OpenAPI configuration from Umbraco's auth context
    // This includes: base URL, credentials mode, and token getter
    const config = authContext.getOpenApiConfiguration();

    // Configure the hey-api client with auth settings
    // After this, all API calls will include the bearer token
    client.setConfig({
      baseUrl: config.base,
      credentials: config.credentials,
      auth: config.token,
    });

    console.log("Notes Wiki: API client configured");
  });
};

/**
 * Cleans up when the Notes Wiki extension unloads.
 *
 * This function runs when the extension is being removed or
 * the backoffice is shutting down. Use it to:
 * - Remove event listeners
 * - Cancel pending operations
 * - Clean up resources
 *
 * For this extension, no cleanup is required as the API client
 * configuration is automatically garbage collected.
 */
export const onUnload: UmbEntryPointOnUnload = () => {
  // No cleanup required for this extension
  // The API client configuration is garbage collected automatically
};
