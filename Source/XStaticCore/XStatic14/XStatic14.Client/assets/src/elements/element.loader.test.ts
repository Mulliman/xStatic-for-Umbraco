import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './element.loader';
import type Loader from './element.loader';

describe('xstatic-loader', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		document.body.innerHTML = '';
		vi.clearAllTimers();
		vi.useRealTimers();
	});

	it('starts at 1% and advances progress every second up to 100%', async () => {
		const el = document.createElement('xstatic-loader') as Loader;
		el.estimatedTime = 10;
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.progress).toBe(1);
		expect(el.shadowRoot?.querySelector('h3')?.textContent).toBe('1%');

		vi.advanceTimersByTime(5000);
		await el.updateComplete;
		expect(el.progress).toBe(50);
		expect(el.shadowRoot?.textContent).toContain('0:05 of 0:10');

		vi.advanceTimersByTime(10000);
		await el.updateComplete;
		expect(el.progress).toBe(100);
	});
});
