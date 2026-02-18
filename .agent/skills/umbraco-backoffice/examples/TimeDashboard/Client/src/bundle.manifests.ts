import { manifests as entrypoints } from "./entrypoints/manifest.js";
import { manifests as contexts } from "./contexts/manifest.js";
import { manifests as sections } from "./sections/manifest.js";
import { manifests as menus } from "./menus/manifest.js";
import { manifests as dashboards } from "./dashboards/manifest.js";
import { manifests as workspaces } from "./workspaces/manifest.js";
import { manifests as headerApps } from "./headerApps/manifest.js";
import { manifests as modals } from "./modals/manifest.js";
import { manifests as propertyEditors } from "./propertyEditors/manifest.js";
import { manifests as documentApps } from "./documentApps/manifest.js";
import { manifests as workspaceActions } from "./actions/workspace/manifest.js";
import { manifests as entityActions } from "./actions/entity/manifest.js";
import { manifests as localization } from "./localization/manifest.js";

export const manifests: Array<UmbExtensionManifest> = [
  ...entrypoints,
  ...contexts,
  ...sections,
  ...menus,
  ...dashboards,
  ...workspaces,
  ...headerApps,
  ...modals,
  ...propertyEditors,
  ...documentApps,
  ...workspaceActions,
  ...entityActions,
  ...localization,
];
