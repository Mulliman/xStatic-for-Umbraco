/**
 * Helpers for xStatic secret references: `${env:NAME}` and `${config:Section:Key}`.
 * These mirror XStatic.Core/Secrets (SecretReferenceParser and SecretNamePattern) so the backoffice can explain a
 * value before it is saved. The server is the one that actually resolves them, when it deploys or runs an action.
 */

export type SecretReferenceSource = 'env' | 'config';

export type SecretReference = {
	source: SecretReferenceSource;
	name: string;
};

/** The allow-lists the server uses when nothing is configured (XStaticSecretSettings defaults). */
export const DEFAULT_ALLOWED_ENVIRONMENT_VARIABLES: ReadonlyArray<string> = ['XSTATIC_*'];
export const DEFAULT_ALLOWED_CONFIGURATION_KEYS: ReadonlyArray<string> = ['XStatic:Secrets:*'];

export const ENVIRONMENT_SETTING_PATH = 'XStatic:Secrets:AllowedEnvironmentVariables';
export const CONFIGURATION_SETTING_PATH = 'XStatic:Secrets:AllowedConfigurationKeys';

/** Finds the references in a value, ignoring escaped ones (`$${...}`) and anything that isn't `env:` or `config:`. */
export function findSecretReferences(value: unknown): SecretReference[] {
	const references: SecretReference[] = [];

	if (typeof value !== 'string' || !value.includes('${')) {
		return references;
	}

	let i = 0;
	while (i < value.length) {
		if (value[i] === '$' && value[i + 1] === '$' && value[i + 2] === '{') {
			i += 3;
			continue;
		}

		if (value[i] === '$' && value[i + 1] === '{') {
			const end = value.indexOf('}', i + 2);
			if (end >= 0) {
				const reference = parseBody(value.substring(i + 2, end));
				if (reference) {
					references.push(reference);
					i = end + 1;
					continue;
				}
			}
		}

		i++;
	}

	return references;
}

function parseBody(body: string): SecretReference | null {
	const lower = body.toLowerCase();
	let source: SecretReferenceSource;
	let name: string;

	if (lower.startsWith('env:')) {
		source = 'env';
		name = body.substring(4).trim();
	} else if (lower.startsWith('config:')) {
		source = 'config';
		name = body.substring(7).trim();
	} else {
		return null;
	}

	if (!name || name.includes('{')) {
		return null;
	}

	return { source, name };
}

/** Wildcard match: `*` is any run of characters, `?` is one character. Case is ignored, as on the server. */
export function matchesSecretPattern(name: string, pattern: string): boolean {
	const n = name.toUpperCase();
	const p = pattern.trim().toUpperCase();

	let ni = 0;
	let pi = 0;
	let star = -1;
	let starMatch = 0;

	while (ni < n.length) {
		if (pi < p.length && (p[pi] === '?' || p[pi] === n[ni])) {
			ni++;
			pi++;
		} else if (pi < p.length && p[pi] === '*') {
			star = pi++;
			starMatch = ni;
		} else if (star >= 0) {
			pi = star + 1;
			ni = ++starMatch;
		} else {
			return false;
		}
	}

	while (pi < p.length && p[pi] === '*') {
		pi++;
	}

	return pi === p.length;
}

export function isSecretNameAllowed(name: string, patterns: ReadonlyArray<string> | null | undefined): boolean {
	return (patterns ?? []).some((pattern) => !!pattern?.trim() && matchesSecretPattern(name, pattern));
}

/**
 * An example variable name that the allow-list accepts, for help text. `XSTATIC_*` gives `XSTATIC_YOUR_SECRET`.
 */
export function exampleEnvironmentVariable(patterns: ReadonlyArray<string> | null | undefined): string {
	const first = (patterns ?? []).find((p) => !!p?.trim())?.trim() ?? DEFAULT_ALLOWED_ENVIRONMENT_VARIABLES[0];
	const star = first.indexOf('*');

	if (star < 0) {
		return first.includes('?') ? 'YOUR_SECRET' : first;
	}

	const prefix = first.substring(0, star);

	return prefix.includes('?') ? 'YOUR_SECRET' : `${prefix}YOUR_SECRET`;
}
