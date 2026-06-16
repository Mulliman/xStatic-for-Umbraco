/**
 * MSW handlers for the tree-example custom API endpoints.
 * These handlers mock the C# backend API responses.
 *
 * Usage: Run from Umbraco.Web.UI.Client with:
 *   VITE_EXAMPLE_PATH=/path/to/tree-example/Client VITE_UMBRACO_USE_MSW=on npm run dev
 *
 * The extension's index.ts registers these handlers via addMockHandlers()
 * when running in mock mode.
 */

// Mock data types
interface TreeItem {
	id: string;
	name: string;
	icon: string;
	hasChildren: boolean;
	parent: { id: string } | null;
}

const rootItems: TreeItem[] = [
	{ id: 'msw-a', name: '[MSW] Group A', icon: 'icon-folder', hasChildren: true, parent: null },
	{ id: 'msw-b', name: '[MSW] Group B', icon: 'icon-folder', hasChildren: true, parent: null },
	{ id: 'msw-config', name: '[MSW] Config', icon: 'icon-settings', hasChildren: false, parent: null },
];

const childrenByParent: Record<string, TreeItem[]> = {
	'msw-a': [
		{ id: 'msw-a-1', name: '[MSW] Item A1', icon: 'icon-document', hasChildren: false, parent: { id: 'msw-a' } },
		{ id: 'msw-a-2', name: '[MSW] Item A2', icon: 'icon-document', hasChildren: false, parent: { id: 'msw-a' } },
	],
	'msw-b': [
		{ id: 'msw-b-1', name: '[MSW] Item B1', icon: 'icon-document', hasChildren: false, parent: { id: 'msw-b' } },
	],
};

// API path - relative path for same-origin interception
const API_PATH = '/umbraco/umbtreeclient/api/v1';

/**
 * Creates MSW handlers. Called at runtime when window.MockServiceWorker is available.
 */
export function createHandlers() {
	const { http, HttpResponse } = (window as any).MockServiceWorker;

	return [
		// Handle CORS preflight requests
		http.options(`${API_PATH}/*`, () => {
			return new HttpResponse(null, {
				status: 200,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				},
			});
		}),

		// GET /root - Returns root tree items
		http.get(`${API_PATH}/root`, ({ request }: { request: Request }) => {
			const url = new URL(request.url);
			const skip = Number(url.searchParams.get('skip') || 0);
			const take = Number(url.searchParams.get('take') || 100);

			const items = rootItems.slice(skip, skip + take);

			return HttpResponse.json(
				{
					total: rootItems.length,
					items,
				},
				{
					headers: {
						'Access-Control-Allow-Origin': '*',
					},
				},
			);
		}),

		// GET /Children - Returns children of a parent item
		http.get(`${API_PATH}/Children`, ({ request }: { request: Request }) => {
			const url = new URL(request.url);
			const parentId = url.searchParams.get('parent');

			if (!parentId) {
				// No parent = return root items
				return HttpResponse.json(
					{
						total: rootItems.length,
						items: rootItems,
					},
					{
						headers: {
							'Access-Control-Allow-Origin': '*',
						},
					},
				);
			}

			const children = childrenByParent[parentId] || [];

			return HttpResponse.json(
				{
					total: children.length,
					items: children,
				},
				{
					headers: {
						'Access-Control-Allow-Origin': '*',
					},
				},
			);
		}),

		// GET /Ancestors - Returns ancestors of an item
		http.get(`${API_PATH}/Ancestors`, () => {
			// For simplicity, return empty array (flat structure)
			return HttpResponse.json([], {
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			});
		}),

		// GET /ping - Health check
		http.get(`${API_PATH}/ping`, () => {
			return HttpResponse.json('pong', {
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			});
		}),
	];
}
