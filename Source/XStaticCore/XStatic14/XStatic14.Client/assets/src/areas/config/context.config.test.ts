import { afterEach, describe, expect, it, vi } from 'vitest';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { customElement } from '@umbraco-cms/backoffice/external/lit';
import { V1Service, type XStaticConfig, type XStaticSettings } from '../../api';
import ConfigContext from './context.config';

vi.mock('@umbraco-cms/backoffice/resources', () => ({
	tryExecute: vi.fn((_host: unknown, promise: Promise<unknown>) => promise),
}));

@customElement('test-config-context-host')
class TestConfigContextHost extends UmbLitElement {}

const settings: XStaticSettings = {
	isUsingXStaticRoles: true,
	allowedSecretEnvironmentVariables: ['XSTATIC_*'],
	allowedSecretConfigurationKeys: ['XStatic:Secrets:*'],
};

describe('ConfigContext', () => {
	const contexts: ConfigContext[] = [];

	afterEach(() => {
		for (const ctx of contexts.splice(0)) {
			ctx.destroy();
		}
		document.body.innerHTML = '';
	});

	function createContext() {
		const host = document.createElement('test-config-context-host') as TestConfigContextHost;
		document.body.appendChild(host);
		const ctx = new ConfigContext(host);
		contexts.push(ctx);
		return ctx;
	}

	it('fetches the settings when it is created and exposes them', async () => {
		const settingsSpy = vi
			.spyOn(V1Service, 'getApiV1XstaticConfigGetSettings')
			.mockResolvedValue(settings as never);

		const ctx = createContext();

		const ready = vi.fn();
		ctx.isSettingsReady.subscribe(ready);
		await vi.waitFor(() => expect(ready).toHaveBeenLastCalledWith(true));

		let latest: XStaticSettings | undefined;
		ctx.settings.subscribe((x) => (latest = x)).unsubscribe();

		expect(settingsSpy).toHaveBeenCalledOnce();
		expect(latest).toEqual(settings);
		expect(latest?.allowedSecretEnvironmentVariables).toEqual(['XSTATIC_*']);
		expect(latest?.allowedSecretConfigurationKeys).toEqual(['XStatic:Secrets:*']);
	});

	it('does not refetch the settings once they are loaded', async () => {
		const settingsSpy = vi
			.spyOn(V1Service, 'getApiV1XstaticConfigGetSettings')
			.mockResolvedValue(settings as never);

		const ctx = createContext();
		await ctx.getSettings();
		settingsSpy.mockClear();

		ctx.settings.subscribe(() => undefined).unsubscribe();

		expect(settingsSpy).not.toHaveBeenCalled();
	});

	it('reloads the config when refreshData is called', async () => {
		vi.spyOn(V1Service, 'getApiV1XstaticConfigGetSettings').mockResolvedValue(settings as never);
		const first = { exportTypes: [] } as unknown as XStaticConfig;
		const second = { exportTypes: [{ id: 1, name: 'HTML' }] } as unknown as XStaticConfig;
		const configSpy = vi
			.spyOn(V1Service, 'getApiV1XstaticConfigGetConfig')
			.mockResolvedValueOnce(first as never)
			.mockResolvedValueOnce(second as never);

		const ctx = createContext();

		let latest: XStaticConfig | undefined;
		ctx.config.subscribe((x) => (latest = x));
		await vi.waitFor(() => expect(latest).toEqual(first));

		ctx.refreshData();

		await vi.waitFor(() => expect(latest).toEqual(second));
		expect(configSpy).toHaveBeenCalledTimes(2);
	});
});
