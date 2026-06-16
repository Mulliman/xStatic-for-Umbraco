import { ExampleFeatureToggleContext, EXAMPLE_FEATURE_TOGGLE_CONTEXT } from './feature-toggle-context.js';
import { ExampleFeatureToggleViewElement } from './feature-toggle-view.element.js';
import { ExampleFeatureToggleFooterElement } from './feature-toggle-footer.element.js';
import { expect, fixture, defineCE } from '@open-wc/testing';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { html } from '@umbraco-cms/backoffice/external/lit';

class TestHostElement extends UmbLitElement {}
const testHostElement = defineCE(TestHostElement);

describe('ExampleFeatureToggleContext', () => {
	let element: UmbLitElement;
	let context: ExampleFeatureToggleContext;

	beforeEach(async () => {
		element = await fixture(`<${testHostElement}></${testHostElement}>`);
		context = new ExampleFeatureToggleContext(element);
	});

	describe('Initialization', () => {
		it('initializes with default features', (done) => {
			context.features.subscribe((features) => {
				expect(features).to.be.an('array');
				expect(features.length).to.equal(3);
				done();
			});
		});

		it('has correct default feature IDs', (done) => {
			context.features.subscribe((features) => {
				const ids = features.map((f) => f.id);
				expect(ids).to.include('dark-mode');
				expect(ids).to.include('auto-save');
				expect(ids).to.include('preview-mode');
				done();
			});
		});

		it('has auto-save enabled by default', (done) => {
			context.features.subscribe((features) => {
				const autoSave = features.find((f) => f.id === 'auto-save');
				expect(autoSave?.enabled).to.be.true;
				done();
			});
		});

		it('has dark-mode disabled by default', (done) => {
			context.features.subscribe((features) => {
				const darkMode = features.find((f) => f.id === 'dark-mode');
				expect(darkMode?.enabled).to.be.false;
				done();
			});
		});
	});

	describe('Derived state', () => {
		it('calculates initial active count correctly', (done) => {
			context.activeCount.subscribe((count) => {
				expect(count).to.equal(1);
				done();
			});
		});

		it('allEnabled is false when not all features enabled', (done) => {
			context.allEnabled.subscribe((allEnabled) => {
				expect(allEnabled).to.be.false;
				done();
			});
		});

		it('allDisabled is false when any feature enabled', (done) => {
			context.allDisabled.subscribe((allDisabled) => {
				expect(allDisabled).to.be.false;
				done();
			});
		});
	});

	describe('Toggle functionality', () => {
		it('toggles a disabled feature to enabled', (done) => {
			let callCount = 0;

			context.features.subscribe((features) => {
				callCount++;

				if (callCount === 1) {
					const darkMode = features.find((f) => f.id === 'dark-mode');
					expect(darkMode?.enabled).to.be.false;
					context.toggle('dark-mode');
				} else if (callCount === 2) {
					const darkMode = features.find((f) => f.id === 'dark-mode');
					expect(darkMode?.enabled).to.be.true;
					done();
				}
			});
		});

		it('toggles an enabled feature to disabled', (done) => {
			let callCount = 0;

			context.features.subscribe((features) => {
				callCount++;

				if (callCount === 1) {
					const autoSave = features.find((f) => f.id === 'auto-save');
					expect(autoSave?.enabled).to.be.true;
					context.toggle('auto-save');
				} else if (callCount === 2) {
					const autoSave = features.find((f) => f.id === 'auto-save');
					expect(autoSave?.enabled).to.be.false;
					done();
				}
			});
		});

		it('updates active count when toggling', (done) => {
			let callCount = 0;

			context.activeCount.subscribe((count) => {
				callCount++;

				if (callCount === 1) {
					expect(count).to.equal(1);
					context.toggle('dark-mode');
				} else if (callCount === 2) {
					expect(count).to.equal(2);
					done();
				}
			});
		});

		it('does nothing for non-existent feature ID', (done) => {
			let callCount = 0;

			context.features.subscribe(() => {
				callCount++;

				if (callCount === 1) {
					context.toggle('non-existent');
					setTimeout(() => {
						expect(callCount).to.equal(1);
						done();
					}, 50);
				}
			});
		});
	});

	describe('Enable and Disable', () => {
		it('enables a specific feature', (done) => {
			let callCount = 0;

			context.features.subscribe((features) => {
				callCount++;

				if (callCount === 1) {
					context.enable('dark-mode');
				} else if (callCount === 2) {
					const darkMode = features.find((f) => f.id === 'dark-mode');
					expect(darkMode?.enabled).to.be.true;
					done();
				}
			});
		});

		it('disables a specific feature', (done) => {
			let callCount = 0;

			context.features.subscribe((features) => {
				callCount++;

				if (callCount === 1) {
					context.disable('auto-save');
				} else if (callCount === 2) {
					const autoSave = features.find((f) => f.id === 'auto-save');
					expect(autoSave?.enabled).to.be.false;
					done();
				}
			});
		});

		it('enable does not emit if already enabled', (done) => {
			let callCount = 0;

			context.features.subscribe(() => {
				callCount++;

				if (callCount === 1) {
					context.enable('auto-save');

					setTimeout(() => {
						expect(callCount).to.equal(1);
						done();
					}, 50);
				}
			});
		});
	});

	describe('Enable All and Disable All', () => {
		it('enables all features', (done) => {
			let callCount = 0;

			context.features.subscribe((features) => {
				callCount++;

				if (callCount === 1) {
					context.enableAll();
				} else if (callCount === 2) {
					const allEnabled = features.every((f) => f.enabled);
					expect(allEnabled).to.be.true;
					done();
				}
			});
		});

		it('disables all features', (done) => {
			let callCount = 0;

			context.features.subscribe((features) => {
				callCount++;

				if (callCount === 1) {
					context.disableAll();
				} else if (callCount === 2) {
					const allDisabled = features.every((f) => !f.enabled);
					expect(allDisabled).to.be.true;
					done();
				}
			});
		});

		it('sets allEnabled to true after enableAll', (done) => {
			let callCount = 0;

			context.allEnabled.subscribe((allEnabled) => {
				callCount++;

				if (callCount === 1) {
					expect(allEnabled).to.be.false;
					context.enableAll();
				} else if (callCount === 2) {
					expect(allEnabled).to.be.true;
					done();
				}
			});
		});

		it('sets allDisabled to true after disableAll', (done) => {
			let callCount = 0;

			context.allDisabled.subscribe((allDisabled) => {
				callCount++;

				if (callCount === 1) {
					expect(allDisabled).to.be.false;
					context.disableAll();
				} else if (callCount === 2) {
					expect(allDisabled).to.be.true;
					done();
				}
			});
		});
	});

	describe('Toggle All', () => {
		it('enables all when some are disabled', (done) => {
			let callCount = 0;

			context.activeCount.subscribe((count) => {
				callCount++;

				if (callCount === 1) {
					expect(count).to.equal(1);
					context.toggleAll();
				} else if (callCount === 2) {
					expect(count).to.equal(3);
					done();
				}
			});
		});

		it('disables all when all are enabled', (done) => {
			let callCount = 0;

			context.activeCount.subscribe((count) => {
				callCount++;

				if (callCount === 1) {
					context.enableAll();
				} else if (callCount === 2) {
					expect(count).to.equal(3);
					context.toggleAll();
				} else if (callCount === 3) {
					expect(count).to.equal(0);
					done();
				}
			});
		});
	});

	describe('Synchronous methods', () => {
		it('isEnabled returns correct state', () => {
			expect(context.isEnabled('auto-save')).to.be.true;
			expect(context.isEnabled('dark-mode')).to.be.false;
		});

		it('getActiveCount returns correct count', () => {
			expect(context.getActiveCount()).to.equal(1);
		});
	});

	describe('Reset', () => {
		it('resets features to default state', (done) => {
			let callCount = 0;

			context.features.subscribe((features) => {
				callCount++;

				if (callCount === 1) {
					context.enableAll();
				} else if (callCount === 2) {
					expect(features.every((f) => f.enabled)).to.be.true;
					context.reset();
				} else if (callCount === 3) {
					const autoSave = features.find((f) => f.id === 'auto-save');
					const darkMode = features.find((f) => f.id === 'dark-mode');
					expect(autoSave?.enabled).to.be.true;
					expect(darkMode?.enabled).to.be.false;
					done();
				}
			});
		});
	});

	describe('Context integration', () => {
		it('provides context that can be consumed by other components', () => {
			expect(EXAMPLE_FEATURE_TOGGLE_CONTEXT).to.not.be.undefined;
		});
	});
});

describe('ExampleFeatureToggleViewElement', () => {
	let element: ExampleFeatureToggleViewElement;
	let context: ExampleFeatureToggleContext;
	let hostElement: UmbLitElement;

	beforeEach(async () => {
		hostElement = await fixture(`<${testHostElement}></${testHostElement}>`);
		context = new ExampleFeatureToggleContext(hostElement);

		element = await fixture(html`<example-feature-toggle-view></example-feature-toggle-view>`, {
			parentNode: hostElement,
		});

		await element.updateComplete;
	});

	describe('Feature display', () => {
		it('shows initial feature count', async () => {
			await element.updateComplete;
			const displayText = element.shadowRoot?.textContent;
			expect(displayText).to.include('1 of 3 features enabled');
		});

		it('reflects feature changes when enableAll called', async () => {
			context.enableAll();
			await element.updateComplete;

			const displayText = element.shadowRoot?.textContent;
			expect(displayText).to.include('3 of 3 features enabled');
		});

		it('reflects feature changes when disableAll called', async () => {
			context.disableAll();
			await element.updateComplete;

			const displayText = element.shadowRoot?.textContent;
			expect(displayText).to.include('0 of 3 features enabled');
		});

		it('reflects feature changes when individual feature toggled', async () => {
			context.toggle('dark-mode');
			await element.updateComplete;

			const displayText = element.shadowRoot?.textContent;
			expect(displayText).to.include('2 of 3 features enabled');
		});
	});

	describe('UI interactions', () => {
		it('clicking Enable All button enables all features', async () => {
			const enableAllButton = element.shadowRoot?.querySelector('uui-button[look="secondary"]') as HTMLElement;
			expect(enableAllButton).to.exist;

			enableAllButton.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
			await element.updateComplete;

			const displayText = element.shadowRoot?.textContent;
			expect(displayText).to.include('3 of 3 features enabled');
		});

		it('clicking Disable All button disables all features', async () => {
			// First enable all
			context.enableAll();
			await element.updateComplete;

			// Find Disable All button (second secondary button)
			const buttons = element.shadowRoot?.querySelectorAll('uui-button[look="secondary"]');
			const disableAllButton = buttons?.[1] as HTMLElement;
			expect(disableAllButton).to.exist;

			disableAllButton.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
			await element.updateComplete;

			const displayText = element.shadowRoot?.textContent;
			expect(displayText).to.include('0 of 3 features enabled');
		});

		it('clicking Reset button restores default state', async () => {
			// First enable all
			context.enableAll();
			await element.updateComplete;
			expect(element.shadowRoot?.textContent).to.include('3 of 3 features enabled');

			// Click Reset button
			const resetButton = element.shadowRoot?.querySelector('uui-button[look="outline"]') as HTMLElement;
			expect(resetButton).to.exist;

			resetButton.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
			await element.updateComplete;

			const displayText = element.shadowRoot?.textContent;
			expect(displayText).to.include('1 of 3 features enabled');
		});

		it('clicking a toggle switches the feature state', async () => {
			// Find the first toggle (dark-mode, which is disabled by default)
			const toggles = element.shadowRoot?.querySelectorAll('uui-toggle');
			const darkModeToggle = toggles?.[0] as HTMLElement;
			expect(darkModeToggle).to.exist;

			// Initially 1 of 3 enabled
			expect(element.shadowRoot?.textContent).to.include('1 of 3 features enabled');

			// UUI toggle needs a change event dispatched
			darkModeToggle.dispatchEvent(new Event('change', { bubbles: true }));
			await element.updateComplete;

			// Now 2 of 3 enabled
			expect(element.shadowRoot?.textContent).to.include('2 of 3 features enabled');
		});

		it('clicking multiple toggles updates count correctly', async () => {
			const toggles = element.shadowRoot?.querySelectorAll('uui-toggle');

			// Click dark-mode toggle (enable it)
			(toggles?.[0] as HTMLElement).dispatchEvent(new Event('change', { bubbles: true }));
			await element.updateComplete;
			expect(element.shadowRoot?.textContent).to.include('2 of 3 features enabled');

			// Click preview-mode toggle (enable it)
			(toggles?.[2] as HTMLElement).dispatchEvent(new Event('change', { bubbles: true }));
			await element.updateComplete;
			expect(element.shadowRoot?.textContent).to.include('3 of 3 features enabled');

			// Click auto-save toggle (disable it)
			(toggles?.[1] as HTMLElement).dispatchEvent(new Event('change', { bubbles: true }));
			await element.updateComplete;
			expect(element.shadowRoot?.textContent).to.include('2 of 3 features enabled');
		});
	});
});

describe('ExampleFeatureToggleFooterElement', () => {
	let element: ExampleFeatureToggleFooterElement;
	let context: ExampleFeatureToggleContext;
	let hostElement: UmbLitElement;

	beforeEach(async () => {
		hostElement = await fixture(`<${testHostElement}></${testHostElement}>`);
		context = new ExampleFeatureToggleContext(hostElement);

		element = await fixture(html`<example-feature-toggle-footer></example-feature-toggle-footer>`, {
			parentNode: hostElement,
		});

		await element.updateComplete;
	});

	describe('Status display', () => {
		it('shows initial active count', async () => {
			await element.updateComplete;
			const displayText = element.shadowRoot?.textContent;
			expect(displayText).to.include('1 feature active');
		});

		it('reflects count changes when features enabled', async () => {
			context.enableAll();
			await element.updateComplete;

			const displayText = element.shadowRoot?.textContent;
			expect(displayText).to.include('3 features active');
			expect(displayText).to.include('(all enabled)');
		});

		it('reflects count changes when features disabled', async () => {
			context.disableAll();
			await element.updateComplete;

			const displayText = element.shadowRoot?.textContent;
			expect(displayText).to.include('0 features active');
		});

		it('uses singular form for single feature', async () => {
			await element.updateComplete;
			const displayText = element.shadowRoot?.textContent;
			expect(displayText).to.include('1 feature active');
		});

		it('uses plural form for multiple features', async () => {
			context.enableAll();
			await element.updateComplete;

			const displayText = element.shadowRoot?.textContent;
			expect(displayText).to.include('3 features active');
		});
	});
});
