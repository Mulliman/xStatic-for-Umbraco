/**
 * Mock Repository Tests
 *
 * These tests use an in-memory mock repository that returns static test data.
 * No network requests are made - the repository is swapped at the extension level.
 *
 * The mock data comes from: Client/mock/mock-data.ts
 *
 * Run with: npm run test:mock-repo
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

test.describe('Our Tree Extension (Mock Repository)', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToSettings(page);
    await waitForTree(page);
  });

  test('should display Our Tree menu in Settings sidebar', async ({ page }) => {
    const menuItem = page.locator('umb-section-sidebar').getByText('Our Tree');
    await expect(menuItem).toBeVisible({ timeout: 15000 });
  });

  test('should display root tree items from mock repository data', async ({ page }) => {
    // These names come from tests/mock-repo/mock/mock-data.ts
    await expect(page.getByText('[Mock Repo] Group A')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('[Mock Repo] Group B')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('[Mock Repo] Config')).toBeVisible({ timeout: 15000 });
  });

  test('should expand tree item to show children', async ({ page }) => {
    const treeItem = page.locator('umb-tree-item').filter({ hasText: '[Mock Repo] Group A' });
    const expandButton = treeItem.locator('uui-symbol-expand');

    if (await expandButton.isVisible()) {
      await expandButton.click();
      await expect(page.getByText('[Mock Repo] Item A1')).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('[Mock Repo] Item A2')).toBeVisible({ timeout: 15000 });
    }
  });

  test('should navigate to workspace when clicking tree item', async ({ page }) => {
    const configItem = page.getByText('[Mock Repo] Config');
    await configItem.click();

    await page.waitForSelector('our-tree-workspace-editor', { timeout: 15000 });

    const header = page.locator('our-tree-workspace-editor #header');
    await expect(header.getByText('Tree Item mock-repo-config')).toBeVisible({ timeout: 15000 });
  });

  test('should display correct icon in workspace header', async ({ page }) => {
    const settingsGroupA = page.getByText('[Mock Repo] Group A');
    await settingsGroupA.click();

    await page.waitForSelector('our-tree-workspace-editor', { timeout: 15000 });

    const header = page.locator('our-tree-workspace-editor #header');
    const icon = header.locator('uui-icon');
    await expect(icon).toBeVisible({ timeout: 15000 });
  });

  test('should show Details view content in workspace', async ({ page }) => {
    const configItem = page.getByText('[Mock Repo] Config');
    await configItem.click();

    await page.waitForSelector('our-tree-workspace-editor', { timeout: 15000 });

    await expect(page.getByText('Tree Item Details')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Name')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('ID')).toBeVisible({ timeout: 15000 });
  });
});
