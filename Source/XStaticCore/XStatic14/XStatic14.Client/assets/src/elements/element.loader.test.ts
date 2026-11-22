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

	it('clears the interval when disconnected from the DOM', async () => {
		const el = document.createElement('xstatic-loader') as Loader;
		el.estimatedTime = 20;
		document.body.appendChild(el);
		await el.updateComplete;

		vi.advanceTimersByTime(3000);
		await el.updateComplete;
		expect(el.time).toBe(3);

		el.remove();

		vi.advanceTimersByTime(5000);
		expect(el.time).toBe(3);
	});

	it('does not divide by zero or jump to 100% when estimatedTime is 0 or negative', async () => {
		const el = document.createElement('xstatic-loader') as Loader;
		el.estimatedTime = 0;
		document.body.appendChild(el);
		await el.updateComplete;

		vi.advanceTimersByTime(3000);
		await el.updateComplete;
		expect(Number.isNaN(el.progress)).toBe(false);
		expect(Number.isFinite(el.progress)).toBe(true);
		expect(el.progress).toBe(1);
		expect(el.time).toBe(3);
		expect(el.shadowRoot?.textContent).toContain('0:03 of 0:00');

		el.estimatedTime = -5;
		vi.advanceTimersByTime(2000);
		await el.updateComplete;
		expect(el.progress).toBe(1);
	});
});
