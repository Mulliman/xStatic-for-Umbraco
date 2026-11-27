import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

const STORAGE_STATE = path.join(__dirname, 'playwright/.auth/user.json');

// Generate a unique ID for this test run
if (!process.env.TEST_RUN_ID) {
  process.env.TEST_RUN_ID = uuidv4().substring(0, 8);
}
console.log(`TEST_RUN_ID: ${process.env.TEST_RUN_ID}`);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'https://localhost:5000',
    ignoreHTTPSErrors: true,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /00-auth\.setup\.ts/,
      // Same installed Chrome as the other projects, so no extra Playwright browser download is needed.
      use: { channel: 'chrome' },
    },
    {
      name: 'cleanup',
      testMatch: /05-cleanup\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: STORAGE_STATE,
      },
      dependencies: ['chromium-ops', 'chromium-issue70', 'chromium-issue77'],
    },
    {
      name: 'chromium-config',
      testMatch: /01-configuration\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
    {
      name: 'chromium-site',
      testMatch: /02-site-definition\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: STORAGE_STATE,
      },
      dependencies: ['chromium-config'],
    },
    {
      name: 'chromium-ops',
      testMatch: /03-operations\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: STORAGE_STATE,
      },
      dependencies: ['chromium-site'],
    },
    {
      name: 'chromium-issue70',
      testMatch: /04-issue70\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    },
    {
      // Needs the export type and deployment target created by 01; runs after 03 so it
      // doesn't interleave with the shared site's operations.
      name: 'chromium-issue77',
      testMatch: /06-issue77\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: STORAGE_STATE,
      },
      dependencies: ['chromium-ops'],
    },
    // Self-contained specs: each creates and removes its own data, so they only need the login.
    ...[
      ['chromium-output', /07-output\.spec\.ts/],
      ['chromium-json', /08-json-export\.spec\.ts/],
      ['chromium-security', /09-security\.spec\.ts/],
      ['chromium-validation', /10-validation\.spec\.ts/],
      ['chromium-dashboards', /11-dashboards\.spec\.ts/],
      ['chromium-parameterless-action', /12-parameterless-action\.spec\.ts/],
      // Skips itself unless the Docker FTP server in Testing/Ftp is running.
      ['chromium-ftp', /13-ftp-deploy\.spec\.ts/],
      ['chromium-typed-fields-ai', /14-typed-fields-and-ai-output\.spec\.ts/],
      // The secret-reference test skips itself unless the FTP or Netlify deployer is installed.
      ['chromium-deploy-errors-secrets', /15-deploy-errors-and-secrets\.spec\.ts/],
      ['chromium-host-site-smoke', /16-host-site-smoke\.spec\.ts/],
    ].map(([name, testMatch]) => ({
      name: name as string,
      testMatch: testMatch as RegExp,
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: STORAGE_STATE,
      },
      dependencies: ['setup'],
    })),
  ],
});
