import { afterEach, describe, expect, it } from 'vitest';
import './element.validation-error';
import type ValidationErrorWrapper from './element.validation-error';

describe('xstatic-validation-error-wrapper', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('renders only the default slot when errorMessage is not set', async () => {
		const el = document.createElement('xstatic-validation-error-wrapper') as ValidationErrorWrapper;
		document.body.appendChild(el);
		await el.updateComplete;

		expect(el.shadowRoot?.querySelector('.error')).toBeNull();
		expect(el.shadowRoot?.querySelector('slot')).not.toBeNull();
	});

	it('renders the error container and message when errorMessage is set', async () => {
		const el = document.createElement('xstatic-validation-error-wrapper') as ValidationErrorWrapper;
		el.errorMessage = 'Site name is required';
		document.body.appendChild(el);
		await el.updateComplete;

		const message = el.shadowRoot?.querySelector('.error-message');
		expect(el.shadowRoot?.querySelector('.error')).not.toBeNull();
		expect(message?.textContent?.trim()).toBe('Site name is required');
		expect(el.shadowRoot?.querySelector('slot')).not.toBeNull();
	});

	it('clears the error container when errorMessage is cleared', async () => {
		const el = document.createElement('xstatic-validation-error-wrapper') as ValidationErrorWrapper;
		el.errorMessage = 'Required';
		document.body.appendChild(el);
		await el.updateComplete;

		el.errorMessage = undefined;
		await el.updateComplete;

		expect(el.shadowRoot?.querySelector('.error')).toBeNull();
	});
});
