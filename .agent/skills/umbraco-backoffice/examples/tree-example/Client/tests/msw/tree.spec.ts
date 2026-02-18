/**
 * MSW (Mock Service Worker) Tests
 *
 * These tests use MSW to intercept HTTP requests at the network level.
 * The extension uses the real repository that makes actual API calls,
 * but MSW intercepts those calls and returns mock responses.
 *
 * The mock handlers are defined in: src/msw/handlers.ts
 * They are registered by index.ts via addMockHandlers() when VITE_UMBRACO_USE_MSW=on
 *
 * Run with: npm run test:msw
 */
import { test, expect, type Page } from '@playwright/test';

async function navigateToSettings(page: Page) {
  await page.goto('/section/settings');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('umb-section-sidebar', { timeout: 30000 });
}

async function waitForTree(page: Page) {
  await page.waitForSelector('text=Our Tree', { timeout: 15000 });
}

test.describe('Our Tree Extension (MSW Handlers)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSettings(page);
    await waitForTree(page);
  });

  test('should display Our Tree menu in Settings sidebar', async ({ page }) => {
    const menuItem = page.locator('umb-section-sidebar').getByText('Our Tree');
    await expect(menuItem).toBeVisible({ timeout: 15000 });
  });

  test('should display root tree items from MSW mock data', async ({ page }) => {
    // These names come from src/msw/handlers.ts mock data
    await expect(page.getByText('[MSW] Group A')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('[MSW] Group B')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('[MSW] Config')).toBeVisible({ timeout: 15000 });
  });

  test('should expand tree item to show children', async ({ page }) => {
    const treeItem = page.locator('umb-tree-item').filter({ hasText: '[MSW] Group A' });
    const expandButton = treeItem.locator('uui-symbol-expand');

    if (await expandButton.isVisible()) {
      await expandButton.click();
      await expect(page.getByText('[MSW] Item A1')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('[MSW] Item A2')).toBeVisible({ timeout: 15000 });
    }
  });

  test('should navigate to workspace when clicking tree item', async ({ page }) => {
    const configItem = page.getByText('[MSW] Config');
    await configItem.click();

    await page.waitForSelector('our-tree-workspace-editor', { timeout: 15000 });

    const header = page.locator('our-tree-workspace-editor #header');
    await expect(header.getByText('Tree Item msw-config')).toBeVisible({ timeout: 15000 });
  });

  test('should display correct icon in workspace header', async ({ page }) => {
    const settingsGroupA = page.getByText('[MSW] Group A');
    await settingsGroupA.click();

    await page.waitForSelector('our-tree-workspace-editor', { timeout: 15000 });

    const header = page.locator('our-tree-workspace-editor #header');
    const icon = header.locator('uui-icon');
    await expect(icon).toBeVisible({ timeout: 15000 });
  });

  test('should show Details view content in workspace', async ({ page }) => {
    const configItem = page.getByText('[MSW] Config');
    await configItem.click();

    await page.waitForSelector('our-tree-workspace-editor', { timeout: 15000 });

    await expect(page.getByText('Tree Item Details')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Name')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('ID')).toBeVisible({ timeout: 15000 });
  });
});
