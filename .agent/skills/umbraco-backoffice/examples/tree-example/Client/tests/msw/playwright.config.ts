import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the extension (Client directory)
const EXTENSION_PATH = resolve(__dirname, '../..');

// Path to Umbraco.Web.UI.Client - set via UMBRACO_CLIENT_PATH env var or .env file
const UMBRACO_CLIENT_PATH = process.env.UMBRACO_CLIENT_PATH;
if (!UMBRACO_CLIENT_PATH) {
	throw new Error('UMBRACO_CLIENT_PATH environment variable is required. See .env.example');
}

// Use port 5176 to avoid conflict with other dev servers
const DEV_SERVER_PORT = 5176;

/**
 * Playwright Configuration for MSW (Mock Service Worker) Tests
 *
 * This approach uses MSW to intercept HTTP requests at the network level.
 * The extension uses the real repository that makes actual API calls,
 * but MSW intercepts those calls and returns mock responses.
 *
 * The extension's index.ts registers MSW handlers via addMockHandlers()
 * when VITE_UMBRACO_USE_MSW=on is set.
 *
 * Pros:
 * - Tests the full HTTP request/response cycle
 * - Closer to real-world behavior
 * - Can test error scenarios, loading states, etc.
 *
 * Cons:
 * - Slightly more complex setup (requires MSW handlers)
 * - Need to maintain handlers matching API contracts
 *
 * Usage:
 *   npm run test:msw
 */
export default defineConfig({
	testDir: '.',
	testMatch: ['*.spec.ts'],
	timeout: 60000,
	expect: { timeout: 15000 },
	fullyParallel: false,
	workers: 1,
	reporter: [['html', { outputFolder: './playwright-report' }], ['list']],
	outputDir: './test-results',

	// Start dev server with extension and MSW enabled
	webServer: {
		command: `VITE_EXAMPLE_PATH=${EXTENSION_PATH} VITE_UMBRACO_USE_MSW=on npm run dev -- --port ${DEV_SERVER_PORT}`,
		cwd: UMBRACO_CLIENT_PATH,
		port: DEV_SERVER_PORT,
		reuseExistingServer: !process.env.CI,
		timeout: 120000,
	},

  use: {
    baseURL: `http://localhost:${DEV_SERVER_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    storageState: undefined,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=IsolateOrigins,site-per-process'],
        },
      },
    },
  ],
});
