import { manifests as dashboardManifests } from "./dashboards/manifest.js";
import { modalManifests, contextManifests } from "./areas/sites/manifests.js";
import { exportTypesModalManifests, exportTypesContextManifests } from "./areas/exportTypes/manifests.js";
import { actionModalManifests, actionContextManifests } from "./areas/actions/manifests.js";
import { manifests as properEditors } from "./propertyEditors/manifests.js";
import sectionManifest from "./sections/manifests.js";

const manifests = [
  ...dashboardManifests,
  sectionManifest,
  ...modalManifests,
  ...contextManifests,
  ...exportTypesModalManifests,
  ...exportTypesContextManifests,
  ...actionModalManifests,
  ...actionContextManifests,
  ...properEditors
];

export default manifests;
