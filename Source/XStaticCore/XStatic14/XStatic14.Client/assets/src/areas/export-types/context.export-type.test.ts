import { afterEach, describe, expect, it, vi } from 'vitest';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { customElement } from '@umbraco-cms/backoffice/external/lit';
import { umbConfirmModal } from '@umbraco-cms/backoffice/modal';
import { V1Service } from '../../api';
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
});
