export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "Umb Tree Client Entrypoint",
    alias: "UmbTreeClient.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint.js"),
  },
];
