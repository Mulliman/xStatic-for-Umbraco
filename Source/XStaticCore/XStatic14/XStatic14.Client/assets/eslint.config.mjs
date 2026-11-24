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
			// #83 and #84 removed every var, explicit any and unused variable. Keep it that way.
			'no-var': 'error',
			'prefer-const': 'error',
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{ argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
			],
			'@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
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
