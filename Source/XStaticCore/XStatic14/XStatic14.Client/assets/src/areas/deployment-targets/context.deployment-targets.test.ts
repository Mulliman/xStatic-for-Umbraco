import { afterEach, describe, expect, it, vi } from 'vitest';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { customElement } from '@umbraco-cms/backoffice/external/lit';
import { umbConfirmModal } from '@umbraco-cms/backoffice/modal';
import { V1Service } from '../../api';
import { getConfigVersion } from '../../code/config-changes';
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

	function createContext() {
		const host = document.createElement('test-deployment-target-context-host') as TestDeploymentTargetContextHost;
		document.body.appendChild(host);
		return new DeploymentTargetContext(host);
	}

	it('creates and updates deployment targets and notifies other dashboards each time', async () => {
		const target = { id: 2, name: 'Netlify' };
		vi.spyOn(V1Service, 'postApiV1XstaticDeploymentTargetsCreateDeploymentTarget').mockResolvedValue(target as never);
		vi.spyOn(V1Service, 'postApiV1XstaticDeploymentTargetsUpdateDeploymentTarget').mockResolvedValue(target as never);
		const getSpy = vi
			.spyOn(V1Service, 'getApiV1XstaticDeploymentTargetsGetDeploymentTargets')
			.mockResolvedValue([target] as never);
		const before = getConfigVersion();
		const ctx = createContext();

		expect(await ctx.createDeploymentTarget({ id: 0, name: 'Netlify' } as never)).toEqual(target);
		expect(getConfigVersion()).toBe(before + 1);

		expect(await ctx.updateDeploymentTarget({ id: 2, name: 'Netlify' } as never)).toEqual(target);
		expect(getConfigVersion()).toBe(before + 2);
		expect(getSpy).toHaveBeenCalledTimes(2);
	});

	it('auto-creates a deployment target and notifies other dashboards', async () => {
		const target = { id: 4, name: 'Auto' };
		vi.spyOn(V1Service, 'postApiV1XstaticDeploymentTargetsAutoCreateDeploymentTarget').mockResolvedValue({
			wasSuccessful: true,
			data: target,
		} as never);
		vi.spyOn(V1Service, 'getApiV1XstaticDeploymentTargetsGetDeploymentTargets').mockResolvedValue([target] as never);
		const before = getConfigVersion();

		expect(await createContext().autoCreateDeploymentTarget({} as never)).toEqual(target);
		expect(getConfigVersion()).toBe(before + 1);
	});

	it('does not notify other dashboards when a create, update or auto-create fails', async () => {
		vi.spyOn(V1Service, 'postApiV1XstaticDeploymentTargetsCreateDeploymentTarget').mockResolvedValue(undefined as never);
		vi.spyOn(V1Service, 'postApiV1XstaticDeploymentTargetsUpdateDeploymentTarget').mockResolvedValue(undefined as never);
		vi.spyOn(V1Service, 'postApiV1XstaticDeploymentTargetsAutoCreateDeploymentTarget').mockResolvedValue({
			wasSuccessful: false,
			message: 'Netlify said no',
		} as never);
		const getSpy = vi
			.spyOn(V1Service, 'getApiV1XstaticDeploymentTargetsGetDeploymentTargets')
			.mockResolvedValue([] as never);
		const before = getConfigVersion();
		const ctx = createContext();

		expect(await ctx.createDeploymentTarget({ id: 0 } as never)).toBeNull();
		expect(await ctx.updateDeploymentTarget({ id: 2 } as never)).toBeNull();
		expect(await ctx.autoCreateDeploymentTarget({} as never)).toBeNull();

		expect(getSpy).not.toHaveBeenCalled();
		expect(getConfigVersion()).toBe(before);
	});
});
