import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { customElement } from '@umbraco-cms/backoffice/external/lit';
import { UmbObjectState } from '@umbraco-cms/backoffice/observable-api';
import { UMB_CURRENT_USER_CONTEXT } from '@umbraco-cms/backoffice/current-user';
import { CONFIG_CONTEXT_TOKEN } from '../areas/config/context.config';
import { XStaticRoleConditionBase } from './xstatic-role.condition-base';
import XStaticAdminUserCondition from './xstatic-admin-user.condition';
import XStaticNormalUserCondition from './xstatic-normal-user.condition';
import { XSTATIC_ADMIN_USER_CONDITION_ALIAS, XSTATIC_NORMAL_USER_CONDITION_ALIAS } from './constants';
import { Roles } from '../roles';

@customElement('test-role-condition-host')
class TestRoleConditionHost extends UmbLitElement {}

type ConsumeContext = (token: unknown, cb: (ctx: unknown) => void) => void;

describe('xStatic role conditions', () => {
	let settings: UmbObjectState<{ isUsingXStaticRoles: boolean }>;
	let currentUser: UmbObjectState<{ fallbackPermissions: string[] }>;
	let host: TestRoleConditionHost;
	const conditions: Array<{ destroy(): void }> = [];
	// The real consumeContext resolves after the constructor returns, so subclass fields (allowedRoles) exist
	// by then. Queue the callbacks and run them once the condition is built, to match that.
	let pendingContexts: Array<() => void> = [];

	function provideContexts() {
		for (const provide of pendingContexts.splice(0)) {
			provide();
		}
	}

	beforeEach(() => {
		settings = new UmbObjectState<{ isUsingXStaticRoles: boolean }>({ isUsingXStaticRoles: false });
		currentUser = new UmbObjectState<{ fallbackPermissions: string[] }>({ fallbackPermissions: [] });

		vi.spyOn(XStaticRoleConditionBase.prototype as unknown as { consumeContext: ConsumeContext }, 'consumeContext')
			.mockImplementation((token, cb) => {
				if (token === CONFIG_CONTEXT_TOKEN) {
					pendingContexts.push(() => cb({ settings: settings.asObservable() }));
				} else if (token === UMB_CURRENT_USER_CONTEXT) {
					pendingContexts.push(() => cb({ currentUser: currentUser.asObservable() }));
				}
			});

		host = document.createElement('test-role-condition-host') as TestRoleConditionHost;
		document.body.appendChild(host);
	});

	afterEach(() => {
		pendingContexts = [];
		for (const condition of conditions.splice(0)) {
			condition.destroy();
		}
		document.body.innerHTML = '';
	});

	function createConditions() {
		const admin = new XStaticAdminUserCondition(host, {
			host,
			config: { alias: XSTATIC_ADMIN_USER_CONDITION_ALIAS },
			onChange: () => undefined,
		});
		const normal = new XStaticNormalUserCondition(host, {
			host,
			config: { alias: XSTATIC_NORMAL_USER_CONDITION_ALIAS },
			onChange: () => undefined,
		});
		conditions.push(admin, normal);
		provideContexts();
		return { admin, normal };
	}

	it('permits everyone when xStatic user groups are turned off', () => {
		const { admin, normal } = createConditions();

		expect(admin.permitted).toBe(true);
		expect(normal.permitted).toBe(true);
	});

	it('permits a normal user only the normal-user condition', () => {
		settings.setValue({ isUsingXStaticRoles: true });
		currentUser.setValue({ fallbackPermissions: [Roles.NormalUser] });

		const { admin, normal } = createConditions();

		expect(normal.permitted).toBe(true);
		expect(admin.permitted).toBe(false);
	});

	it('permits an xStatic admin both conditions', () => {
		settings.setValue({ isUsingXStaticRoles: true });
		currentUser.setValue({ fallbackPermissions: [Roles.Admin] });

		const { admin, normal } = createConditions();

		expect(normal.permitted).toBe(true);
		expect(admin.permitted).toBe(true);
	});

	it('denies a user in neither group both conditions', () => {
		settings.setValue({ isUsingXStaticRoles: true });
		currentUser.setValue({ fallbackPermissions: ['someOtherPermission'] });

		const { admin, normal } = createConditions();

		expect(normal.permitted).toBe(false);
		expect(admin.permitted).toBe(false);
	});

	it('updates when the settings turn xStatic user groups on', () => {
		const onChange = vi.fn();
		const admin = new XStaticAdminUserCondition(host, {
			host,
			config: { alias: XSTATIC_ADMIN_USER_CONDITION_ALIAS },
			onChange,
		});
		conditions.push(admin);
		provideContexts();
		expect(admin.permitted).toBe(true);

		settings.setValue({ isUsingXStaticRoles: true });

		expect(admin.permitted).toBe(false);
		expect(onChange).toHaveBeenLastCalledWith(false);
	});
});
