// Entry point for MSW testing mode
// Uses real repository that makes API calls (intercepted by MSW)
// Run with:
//   VITE_EXTERNAL_EXTENSION=.../tree-example/Client \
//   VITE_EXTERNAL_MOCKS=.../tree-example/Client/tests/msw/mocks \
//   npm run dev:external

// Re-export from src with real repository (NOT mock repository)
import { manifests as treeManifests } from './src/settingsTree/manifest.js';
import { manifests as workspaceManifests } from './src/workspace/manifest.js';

// Export all manifests - the real repository will make API calls
// that MSW intercepts
export const manifests: Array<UmbExtensionManifest> = [
  ...treeManifests,
  ...workspaceManifests,
];
