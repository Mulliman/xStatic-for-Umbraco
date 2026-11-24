import { describe, expect, it } from 'vitest';
import {
	exampleEnvironmentVariable,
	findSecretReferences,
	isSecretNameAllowed,
	matchesSecretPattern,
} from './secret-reference';

describe('findSecretReferences', () => {
	it('finds env and config references, including ones inside a value', () => {
		expect(findSecretReferences('https://${env:XSTATIC_USER}:${config:XStatic:Secrets:Token}@github.com/x.git')).toEqual([
			{ source: 'env', name: 'XSTATIC_USER' },
			{ source: 'config', name: 'XStatic:Secrets:Token' },
		]);
	});

	it('ignores plain values, escaped references and unknown sources', () => {
		expect(findSecretReferences('hunter2')).toEqual([]);
		expect(findSecretReferences('$${env:XSTATIC_TOKEN}')).toEqual([]);
		expect(findSecretReferences('${vault:thing}')).toEqual([]);
		expect(findSecretReferences('${env:}')).toEqual([]);
		expect(findSecretReferences(null)).toEqual([]);
		expect(findSecretReferences(42)).toEqual([]);
	});

	it('accepts any case for the source', () => {
		expect(findSecretReferences('${ENV:XSTATIC_TOKEN}')).toEqual([{ source: 'env', name: 'XSTATIC_TOKEN' }]);
	});
});

describe('matchesSecretPattern', () => {
	it.each([
		['XSTATIC_TOKEN', 'XSTATIC_*', true],
		['xstatic_token', 'XSTATIC_*', true],
		['NETLIFY_TOKEN', 'XSTATIC_*', false],
		['ANYTHING', '*', true],
		['AB', 'A?', true],
		['ABC', 'A?', false],
		['XStatic:Secrets:Netlify', 'XStatic:Secrets:*', true],
		['ConnectionStrings:umbracoDbDSN', 'XStatic:Secrets:*', false],
	])('%s against %s is %s', (name, pattern, expected) => {
		expect(matchesSecretPattern(name, pattern)).toBe(expected);
	});

	it('allows when any pattern matches', () => {
		expect(isSecretNameAllowed('GIT_TOKEN', ['XSTATIC_*', 'GIT_*'])).toBe(true);
		expect(isSecretNameAllowed('GIT_TOKEN', [])).toBe(false);
		expect(isSecretNameAllowed('GIT_TOKEN', undefined)).toBe(false);
	});
});

describe('exampleEnvironmentVariable', () => {
	it('builds an example from the first prefix pattern', () => {
		expect(exampleEnvironmentVariable(['XSTATIC_*'])).toBe('XSTATIC_YOUR_SECRET');
		expect(exampleEnvironmentVariable(['*'])).toBe('YOUR_SECRET');
		expect(exampleEnvironmentVariable(['NETLIFY_AUTH_TOKEN'])).toBe('NETLIFY_AUTH_TOKEN');
		expect(exampleEnvironmentVariable([])).toBe('XSTATIC_YOUR_SECRET');
	});
});
