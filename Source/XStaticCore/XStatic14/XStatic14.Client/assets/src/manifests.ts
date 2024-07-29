import { manifests as dashboardManifests } from "./dashboards/manifest.js";
import { modalManifests, contextManifests } from "./areas/sites/manifests.js";
import sectionManifest from "./sections/manifests.js";

const manifests = [
  ...dashboardManifests,
  sectionManifest,
  ...modalManifests,
  ...contextManifests
];

export default manifests;
