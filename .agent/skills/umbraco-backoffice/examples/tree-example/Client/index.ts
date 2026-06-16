// Entry point for external extension loading
// Supports both mock repository and real API modes via VITE_USE_MOCK_REPO env var
import { manifests as treeManifests } from './src/settingsTree/manifest.js';
import { manifests as workspaceManifests } from './src/workspace/manifest.js';

// Check if mock repository mode is enabled
const useMockRepo = import.meta.env.VITE_USE_MOCK_REPO === 'true';

let finalTreeManifests = treeManifests;

if (useMockRepo) {
  // Mock repository manifest (replaces the API-calling one)
  const mockRepositoryManifest: UmbExtensionManifest = {
    type: 'repository',
    alias: 'OurTree.Repository',
    name: 'OurTree Repository (Mock)',
    api: () => import('./tests/mock-repo/mock/mock-repository.js'),
  };

  // Filter out original repository, keep everything else
  finalTreeManifests = [
    mockRepositoryManifest,
    ...treeManifests.filter((m) => m.alias !== 'OurTree.Repository'),
  ];
}

export const manifests: Array<UmbExtensionManifest> = [
  ...finalTreeManifests,
  ...workspaceManifests,
];
