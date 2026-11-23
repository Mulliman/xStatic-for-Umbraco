import { describe, expect, it, vi } from 'vitest';
import { onInit } from './index';
import { OpenAPI } from './api';
import manifests from './manifests';

describe('backoffice entry point onInit', () => {
	it('registers all manifests not already in the registry and configures cookie-based OpenAPI from auth context', async () => {
		const registered = new Set<string>(['xStatic.Section']);
		const register = vi.fn((m: { alias: string }) => registered.add(m.alias));
		const isRegistered = vi.fn((alias: string) => registered.has(alias));

		let authCallback: ((auth: unknown) => Promise<void>) | undefined;
		const host = {
			consumeContext: vi.fn((_token: unknown, cb: (auth: unknown) => Promise<void>) => {
				authCallback = cb;
			}),
		};

		onInit(host as never, { register, isRegistered } as never);

		// xStatic.Section was already registered, so it should not be re-registered
		expect(register).not.toHaveBeenCalledWith(expect.objectContaining({ alias: 'xStatic.Section' }));
		expect(registered.size).toBe(new Set(manifests.map((m) => m.alias)).size);

		expect(authCallback).toBeDefined();
		let callCount = 0;
		const tokenFn = vi.fn(async () => `test-jwt-token-${++callCount}`);
		await authCallback!({
			getOpenApiConfiguration: () => ({
				base: 'https://example.test',
				token: tokenFn,
				credentials: 'include' as const,
			}),
		});

		expect(OpenAPI.BASE).toBe('https://example.test');
		// Umbraco 19 authenticates the backoffice with a cookie, so no bearer token is requested.
		expect(tokenFn).not.toHaveBeenCalled();
		expect(OpenAPI.WITH_CREDENTIALS).toBe(true);
		expect(OpenAPI.CREDENTIALS).toBe('include');
	});
});
