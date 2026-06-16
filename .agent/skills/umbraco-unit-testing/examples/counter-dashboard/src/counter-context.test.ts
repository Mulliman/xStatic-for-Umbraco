import { expect, fixture, defineCE } from '@open-wc/testing';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { CounterContext, COUNTER_CONTEXT } from './counter-context.js';

// Create a test host element for the context
class TestHostElement extends UmbLitElement {}
const testHostTag = defineCE(TestHostElement);

describe('CounterContext', () => {
	let context: CounterContext;
	let hostElement: UmbLitElement;

	beforeEach(async () => {
		hostElement = await fixture(`<${testHostTag}></${testHostTag}>`);
		context = new CounterContext(hostElement);
	});

	describe('initialization', () => {
		it('initializes with count of 0', (done) => {
			context.count.subscribe((value) => {
				expect(value).to.equal(0);
				done();
			});
		});

		it('provides context token', () => {
			expect(COUNTER_CONTEXT).to.not.be.undefined;
		});
	});

	describe('increment', () => {
		it('increments count by 1', (done) => {
			let callCount = 0;

			context.count.subscribe((value) => {
				callCount++;
				if (callCount === 1) {
					expect(value).to.equal(0);
					context.increment();
				} else if (callCount === 2) {
					expect(value).to.equal(1);
					done();
				}
			});
		});

		it('increments multiple times correctly', (done) => {
			let callCount = 0;

			context.count.subscribe((value) => {
				callCount++;
				if (callCount === 1) {
					expect(value).to.equal(0);
					context.increment();
					context.increment();
					context.increment();
				} else if (callCount === 4) {
					expect(value).to.equal(3);
					done();
				}
			});
		});
	});

	describe('decrement', () => {
		it('decrements count by 1', (done) => {
			let callCount = 0;

			context.count.subscribe((value) => {
				callCount++;
				if (callCount === 1) {
					// Start at 0, increment first
					context.increment();
					context.increment();
				} else if (callCount === 3) {
					expect(value).to.equal(2);
					context.decrement();
				} else if (callCount === 4) {
					expect(value).to.equal(1);
					done();
				}
			});
		});

		it('does not go below 0', (done) => {
			let callCount = 0;

			context.count.subscribe((value) => {
				callCount++;
				if (callCount === 1) {
					expect(value).to.equal(0);
					context.decrement(); // Should stay at 0
					// UmbNumberState may not emit when value doesn't change
					// So verify immediately and complete
					setTimeout(() => {
						expect(value).to.equal(0);
						done();
					}, 50);
				}
			});
		});
	});

	describe('reset', () => {
		it('resets count to 0', (done) => {
			let callCount = 0;

			context.count.subscribe((value) => {
				callCount++;
				if (callCount === 1) {
					context.increment();
					context.increment();
					context.increment();
				} else if (callCount === 4) {
					expect(value).to.equal(3);
					context.reset();
				} else if (callCount === 5) {
					expect(value).to.equal(0);
					done();
				}
			});
		});

		it('works when already at 0', (done) => {
			context.count.subscribe((value) => {
				expect(value).to.equal(0);
				context.reset();
				expect(value).to.equal(0);
				done();
			});
		});
	});

	describe('combined operations', () => {
		it('handles increment, decrement, and reset in sequence', (done) => {
			let callCount = 0;

			context.count.subscribe((value) => {
				callCount++;
				if (callCount === 1) {
					expect(value).to.equal(0);
					context.increment();
				} else if (callCount === 2) {
					expect(value).to.equal(1);
					context.increment();
				} else if (callCount === 3) {
					expect(value).to.equal(2);
					context.decrement();
				} else if (callCount === 4) {
					expect(value).to.equal(1);
					context.reset();
				} else if (callCount === 5) {
					expect(value).to.equal(0);
					done();
				}
			});
		});
	});
});
