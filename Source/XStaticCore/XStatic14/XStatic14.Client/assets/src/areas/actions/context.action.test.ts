import { afterEach, describe, expect, it, vi } from 'vitest';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { customElement } from '@umbraco-cms/backoffice/external/lit';
import { umbConfirmModal } from '@umbraco-cms/backoffice/modal';
import { V1Service } from '../../api';
import { getConfigVersion } from '../../code/config-changes';
import ActionContext from './context.action';

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

@customElement('test-action-context-host')
class TestActionContextHost extends UmbLitElement {}

describe('ActionContext', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('returns cleanly without deleting when confirm modal is cancelled', async () => {
		vi.mocked(umbConfirmModal).mockRejectedValue(new Error('cancelled'));
		const deleteSpy = vi
			.spyOn(V1Service, 'deleteApiV1XstaticActionsDeletePostAction')
			.mockResolvedValue(undefined as never);

		const host = document.createElement('test-action-context-host') as TestActionContextHost;
		document.body.appendChild(host);
		const ctx = new ActionContext(host);

		await expect(ctx.deleteAction(1)).resolves.toBeUndefined();
		expect(deleteSpy).not.toHaveBeenCalled();
	});

	function createContext() {
		const host = document.createElement('test-action-context-host') as TestActionContextHost;
		document.body.appendChild(host);
		return new ActionContext(host);
	}

	it('creates an action, reloads the list and notifies other dashboards', async () => {
		const created = { id: 3, name: 'Webhook' };
		const createSpy = vi
			.spyOn(V1Service, 'postApiV1XstaticActionsCreatePostAction')
			.mockResolvedValue(created as never);
		const getSpy = vi.spyOn(V1Service, 'getApiV1XstaticActionsGetPostActions').mockResolvedValue([created] as never);
		const before = getConfigVersion();

		const result = await createContext().createAction({ id: 0, name: 'Webhook' } as never);

		expect(result).toEqual(created);
		expect(createSpy).toHaveBeenCalledOnce();
		expect(getSpy).toHaveBeenCalledOnce();
		expect(getConfigVersion()).toBe(before + 1);
	});

	it('updates an action and notifies other dashboards', async () => {
		const updated = { id: 3, name: 'Renamed' };
		vi.spyOn(V1Service, 'postApiV1XstaticActionsUpdatePostAction').mockResolvedValue(updated as never);
		vi.spyOn(V1Service, 'getApiV1XstaticActionsGetPostActions').mockResolvedValue([updated] as never);
		const before = getConfigVersion();

		const result = await createContext().updateAction({ id: 3, name: 'Renamed' } as never);

		expect(result).toEqual(updated);
		expect(getConfigVersion()).toBe(before + 1);
	});

	it('does not notify other dashboards when creating or updating fails', async () => {
		vi.spyOn(V1Service, 'postApiV1XstaticActionsCreatePostAction').mockResolvedValue(undefined as never);
		vi.spyOn(V1Service, 'postApiV1XstaticActionsUpdatePostAction').mockResolvedValue(undefined as never);
		const getSpy = vi.spyOn(V1Service, 'getApiV1XstaticActionsGetPostActions').mockResolvedValue([] as never);
		const before = getConfigVersion();
		const ctx = createContext();

		expect(await ctx.createAction({ id: 0 } as never)).toBeNull();
		expect(await ctx.updateAction({ id: 3 } as never)).toBeNull();

		expect(getSpy).not.toHaveBeenCalled();
		expect(getConfigVersion()).toBe(before);
	});
});
