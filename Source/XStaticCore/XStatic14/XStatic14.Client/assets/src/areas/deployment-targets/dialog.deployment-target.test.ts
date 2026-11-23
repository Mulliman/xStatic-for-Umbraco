import { afterEach, describe, expect, it } from 'vitest';
import './dialog.deployment-target';
import type EditDeploymentTargetModalElement from './dialog.deployment-target';

describe('xstatic-edit-deployment-target-modal', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('converts between DeployerField arrays and key-value records', () => {
		const el = document.createElement(
			'xstatic-edit-deployment-target-modal',
		) as EditDeploymentTargetModalElement;

		const record = el.arrayAsRecord([
			{ alias: 'host', name: 'Host', value: 'ftp.example.com' },
			{ alias: 'port', name: 'Port', value: undefined },
		]);
		expect(record).toEqual({ host: 'ftp.example.com', port: null });

		const entries = el.recordAsArray(record);
		expect(entries).toEqual([
			{ key: 'host', value: 'ftp.example.com' },
			{ key: 'port', value: null },
		]);

		expect(el.recordAsArray(null)).toEqual([]);
		expect(el.arrayAsRecord(undefined)).toEqual({});
	});
});
