import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/**
 * Playwright Configuration for Umbraco E2E Tests
 *
 * Uses @umbraco/playwright-testhelpers which provides:
 * - umbracoApi fixture for API operations
 * - umbracoUi fixture for UI interactions
 * - ConstantHelper for common values
 *
 * Authentication:
 * - The 'setup' project logs in and saves auth state
 * - Other projects reuse this state via storageState
 */

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Storage state file for authenticated session
export const STORAGE_STATE = join(__dirname, 'playwright/.auth/user.json');

// Set the storage state path for testhelpers to read tokens from
process.env.STORAGE_STAGE_PATH = STORAGE_STATE;

export default defineConfig({
	testDir: './tests',
	timeout: 60000, // 60 second timeout for E2E tests
	expect: {
		timeout: 10000,
	},
	fullyParallel: false, // Sequential to avoid conflicts
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1, // Single worker for Umbraco tests
	reporter: [['html'], ['list']],
	outputDir: './test-results',

	use: {
		// Base URL for Umbraco instance
		baseURL: process.env.URL || 'https://localhost:44325',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		ignoreHTTPSErrors: true, // For local dev with self-signed certs
		actionTimeout: 0,
		// Umbraco uses 'data-mark' as the test ID attribute
		testIdAttribute: 'data-mark',
	},

	projects: [
		// Setup project - authenticates and saves state
		{
			name: 'setup',
			testMatch: '**/*.setup.ts',
		},
		// Main tests - depend on setup, use saved auth state
		{
			name: 'chromium',
			testMatch: '**/*.spec.ts',
			dependencies: ['setup'],
			use: {
				...devices['Desktop Chrome'],
				ignoreHTTPSErrors: true,
				storageState: STORAGE_STATE,
			},
		},
	],
});
