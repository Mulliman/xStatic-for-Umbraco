import { afterEach, describe, expect, it, vi } from 'vitest';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { customElement } from '@umbraco-cms/backoffice/external/lit';
import { umbConfirmModal } from '@umbraco-cms/backoffice/modal';
import { V1Service } from '../../api';
import DeploymentTargetContext from './context.deployment-targets';

vi.mock('@umbraco-cms/backoffice/resources', () => ({
	tryExecute: vi.fn((_host: unknown, promise: Promise<unknown>) => promise),
}));

vi.mock('@umbraco-cms/backoffice/modal', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@umbraco-cms/backoffice/modal')>();
	return {
		...actual,
		umbConfirmModal: vi.fn(),
	};
});

@customElement('test-deployment-target-context-host')
class TestDeploymentTargetContextHost extends UmbLitElement {}

describe('DeploymentTargetContext', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('returns cleanly without deleting when confirm modal is cancelled', async () => {
		vi.mocked(umbConfirmModal).mockRejectedValue(new Error('cancelled'));
		const deleteSpy = vi
			.spyOn(V1Service, 'deleteApiV1XstaticDeploymentTargetsDeleteDeploymentTarget')
			.mockResolvedValue(undefined as never);

		const host = document.createElement('test-deployment-target-context-host') as TestDeploymentTargetContextHost;
		document.body.appendChild(host);
		const ctx = new DeploymentTargetContext(host);

		await expect(ctx.deleteDeploymentTarget(1)).resolves.toBeUndefined();
		expect(deleteSpy).not.toHaveBeenCalled();
	});
});
