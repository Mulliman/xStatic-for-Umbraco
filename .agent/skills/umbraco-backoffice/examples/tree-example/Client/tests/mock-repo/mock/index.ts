// Re-export manifests from src, but replace the repository with our mock version
import { manifests as treeManifests } from '../../../src/settingsTree/manifest.js';
import { manifests as workspaceManifests } from '../../../src/workspace/manifest.js';

// Mock repository manifest (replaces the API-calling one)
const mockRepositoryManifest: UmbExtensionManifest = {
  type: 'repository',
  alias: 'OurTree.Repository',
  name: 'OurTree Repository (Mock)',
  api: () => import('./mock-repository.js'),
};

// Filter out original repository, keep everything else
const filteredTreeManifests = treeManifests.filter(
  (m) => m.alias !== 'OurTree.Repository'
);

// Export combined manifests
export const manifests: Array<UmbExtensionManifest> = [
  mockRepositoryManifest,
  ...filteredTreeManifests,
  ...workspaceManifests,
];
