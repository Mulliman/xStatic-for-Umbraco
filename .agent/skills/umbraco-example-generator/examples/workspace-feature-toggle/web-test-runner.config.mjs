import { esbuildPlugin } from '@web/dev-server-esbuild';
import { playwrightLauncher } from '@web/test-runner-playwright';

const headless = process.env.HEADLESS !== 'false';
const slowMo = headless ? 0 : 1000; // Slow down headed tests for visibility (1 second per action)

export default {
	files: ['*.test.ts'],
	nodeResolve: true,
	browsers: [playwrightLauncher({ product: 'chromium', launchOptions: { headless, slowMo } })],
	plugins: [
		esbuildPlugin({ ts: true, tsconfig: './tsconfig.json' }),
	],
	testRunnerHtml: (testFramework) =>
		`<html>
			<head>
				<script type="module" src="${testFramework}"></script>
			</head>
			<body></body>
		</html>`,
};
