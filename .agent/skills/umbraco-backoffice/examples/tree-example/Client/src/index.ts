// Entry point for external extension loading
// Run from Umbraco.Web.UI.Client with:
//   VITE_EXAMPLE_PATH=/path/to/tree-example/Client VITE_UMBRACO_USE_MSW=on npm run dev
//   VITE_EXAMPLE_PATH=/path/to/tree-example/Client VITE_USE_MOCK_REPO=on VITE_UMBRACO_USE_MSW=on npm run dev

// Register MSW handlers when running in MSW mode (but not mock-repo mode)
if (import.meta.env.VITE_UMBRACO_USE_MSW === 'on' && import.meta.env.VITE_USE_MOCK_REPO !== 'on') {
	import('./msw/handlers.js').then(({ createHandlers }) => {
		const { addMockHandlers } = (window as any).MockServiceWorker;
		addMockHandlers(...createHandlers());
	});
}

// Export manifests - use mock repository if VITE_USE_MOCK_REPO is set
export const manifests = import.meta.env.VITE_USE_MOCK_REPO === 'on'
	? (await import('../tests/mock-repo/mock/index.js')).manifests
	: (await import('./bundle.manifests.js')).manifests;
