export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "Time Dashboard Entrypoint",
    alias: "TimeDashboard.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint.js"),
  },
];
