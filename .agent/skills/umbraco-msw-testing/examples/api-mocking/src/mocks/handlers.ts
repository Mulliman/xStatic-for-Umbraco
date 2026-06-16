/**
 * MSW Handlers for Items API
 *
 * Demonstrates:
 * - MSW v2 syntax with http API
 * - CRUD handlers
 * - Error simulation
 * - Delay simulation
 */

// MSW v2 is loaded as IIFE and exposed globally
const { http, HttpResponse, delay } = window.MockServiceWorker;

import { itemsDb, type Item } from './items.db.js';

// Helper to create API paths (simplified version of umbracoPath)
const apiPath = (path: string) => `/umbraco/management/api/v1${path}`;

export const itemsHandlers = [
	// GET all items
	http.get(apiPath('/items'), () => {
		const items = itemsDb.getAll();

		return HttpResponse.json({
			total: items.length,
			items: items,
		});
	}),

	// GET single item by ID
	http.get(apiPath('/items/:id'), ({ params }) => {
		const id = params.id as string;

		// Simulate forbidden access for testing
		if (id === 'forbidden') {
			return new HttpResponse(null, { status: 403 });
		}

		// Simulate server error for testing
		if (id === 'error') {
			return HttpResponse.json(
				{
					type: 'error',
					status: 500,
					detail: 'Internal server error',
				},
				{ status: 500 }
			);
		}

		const item = itemsDb.getById(id);

		if (!item) {
			return new HttpResponse(null, { status: 404 });
		}

		return HttpResponse.json(item);
	}),

	// POST create new item
	http.post(apiPath('/items'), async ({ request }) => {
		const body = (await request.json()) as Partial<Item>;

		// Validate required fields
		if (!body.name) {
			return HttpResponse.json(
				{
					type: 'validation',
					status: 400,
					detail: 'Validation failed',
					errors: {
						name: ['Name is required'],
					},
				},
				{ status: 400 }
			);
		}

		// Check for duplicate name
		if (itemsDb.getByName(body.name)) {
			return HttpResponse.json(
				{
					type: 'validation',
					status: 400,
					detail: 'Item already exists',
					errors: {
						name: ['An item with this name already exists'],
					},
				},
				{ status: 400 }
			);
		}

		const newItem = itemsDb.create({
			name: body.name,
			description: body.description || '',
		});

		return HttpResponse.json(newItem, {
			status: 201,
			headers: {
				Location: `${apiPath('/items')}/${newItem.id}`,
				'Umb-Generated-Resource': newItem.id,
			},
		});
	}),

	// PUT update item
	http.put(apiPath('/items/:id'), async ({ params, request }) => {
		const id = params.id as string;
		const body = (await request.json()) as Partial<Item>;

		if (!itemsDb.exists(id)) {
			return new HttpResponse(null, { status: 404 });
		}

		const updated = itemsDb.update(id, body);

		return HttpResponse.json(updated);
	}),

	// DELETE item
	http.delete(apiPath('/items/:id'), ({ params }) => {
		const id = params.id as string;

		if (!itemsDb.exists(id)) {
			return new HttpResponse(null, { status: 404 });
		}

		itemsDb.delete(id);

		return new HttpResponse(null, { status: 200 });
	}),
];

// Slow endpoint for testing loading states
export const slowHandlers = [
	http.get(apiPath('/slow'), async () => {
		await delay(2000);
		return HttpResponse.json({ message: 'Finally loaded!' });
	}),
];

// Export all handlers
export const handlers = [...itemsHandlers, ...slowHandlers];
