export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "Blueprint Dashboard",
    alias: "Blueprint.Dashboard",
    type: "dashboard",
    js: () => import("./dashboard.element.js"),
    weight: 100,
    meta: {
      label: "Welcome",
      pathname: "welcome",
    },
    conditions: [
      {
        // Dashboard only shows in the Blueprint section
        alias: "Umb.Condition.SectionAlias",
        match: "Blueprint.Section",
      },
    ],
  },
];
