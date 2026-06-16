import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests for Workspace Feature Toggle Extension
 *
 * These tests verify the feature toggle functionality in the Document workspace.
 * Tests run against the mocked Umbraco backoffice (MSW mode).
 *
 * The extension provides:
 * - workspaceView: "Feature Toggles" tab with settings icon
 * - workspaceAction: "Toggle All Features" button
 * - workspaceFooterApp: Shows active feature count
 * - workspaceContext: Manages feature toggle state
 *
 * Prerequisites:
 * - The mocked backoffice must be running with the extension loaded:
 *   cd /path/to/Umbraco.Web.UI.Client
 *   VITE_EXTERNAL_EXTENSION=/path/to/workspace-feature-toggle npm run dev:external
 */

// Helper to open a document in the workspace
async function openDocument(page: Page) {
	// Go directly to a document workspace URL
	// The MSW mode has a document at this URL
	await page.goto('/section/content/workspace/document/edit/the-simplest-document-id');
	await page.waitForLoadState('domcontentloaded');

	// Wait for workspace to load
	await page.waitForSelector('umb-workspace-editor', { timeout: 30000 });

	// Wait for the Feature Toggles tab to appear (our extension)
	await page.waitForSelector('uui-tab:has-text("Feature Toggles")', { timeout: 15000 });
}

test.describe('Feature Toggle Workspace Extension', () => {
	test.beforeEach(async ({ page }) => {
		await openDocument(page);
	});

	test('should display Feature Toggles tab in document workspace', async ({ page }) => {
		// Look for the Feature Toggles tab in the workspace header tabs
		const featureTogglesTab = page.locator('uui-tab').filter({ hasText: 'Feature Toggles' });

		await expect(featureTogglesTab).toBeVisible({ timeout: 15000 });
	});

	test('should display Toggle All Features action button', async ({ page }) => {
		// The workspace action button should be visible
		const toggleAllButton = page.getByRole('button', { name: 'Toggle All Features' });

		await expect(toggleAllButton).toBeVisible({ timeout: 15000 });
	});

	test('should display footer app with feature count', async ({ page }) => {
		// The footer app shows active feature count
		const footer = page.locator('example-feature-toggle-footer');

		await expect(footer).toBeVisible({ timeout: 15000 });
		// Default state: 1 feature active (Auto Save is enabled by default)
		await expect(footer).toContainText('1 feature active');
	});
});

test.describe('Feature Toggle View', () => {
	test.beforeEach(async ({ page }) => {
		await openDocument(page);

		// Navigate to Feature Toggles view
		const featureTogglesTab = page.locator('uui-tab').filter({ hasText: 'Feature Toggles' });
		await featureTogglesTab.click();

		// Wait for the view to render
		await page.waitForSelector('example-feature-toggle-view', { timeout: 15000 });
	});

	test('should display all three default features', async ({ page }) => {
		const view = page.locator('example-feature-toggle-view');

		// Verify all features are displayed
		await expect(view.getByText('Dark Mode')).toBeVisible();
		await expect(view.getByText('Auto Save')).toBeVisible();
		await expect(view.getByText('Preview Mode')).toBeVisible();

		// Verify descriptions
		await expect(view.getByText('Enable dark theme for this document')).toBeVisible();
		await expect(view.getByText('Automatically save changes every 30 seconds')).toBeVisible();
		await expect(view.getByText('Show live preview panel')).toBeVisible();
	});

	test('should show correct initial count (1 of 3 enabled)', async ({ page }) => {
		const view = page.locator('example-feature-toggle-view');

		// Auto Save is enabled by default
		await expect(view.getByText('1 of 3 features enabled')).toBeVisible();
	});

	test('should toggle individual feature', async ({ page }) => {
		const view = page.locator('example-feature-toggle-view');

		// Find and click Dark Mode toggle
		const darkModeItem = view.locator('.feature-item').filter({ hasText: 'Dark Mode' });
		const toggle = darkModeItem.locator('uui-toggle');
		await toggle.click();

		// Count should now be 2 of 3
		await expect(view.getByText('2 of 3 features enabled')).toBeVisible();

		// Toggle back
		await toggle.click();
		await expect(view.getByText('1 of 3 features enabled')).toBeVisible();
	});

	test('should enable all features when clicking Enable All', async ({ page }) => {
		const view = page.locator('example-feature-toggle-view');

		// Click Enable All
		await view.getByRole('button', { name: 'Enable All' }).click();

		// All 3 should be enabled
		await expect(view.getByText('3 of 3 features enabled')).toBeVisible();

		// Footer should update
		const footer = page.locator('example-feature-toggle-footer');
		await expect(footer).toContainText('3 features active');
		await expect(footer).toContainText('(all enabled)');
	});

	test('should disable all features when clicking Disable All', async ({ page }) => {
		const view = page.locator('example-feature-toggle-view');

		// First enable all
		await view.getByRole('button', { name: 'Enable All' }).click();
		await expect(view.getByText('3 of 3 features enabled')).toBeVisible();

		// Then disable all
		await view.getByRole('button', { name: 'Disable All' }).click();

		// All should be disabled
		await expect(view.getByText('0 of 3 features enabled')).toBeVisible();

		// Footer should update
		const footer = page.locator('example-feature-toggle-footer');
		await expect(footer).toContainText('0 features active');
	});

	test('should reset to default state', async ({ page }) => {
		const view = page.locator('example-feature-toggle-view');

		// Enable all first
		await view.getByRole('button', { name: 'Enable All' }).click();
		await expect(view.getByText('3 of 3 features enabled')).toBeVisible();

		// Click Reset
		await view.getByRole('button', { name: 'Reset' }).click();

		// Should be back to default (1 of 3)
		await expect(view.getByText('1 of 3 features enabled')).toBeVisible();
	});
});

test.describe('Toggle All Features Action', () => {
	test.beforeEach(async ({ page }) => {
		await openDocument(page);
	});

	test('should enable all when some are disabled', async ({ page }) => {
		// Click Toggle All Features button
		const toggleAllButton = page.getByRole('button', { name: 'Toggle All Features' });
		await toggleAllButton.click();

		// Navigate to view to verify
		const featureTogglesTab = page.locator('uui-tab').filter({ hasText: 'Feature Toggles' });
		await featureTogglesTab.click();

		const view = page.locator('example-feature-toggle-view');
		await expect(view.getByText('3 of 3 features enabled')).toBeVisible();
	});

	test('should disable all when all are enabled', async ({ page }) => {
		// First enable all via the view
		const featureTogglesTab = page.locator('uui-tab').filter({ hasText: 'Feature Toggles' });
		await featureTogglesTab.click();

		const view = page.locator('example-feature-toggle-view');
		await view.getByRole('button', { name: 'Enable All' }).click();
		await expect(view.getByText('3 of 3 features enabled')).toBeVisible();

		// Click Toggle All Features button (should disable all)
		const toggleAllButton = page.getByRole('button', { name: 'Toggle All Features' });
		await toggleAllButton.click();

		// Verify all are disabled
		await expect(view.getByText('0 of 3 features enabled')).toBeVisible();
	});
});

test.describe('Footer App Updates', () => {
	test.beforeEach(async ({ page }) => {
		await openDocument(page);
	});

	test('should update in real-time as features change', async ({ page }) => {
		const footer = page.locator('example-feature-toggle-footer');

		// Initial state
		await expect(footer).toContainText('1 feature active');

		// Open view and enable all
		const featureTogglesTab = page.locator('uui-tab').filter({ hasText: 'Feature Toggles' });
		await featureTogglesTab.click();

		const view = page.locator('example-feature-toggle-view');
		await view.getByRole('button', { name: 'Enable All' }).click();

		// Footer should update
		await expect(footer).toContainText('3 features active');
		await expect(footer).toContainText('(all enabled)');

		// Disable one feature
		const darkModeItem = view.locator('.feature-item').filter({ hasText: 'Dark Mode' });
		await darkModeItem.locator('uui-toggle').click();

		// Footer should update
		await expect(footer).toContainText('2 features active');
		await expect(footer).not.toContainText('(all enabled)');
	});

	test('should use correct singular/plural grammar', async ({ page }) => {
		const footer = page.locator('example-feature-toggle-footer');

		// Default is 1 - singular
		await expect(footer).toContainText('1 feature active');

		// Open view
		const featureTogglesTab = page.locator('uui-tab').filter({ hasText: 'Feature Toggles' });
		await featureTogglesTab.click();

		const view = page.locator('example-feature-toggle-view');

		// Enable another - plural
		const darkModeItem = view.locator('.feature-item').filter({ hasText: 'Dark Mode' });
		await darkModeItem.locator('uui-toggle').click();
		await expect(footer).toContainText('2 features active');

		// Disable all - plural (0 features)
		await view.getByRole('button', { name: 'Disable All' }).click();
		await expect(footer).toContainText('0 features active');
	});
});
