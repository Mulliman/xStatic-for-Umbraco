export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "Blueprint Entrypoint",
    alias: "Blueprint.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint.js"),
  },
];
