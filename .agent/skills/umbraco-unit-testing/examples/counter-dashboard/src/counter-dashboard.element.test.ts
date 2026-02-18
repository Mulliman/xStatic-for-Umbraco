import { expect, fixture, defineCE } from '@open-wc/testing';
import { html } from 'lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { CounterContext } from './counter-context.js';
import './counter-dashboard.element.js';
import type { CounterDashboardElement } from './counter-dashboard.element.js';

// Create a test host element for the context
class TestHostElement extends UmbLitElement {}
const testHostTag = defineCE(TestHostElement);

describe('CounterDashboardElement', () => {
	describe('basic rendering', () => {
		let element: CounterDashboardElement;

		beforeEach(async () => {
			element = await fixture(html`<counter-dashboard></counter-dashboard>`);
		});

		it('renders the dashboard container', () => {
			const dashboard = element.shadowRoot?.querySelector('.dashboard');
			expect(dashboard).to.exist;
		});

		it('renders the title', () => {
			const title = element.shadowRoot?.querySelector('h1');
			expect(title?.textContent).to.include('Counter Dashboard');
		});

		it('renders the count display', () => {
			const display = element.shadowRoot?.querySelector('.count-display');
			expect(display).to.exist;
		});

		it('renders control buttons', () => {
			const incrementBtn = element.shadowRoot?.querySelector('.increment-btn');
			const decrementBtn = element.shadowRoot?.querySelector('.decrement-btn');
			const resetBtn = element.shadowRoot?.querySelector('.reset-btn');

			expect(incrementBtn).to.exist;
			expect(decrementBtn).to.exist;
			expect(resetBtn).to.exist;
		});
	});

	describe('with context', () => {
		let element: CounterDashboardElement;
		let context: CounterContext;
		let hostElement: UmbLitElement;

		beforeEach(async () => {
			// 1. Create host for context
			hostElement = await fixture(`<${testHostTag}></${testHostTag}>`);

			// 2. Create context on host
			context = new CounterContext(hostElement);

			// 3. Create element as child (so it can consume context)
			element = await fixture(html`<counter-dashboard></counter-dashboard>`, {
				parentNode: hostElement,
			});

			await element.updateComplete;
		});

		it('displays initial count of 0', async () => {
			await element.updateComplete;
			const display = element.shadowRoot?.querySelector('.count-display');
			expect(display?.textContent?.trim()).to.equal('0');
		});

		it('updates display when context increments', async () => {
			context.increment();
			await element.updateComplete;

			const display = element.shadowRoot?.querySelector('.count-display');
			expect(display?.textContent?.trim()).to.equal('1');
		});

		it('updates display when context decrements', async () => {
			context.increment();
			context.increment();
			await element.updateComplete;

			const display = element.shadowRoot?.querySelector('.count-display');
			expect(display?.textContent?.trim()).to.equal('2');

			context.decrement();
			await element.updateComplete;

			expect(display?.textContent?.trim()).to.equal('1');
		});

		it('updates display when context resets', async () => {
			context.increment();
			context.increment();
			context.increment();
			await element.updateComplete;

			const display = element.shadowRoot?.querySelector('.count-display');
			expect(display?.textContent?.trim()).to.equal('3');

			context.reset();
			await element.updateComplete;

			expect(display?.textContent?.trim()).to.equal('0');
		});
	});

	describe('button interactions with context', () => {
		let element: CounterDashboardElement;
		let context: CounterContext;
		let hostElement: UmbLitElement;

		beforeEach(async () => {
			hostElement = await fixture(`<${testHostTag}></${testHostTag}>`);
			context = new CounterContext(hostElement);
			element = await fixture(html`<counter-dashboard></counter-dashboard>`, {
				parentNode: hostElement,
			});
			await element.updateComplete;
		});

		it('increments when increment button is clicked', async () => {
			const button = element.shadowRoot?.querySelector('.increment-btn') as HTMLButtonElement;
			button?.click();
			await element.updateComplete;

			const display = element.shadowRoot?.querySelector('.count-display');
			expect(display?.textContent?.trim()).to.equal('1');
		});

		it('decrements when decrement button is clicked', async () => {
			// First increment a few times
			context.increment();
			context.increment();
			await element.updateComplete;

			const button = element.shadowRoot?.querySelector('.decrement-btn') as HTMLButtonElement;
			button?.click();
			await element.updateComplete;

			const display = element.shadowRoot?.querySelector('.count-display');
			expect(display?.textContent?.trim()).to.equal('1');
		});

		it('resets when reset button is clicked', async () => {
			// First increment
			context.increment();
			context.increment();
			context.increment();
			await element.updateComplete;

			const button = element.shadowRoot?.querySelector('.reset-btn') as HTMLButtonElement;
			button?.click();
			await element.updateComplete;

			const display = element.shadowRoot?.querySelector('.count-display');
			expect(display?.textContent?.trim()).to.equal('0');
		});

		it('handles multiple rapid clicks', async () => {
			const button = element.shadowRoot?.querySelector('.increment-btn') as HTMLButtonElement;

			// Click rapidly
			button?.click();
			button?.click();
			button?.click();
			button?.click();
			button?.click();

			await element.updateComplete;

			const display = element.shadowRoot?.querySelector('.count-display');
			expect(display?.textContent?.trim()).to.equal('5');
		});
	});
});
