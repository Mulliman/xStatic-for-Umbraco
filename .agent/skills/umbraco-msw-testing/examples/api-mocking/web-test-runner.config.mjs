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
        <!-- Load MSW v2 as IIFE (global) - exposes http, HttpResponse, delay, setupWorker -->
        <script src="/node_modules/msw/lib/iife/index.js"></script>
      </head>
      <body>
        <script type="module" src="${testFramework}"></script>
      </body>
    </html>`,
};
