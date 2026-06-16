import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const STORAGE_STATE = join(__dirname, '.auth/user.json');

/**
 * Playwright config for real E2E tests against a running Umbraco instance.
 *
 * Prerequisites:
 * 1. Umbraco instance running with the notes-wiki extension installed
 * 2. Backend API running (the NotesWiki C# project)
 *
 * Environment variables:
 *   URL - Umbraco backoffice URL (default: https://localhost:44325)
 *   UMBRACO_USER_LOGIN - Admin email
 *   UMBRACO_USER_PASSWORD - Admin password
 *   UMBRACO_DATA_PATH - Path to Umbraco's App_Data folder (for resetting test data)
 */
export default defineConfig({
  testDir: '.',
  testMatch: ['notes-wiki-e2e.spec.ts'],
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'line' : 'html',
  globalSetup: './global-setup.ts',
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
      testMatch: 'notes-wiki-e2e.spec.ts',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        ignoreHTTPSErrors: true,
        storageState: STORAGE_STATE,
      },
    },
  ],
});
