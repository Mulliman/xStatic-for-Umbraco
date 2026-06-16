/**
 * MSW Worker Setup
 *
 * Demonstrates:
 * - MSW v2 setup pattern
 * - Browser worker initialization
 * - Handler registration
 */

// MSW v2 is loaded as IIFE and exposed globally
const { setupWorker } = window.MockServiceWorker;

import { handlers } from './handlers.js';

// Create and export the worker
export const worker = setupWorker(...handlers);

// Start options for tests
export const startOptions = {
	onUnhandledRequest: 'bypass' as const,
	quiet: true,
};

/**
 * Start the MSW worker
 * Call this before running tests
 */
export async function startMocking(): Promise<void> {
	await worker.start(startOptions);
}

/**
 * Stop the MSW worker
 * Call this after tests complete
 */
export function stopMocking(): void {
	worker.stop();
}

/**
 * Reset handlers to defaults
 * Call this between tests to ensure clean state
 */
export function resetHandlers(): void {
	worker.resetHandlers();
}

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
