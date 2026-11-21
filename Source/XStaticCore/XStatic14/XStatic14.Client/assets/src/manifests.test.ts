import { describe, expect, it } from 'vitest';
import manifests from './manifests';

describe('xStatic extension manifests', () => {
	it('exports manifests with non-empty type, alias, and name', () => {
		expect(manifests.length).toBeGreaterThan(0);

		for (const manifest of manifests) {
			expect(manifest.type).toBeTruthy();
			expect(manifest.alias).toBeTruthy();
			expect(manifest.name).toBeTruthy();
		}
	});

	it('registers the xStatic section and all six dashboards', () => {
		const section = manifests.find((m) => m.type === 'section');
		expect(section?.alias).toBe('xStatic.Section');

		const dashboardAliases = manifests
			.filter((m) => m.type === 'dashboard')
			.map((m) => m.alias);

		expect(dashboardAliases).toEqual([
			'XStatic.mainDashboard',
			'XStatic.exportTypesDashboard',
			'XStatic.deploymentTargetDashboard',
			'XStatic.actionsDashboard',
			'XStatic.configDashboard',
			'XStatic.infoDashboard',
		]);
	});

	it('registers both user permission conditions', () => {
		const conditionAliases = manifests
			.filter((m) => m.type === 'condition')
			.map((m) => m.alias);

		expect(conditionAliases).toEqual([
			'xStatic.xStaticNormalUserCondition',
			'xStatic.xStaticAdminUserCondition',
		]);
	});
});
