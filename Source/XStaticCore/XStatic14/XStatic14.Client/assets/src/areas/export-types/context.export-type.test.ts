import { afterEach, describe, expect, it, vi } from 'vitest';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { customElement } from '@umbraco-cms/backoffice/external/lit';
import { umbConfirmModal } from '@umbraco-cms/backoffice/modal';
import { V1Service } from '../../api';
import { getConfigVersion } from '../../code/config-changes';
import ExportTypeContext from './context.export-type';

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

@customElement('test-export-type-context-host')
class TestExportTypeContextHost extends UmbLitElement {}

describe('ExportTypeContext', () => {
	afterEach(() => {
		document.body.innerHTML = '';
		vi.restoreAllMocks();
	});

	it('returns cleanly without deleting when confirm modal is cancelled', async () => {
		vi.mocked(umbConfirmModal).mockRejectedValue(new Error('cancelled'));
		const deleteSpy = vi
			.spyOn(V1Service, 'deleteApiV1XstaticConfigDeleteExportType')
			.mockResolvedValue(undefined as never);

		const host = document.createElement('test-export-type-context-host') as TestExportTypeContextHost;
		document.body.appendChild(host);
		const ctx = new ExportTypeContext(host);

		await expect(ctx.deleteExportType(1)).resolves.toBeUndefined();
		expect(deleteSpy).not.toHaveBeenCalled();
	});

	function createContext() {
		const host = document.createElement('test-export-type-context-host') as TestExportTypeContextHost;
		document.body.appendChild(host);
		return new ExportTypeContext(host);
	}

	it('creates and updates export types, reloads the config and notifies other dashboards', async () => {
		const exportType = { id: 1, name: 'HTML' };
		vi.spyOn(V1Service, 'postApiV1XstaticConfigCreateExportType').mockResolvedValue(exportType as never);
		vi.spyOn(V1Service, 'postApiV1XstaticConfigUpdateExportType').mockResolvedValue(exportType as never);
		const configSpy = vi
			.spyOn(V1Service, 'getApiV1XstaticConfigGetConfig')
			.mockResolvedValue({ exportTypes: [exportType] } as never);
		const before = getConfigVersion();
		const ctx = createContext();

		expect(await ctx.createExportType({ id: 0, name: 'HTML' } as never)).toEqual(exportType);
		expect(getConfigVersion()).toBe(before + 1);

		expect(await ctx.updateExportType({ id: 1, name: 'HTML' } as never)).toEqual(exportType);
		expect(getConfigVersion()).toBe(before + 2);
		expect(configSpy).toHaveBeenCalledTimes(2);
	});

	it('does not notify other dashboards when creating or updating fails', async () => {
		vi.spyOn(V1Service, 'postApiV1XstaticConfigCreateExportType').mockResolvedValue(undefined as never);
		vi.spyOn(V1Service, 'postApiV1XstaticConfigUpdateExportType').mockResolvedValue(undefined as never);
		const configSpy = vi.spyOn(V1Service, 'getApiV1XstaticConfigGetConfig').mockResolvedValue({} as never);
		const before = getConfigVersion();
		const ctx = createContext();

		expect(await ctx.createExportType({ id: 0 } as never)).toBeNull();
		expect(await ctx.updateExportType({ id: 1 } as never)).toBeNull();

		expect(configSpy).not.toHaveBeenCalled();
		expect(getConfigVersion()).toBe(before);
	});
});
