import { manifests as dashboardManifests } from "./dashboards/manifest.js";
import sectionManifest from "./sections/manifests.js";

const manifests = [
  ...dashboardManifests,
  sectionManifest
];

export default manifests;
