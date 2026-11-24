import { afterEach, describe, expect, it } from 'vitest';
import './dialog.deployment-target';
import type EditDeploymentTargetModalElement from './dialog.deployment-target';

describe('xstatic-edit-deployment-target-modal', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('renders the name, deployer and configuration properties with Cancel and Submit buttons', async () => {
		const el = document.createElement(
			'xstatic-edit-deployment-target-modal',
		) as EditDeploymentTargetModalElement;
		document.body.appendChild(el);
		await el.updateComplete;

		const labels = Array.from(el.shadowRoot?.querySelectorAll('uui-button') ?? []).map((b) => b.getAttribute('label'));
		expect(labels).toEqual(['Cancel', 'Submit']);

		const aliases = Array.from(el.shadowRoot?.querySelectorAll('umb-property') ?? []).map((p) =>
			p.getAttribute('data-test-alias'),
		);
		expect(aliases).toEqual(['name', 'deployerDefinition', 'fields']);
	});
});
