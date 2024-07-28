import { manifests as dashboardManifests } from "./dashboards/manifest.js";
import { modalManifests } from "./dialogs/manifests.js";
import sectionManifest from "./sections/manifests.js";

const manifests = [
  ...dashboardManifests,
  sectionManifest,
  ...modalManifests
];

export default manifests;
