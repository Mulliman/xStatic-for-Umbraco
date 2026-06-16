import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const STORAGE_STATE = join(__dirname, '.auth/user.json');

/**
 * Playwright Configuration for E2E Tests
 *
 * These tests run against a real Umbraco instance with the extension installed.
 * They test the full integration with an actual backend.
 *
 * Prerequisites:
 * - Umbraco instance running (e.g., https://localhost:44325)
 * - Extension installed and built
 * - Environment variables set:
 *   - URL: Umbraco backoffice URL (default: https://localhost:44325)
 *   - UMBRACO_USER_LOGIN: Admin email
 *   - UMBRACO_USER_PASSWORD: Admin password
 *
 * Pros:
 * - Tests real integration with backend
 * - Catches issues that mocked tests miss
 * - Most realistic testing scenario
 *
 * Cons:
 * - Requires running Umbraco instance
 * - Slower execution
 * - Need to manage test data
 *
 * Usage:
 *   URL=https://localhost:44325 \
 *   UMBRACO_USER_LOGIN=admin@example.com \
 *   UMBRACO_USER_PASSWORD=yourpassword \
 *   npm run test:e2e
 */
export default defineConfig({
  testDir: '.',
  testMatch: ['*.spec.ts'],
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: './playwright-report' }], ['list']],
  outputDir: './test-results',
  use: {
    baseURL: process.env.URL || 'https://localhost:44325',
    trace: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    testIdAttribute: 'data-mark',
  },
  projects: [
    {
      name: 'setup',
      testMatch: 'auth.setup.ts',
    },
    {
      name: 'e2e',
      testMatch: ['tree.spec.ts'],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        ignoreHTTPSErrors: true,
        storageState: STORAGE_STATE,
      },
    },
  ],
});
