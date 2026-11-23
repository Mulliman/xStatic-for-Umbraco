import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { configs as litConfigs } from 'eslint-plugin-lit';
import { configs as wcConfigs } from 'eslint-plugin-wc';

export default tseslint.config(
	{
		ignores: ['src/api/**', 'dist/**', 'node_modules/**'],
	},
	js.configs.recommended,
	...tseslint.configs.recommended,
	litConfigs['flat/recommended'],
	wcConfigs['flat/recommended'],
	{
		files: ['src/**/*.ts'],
		rules: {
			// Tracked in #83 and #84 — keep as warnings until existing code is cleaned up,
			// then promote to 'error'.
			'no-var': 'warn',
			'prefer-const': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
			'lit/no-invalid-html': 'error',
			'lit/no-legacy-template-syntax': 'error',
			'lit/no-duplicate-template-bindings': 'error',
			'lit/no-useless-template-literals': 'warn',
			'lit/attribute-value-entities': 'warn',
			'wc/guard-super-call': 'off',
			'wc/no-constructor-attributes': 'warn',
			'wc/no-invalid-element-name': 'error',
			'wc/no-self-class': 'error',
		},
	},
);
