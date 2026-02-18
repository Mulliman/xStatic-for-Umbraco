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

// Use port 5175 to avoid conflict with other dev servers
const DEV_SERVER_PORT = 5175;

/**
 * Playwright Configuration for Mock Repository Tests
 *
 * This approach uses an in-memory mock repository instead of making API calls.
 * The repository returns static test data without any network requests.
 *
 * Pros:
 * - Fast execution (no network latency)
 * - Simple setup (no MSW handlers needed)
 * - Tests UI rendering and interactions
 *
 * Cons:
 * - Doesn't test actual API integration
 * - Mock data may drift from real API responses
 *
 * Usage:
 *   npm run test:mock-repo
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

  // Start dev server with mock repository enabled (MSW needed for core Umbraco APIs)
  webServer: {
    command: `VITE_EXAMPLE_PATH=${EXTENSION_PATH} VITE_USE_MOCK_REPO=on VITE_UMBRACO_USE_MSW=on npm run dev -- --port ${DEV_SERVER_PORT}`,
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
