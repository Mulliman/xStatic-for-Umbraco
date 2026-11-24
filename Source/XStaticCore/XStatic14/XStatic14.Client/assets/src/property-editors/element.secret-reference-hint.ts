import { css, customElement, html, nothing, property, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { CONFIG_CONTEXT_TOKEN } from '../areas/config/context.config';
import {
	CONFIGURATION_SETTING_PATH,
	DEFAULT_ALLOWED_CONFIGURATION_KEYS,
	DEFAULT_ALLOWED_ENVIRONMENT_VARIABLES,
	ENVIRONMENT_SETTING_PATH,
	exampleEnvironmentVariable,
	findSecretReferences,
	isSecretNameAllowed,
} from '../code/secret-reference';

/**
 * The line under a password field. It recommends ${env:NAME} when the field is empty, warns when a secret is
 * typed in directly (it's saved as plain text), and confirms or flags a reference against this site's allow-list.
 */
@customElement('xstatic-secret-reference-hint')
export class XStaticSecretReferenceHintElement extends UmbLitElement {
	@property({ type: String })
	value?: string | null;

	@state()
	private _allowedEnvironmentVariables: ReadonlyArray<string> = DEFAULT_ALLOWED_ENVIRONMENT_VARIABLES;

	@state()
	private _allowedConfigurationKeys: ReadonlyArray<string> = DEFAULT_ALLOWED_CONFIGURATION_KEYS;

	constructor() {
		super();

		this.consumeContext(CONFIG_CONTEXT_TOKEN, (context) => {
			this.observe(context?.settings, (settings) => {
				if (settings?.allowedSecretEnvironmentVariables?.length) {
					this._allowedEnvironmentVariables = settings.allowedSecretEnvironmentVariables;
				}
				if (settings?.allowedSecretConfigurationKeys?.length) {
					this._allowedConfigurationKeys = settings.allowedSecretConfigurationKeys;
				}
			});
		});
	}

	override render() {
		const example = html`<code>\${env:${exampleEnvironmentVariable(this._allowedEnvironmentVariables)}}</code>`;
		const references = findSecretReferences(this.value);

		if (references.length > 0) {
			const blocked = references.filter((r) => !isSecretNameAllowed(
				r.name,
				r.source === 'env' ? this._allowedEnvironmentVariables : this._allowedConfigurationKeys));

			if (blocked.length > 0) {
				const first = blocked[0];
				const isEnv = first.source === 'env';
				const patterns = (isEnv ? this._allowedEnvironmentVariables : this._allowedConfigurationKeys).join(', ');

				return html`<p class="hint warning" data-hint="blocked">
					${isEnv ? 'The environment variable' : 'The configuration key'} <code>${first.name}</code> isn't
					allowed on this site, so deploying will fail. Allowed: <code>${patterns}</code>. Rename it to match,
					or ask a developer to add it to <code>${isEnv ? ENVIRONMENT_SETTING_PATH : CONFIGURATION_SETTING_PATH}</code>.
				</p>`;
			}

			const names = references.map((r) => html`<code>${r.name}</code>`);
			const kind = references.every((r) => r.source === 'env')
				? 'environment variable'
				: references.every((r) => r.source === 'config') ? 'configuration key' : 'setting';

			return html`<p class="hint positive" data-hint="reference">
				<uui-icon name="icon-lock"></uui-icon>
				Read from the ${kind}${references.length > 1 ? 's' : ''} ${joinTemplates(names)} each time xStatic uses it.
				Only the reference is saved, not the secret.
			</p>`;
		}

		if (this.value) {
			return html`<p class="hint warning" data-hint="plain">
				This is saved in the database as plain text. It's more secure to keep it in an environment variable
				and type ${example} here instead.
			</p>`;
		}

		return html`<p class="hint" data-hint="tip">
			Recommended: type ${example} to read this from an environment variable instead of saving it in the database.
		</p>`;
	}

	static override styles = [
		css`
			.hint {
				margin: var(--uui-size-space-2, 6px) 0 0;
				font-size: var(--uui-type-small-size, 12px);
				color: var(--uui-color-text-alt);
			}

			.hint.warning {
				color: var(--uui-color-warning-standalone);
			}

			.hint.positive {
				color: var(--uui-color-positive-standalone);
			}

			.hint uui-icon {
				vertical-align: text-bottom;
			}

			code {
				font-family: var(--uui-font-monospace, monospace);
				overflow-wrap: anywhere;
			}
		`,
	];
}

function joinTemplates(items: unknown[]) {
	if (items.length === 0) return nothing;

	return items.map((item, index) => html`${index > 0 ? (index === items.length - 1 ? ' and ' : ', ') : ''}${item}`);
}

export default XStaticSecretReferenceHintElement;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-secret-reference-hint': XStaticSecretReferenceHintElement;
	}
}
