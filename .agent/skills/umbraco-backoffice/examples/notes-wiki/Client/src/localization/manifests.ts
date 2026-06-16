/**
 * Notes Localization Manifest
 *
 * Registers localization files for the Notes Wiki extension.
 *
 * Skills used: umbraco-localization
 */

export const manifests: Array<UmbExtensionManifest> = [
  {
    type: "localization",
    alias: "Notes.Localization.EnUs",
    name: "Notes English (US) Localization",
    meta: {
      culture: "en-us",
    },
    js: () => import("./files/en-us.js"),
  },
];
