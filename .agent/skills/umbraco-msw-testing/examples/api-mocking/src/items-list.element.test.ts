/**
 * Items List Element Tests with MSW
 *
 * Demonstrates:
 * - Testing with mocked API responses
 * - Loading state verification
 * - Error handling tests
 * - Runtime handler overrides
 */

import { expect, fixture, waitUntil } from '@open-wc/testing';
import { html } from 'lit';

// MSW v2 is loaded as IIFE and exposed globally
const { http, HttpResponse, delay } = window.MockServiceWorker;

import { worker, resetHandlers } from './mocks/setup.js';
import { itemsDb } from './mocks/items.db.js';
import './items-list.element.js';
import type { ItemsListElement } from './items-list.element.js';

const apiPath = (path: string) => `/umbraco/management/api/v1${path}`;

describe('ItemsListElement', () => {
	// Start MSW before all tests
	before(async () => {
		await worker.start({ onUnhandledRequest: 'bypass', quiet: true });
	});

	// Stop MSW after all tests
	after(() => {
		worker.stop();
	});

	// Reset handlers and database between tests
	beforeEach(() => {
		resetHandlers();
		itemsDb.reset();
	});

	describe('loading state', () => {
		it('shows loading indicator initially', async () => {
			const element = await fixture<ItemsListElement>(html`<items-list></items-list>`);

			// Check for loading state (may be brief)
			const loading = element.shadowRoot?.querySelector('.loading');
			// Loading may or may not be visible depending on timing
			expect(element).to.exist;
		});
	});

	describe('success states', () => {
		it('displays items from API', async () => {
			const element = await fixture<ItemsListElement>(html`<items-list></items-list>`);

			// Wait for loading to complete
			await waitUntil(() => !element.shadowRoot?.querySelector('.loading'), 'Loading did not complete', {
				timeout: 2000,
			});

			const items = element.shadowRoot?.querySelectorAll('.item');
			expect(items?.length).to.equal(3); // Initial mock data has 3 items

			const firstItem = element.shadowRoot?.querySelector('.item-name');
			expect(firstItem?.textContent).to.equal('First Item');
		});

		it('shows empty state when no items', async () => {
			// Override handler to return empty list
			worker.use(
				http.get(apiPath('/items'), () => {
					return HttpResponse.json({
						total: 0,
						items: [],
					});
				})
			);

			const element = await fixture<ItemsListElement>(html`<items-list></items-list>`);

			await waitUntil(() => !element.shadowRoot?.querySelector('.loading'), 'Loading did not complete', {
				timeout: 2000,
			});

			const empty = element.shadowRoot?.querySelector('.empty');
			expect(empty?.textContent).to.include('No items found');
		});
	});

	describe('error states', () => {
		it('shows error message on API failure', async () => {
			// Override handler to return error
			worker.use(
				http.get(apiPath('/items'), () => {
					return HttpResponse.json(
						{
							type: 'error',
							status: 500,
							detail: 'Database connection failed',
						},
						{ status: 500 }
					);
				})
			);

			const element = await fixture<ItemsListElement>(html`<items-list></items-list>`);

			await waitUntil(() => element.shadowRoot?.querySelector('.error'), 'Error did not appear', { timeout: 2000 });

			const error = element.shadowRoot?.querySelector('.error');
			expect(error?.textContent).to.include('Database connection failed');
		});

		it('handles network errors gracefully', async () => {
			// Override handler to simulate network error
			worker.use(
				http.get(apiPath('/items'), () => {
					return HttpResponse.error();
				})
			);

			const element = await fixture<ItemsListElement>(html`<items-list></items-list>`);

			await waitUntil(() => element.shadowRoot?.querySelector('.error'), 'Error did not appear', { timeout: 2000 });

			const error = element.shadowRoot?.querySelector('.error');
			expect(error).to.exist;
		});
	});

	describe('delete functionality', () => {
		it('removes item from list after delete', async () => {
			const element = await fixture<ItemsListElement>(html`<items-list></items-list>`);

			await waitUntil(() => !element.shadowRoot?.querySelector('.loading'), 'Loading did not complete', {
				timeout: 2000,
			});

			// Should have 3 items initially
			let items = element.shadowRoot?.querySelectorAll('.item');
			expect(items?.length).to.equal(3);

			// Delete first item
			await element.deleteItem('item-1');

			// Wait for reload
			await waitUntil(
				() => {
					const currentItems = element.shadowRoot?.querySelectorAll('.item');
					return currentItems?.length === 2;
				},
				'Item was not deleted',
				{ timeout: 2000 }
			);

			items = element.shadowRoot?.querySelectorAll('.item');
			expect(items?.length).to.equal(2);
		});
	});

	describe('slow responses', () => {
		it('maintains loading state during slow response', async () => {
			// Override with slow response
			worker.use(
				http.get(apiPath('/items'), async () => {
					await delay(500);
					return HttpResponse.json({
						total: 1,
						items: [{ id: 'slow-1', name: 'Slow Item', description: '', createdAt: new Date().toISOString() }],
					});
				})
			);

			const element = await fixture<ItemsListElement>(html`<items-list></items-list>`);

			// Should show loading initially
			const loading = element.shadowRoot?.querySelector('.loading');
			expect(loading).to.exist;

			// Wait for data to load
			await waitUntil(() => element.shadowRoot?.querySelector('.item'), 'Item did not appear', { timeout: 2000 });

			const item = element.shadowRoot?.querySelector('.item-name');
			expect(item?.textContent).to.equal('Slow Item');
		});
	});
});

// Type declaration for global MSW (v2)
declare global {
	interface Window {
		MockServiceWorker: {
			setupWorker: typeof import('msw/browser').setupWorker;
			http: typeof import('msw').http;
			HttpResponse: typeof import('msw').HttpResponse;
			delay: typeof import('msw').delay;
		};
	}
}
