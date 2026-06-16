import { esbuildPlugin } from '@web/dev-server-esbuild';
import { playwrightLauncher } from '@web/test-runner-playwright';
import { importMapsPlugin } from '@web/dev-server-import-maps';

export default {
	rootDir: '.',
	files: ['./src/**/*.test.ts'],
	nodeResolve: {
		exportConditions: ['development'],
		preferBuiltins: false,
		browser: true,
	},
	browsers: [playwrightLauncher({ product: 'chromium' })],
	plugins: [
		importMapsPlugin({
			inject: {
				importMap: {
					imports: {
						// Map Umbraco backoffice imports (dist-cms structure)
						'@umbraco-cms/backoffice/lit-element':
							'/node_modules/@umbraco-cms/backoffice/dist-cms/packages/core/lit-element/index.js',
						'@umbraco-cms/backoffice/element-api':
							'/node_modules/@umbraco-cms/backoffice/dist-cms/libs/element-api/index.js',
						'@umbraco-cms/backoffice/context-api':
							'/node_modules/@umbraco-cms/backoffice/dist-cms/libs/context-api/index.js',
						'@umbraco-cms/backoffice/class-api':
							'/node_modules/@umbraco-cms/backoffice/dist-cms/libs/class-api/index.js',
						'@umbraco-cms/backoffice/controller-api':
							'/node_modules/@umbraco-cms/backoffice/dist-cms/libs/controller-api/index.js',
						'@umbraco-cms/backoffice/observable-api':
							'/node_modules/@umbraco-cms/backoffice/dist-cms/libs/observable-api/index.js',
						// Lit imports
						lit: '/node_modules/lit/index.js',
						'lit/': '/node_modules/lit/',
						'lit/decorators.js': '/node_modules/lit/decorators.js',
					},
				},
			},
		}),
		esbuildPlugin({
			ts: true,
			tsconfig: './tsconfig.json',
			target: 'auto',
			json: true,
		}),
	],
	testRunnerHtml: (testFramework) =>
		`<html lang="en-us">
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>`,
};
