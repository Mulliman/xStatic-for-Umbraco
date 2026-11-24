import { afterEach, describe, expect, it } from 'vitest';
import './element.secret-reference-hint';
import type XStaticSecretReferenceHintElement from './element.secret-reference-hint';

async function render(value: string) {
	const el = document.createElement('xstatic-secret-reference-hint') as XStaticSecretReferenceHintElement;
	el.value = value;
	document.body.appendChild(el);
	await el.updateComplete;
	return el.shadowRoot!.querySelector('.hint') as HTMLElement;
}

describe('xstatic-secret-reference-hint', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('recommends an environment variable when the field is empty', async () => {
		const hint = await render('');

		expect(hint.dataset.hint).toBe('tip');
		expect(hint.textContent).toContain('${env:XSTATIC_YOUR_SECRET}');
	});

	it('warns that a typed-in secret is stored as plain text', async () => {
		const hint = await render('my-real-token');

		expect(hint.dataset.hint).toBe('plain');
		expect(hint.textContent).toContain('plain text');
		expect(hint.textContent).not.toContain('my-real-token');
	});

	it('confirms an allowed reference', async () => {
		const hint = await render('${env:XSTATIC_NETLIFY_TOKEN}');

		expect(hint.dataset.hint).toBe('reference');
		expect(hint.textContent).toContain('XSTATIC_NETLIFY_TOKEN');
	});

	it('flags a reference the default allow-list blocks', async () => {
		const hint = await render('${env:NETLIFY_TOKEN}');

		expect(hint.dataset.hint).toBe('blocked');
		expect(hint.textContent).toContain('NETLIFY_TOKEN');
		expect(hint.textContent).toContain('XStatic:Secrets:AllowedEnvironmentVariables');
	});
});
