import { css, customElement, html, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { CONFIG_CONTEXT_TOKEN } from '../areas/config/context.config';
import {
	DEFAULT_ALLOWED_ENVIRONMENT_VARIABLES,
	exampleEnvironmentVariable,
} from '../code/secret-reference';

export const PASSWORD_EDITOR_UI_ALIAS = 'xstatic.propertyEditorUi.password';

/** True when any of the fields holds a secret, so the forms know whether to show the tip. */
export function hasSecretField(fields: Array<{ editorUiAlias?: string | null }> | null | undefined): boolean {
	return (fields ?? []).some((f) => f.editorUiAlias === PASSWORD_EDITOR_UI_ALIAS);
}

/**
 * The box shown above deployment target and action settings that hold a password or token. It recommends
 * secret references (${env:NAME}) over typing the secret in, and says which variables this site allows.
 */
@customElement('xstatic-secret-reference-tip')
export class XStaticSecretReferenceTipElement extends UmbLitElement {
	@state()
	private _allowedEnvironmentVariables: ReadonlyArray<string> = DEFAULT_ALLOWED_ENVIRONMENT_VARIABLES;

	constructor() {
		super();

		this.consumeContext(CONFIG_CONTEXT_TOKEN, (context) => {
			this.observe(context?.settings, (settings) => {
				if (settings?.allowedSecretEnvironmentVariables?.length) {
					this._allowedEnvironmentVariables = settings.allowedSecretEnvironmentVariables;
				}
			});
		});
	}

	override render() {
		const example = exampleEnvironmentVariable(this._allowedEnvironmentVariables);

		return html`
			<div class="tip">
				<uui-icon name="icon-lock"></uui-icon>
				<div>
					<strong>Keep passwords and tokens out of the database.</strong>
					Instead of typing a secret here, store it in an environment variable on the server and type
					<code>\${env:${example}}</code>. xStatic reads the variable each time it deploys, so only the
					reference is saved and the secret is never sent back to the browser. This site allows environment
					variables matching <code>${this._allowedEnvironmentVariables.join(', ')}</code>.
					See <strong>Secrets and environment variables</strong> in xStatic's <strong>Documentation</strong>
					for configuration keys, Azure Key Vault and how to allow other names.
				</div>
			</div>
		`;
	}

	static override styles = [
		css`
			.tip {
				display: flex;
				gap: 10px;
				padding: 10px;
				margin-bottom: 10px;
				border-left: 4px solid var(--uui-color-positive);
				background: var(--uui-color-surface-alt);
				line-height: 1.5;
			}

			.tip uui-icon {
				flex: 0 0 auto;
				margin-top: 3px;
			}

			code {
				font-family: var(--uui-font-monospace, monospace);
				overflow-wrap: anywhere;
			}
		`,
	];
}

export default XStaticSecretReferenceTipElement;

declare global {
	interface HTMLElementTagNameMap {
		'xstatic-secret-reference-tip': XStaticSecretReferenceTipElement;
	}
}
