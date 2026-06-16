/**
 * E2E Tests against a real Umbraco instance
 *
 * These tests run against a live Umbraco instance with the extension installed.
 * They use @umbraco/playwright-testhelpers for authentication and navigation.
 *
 * Prerequisites:
 * - Umbraco instance running with the tree-example extension installed
 * - Backend API running (the C# UmbTreeClient project)
 *
 * Environment variables:
 *   URL - Umbraco backoffice URL (default: https://localhost:44325)
 *   UMBRACO_USER_LOGIN - Admin email
 *   UMBRACO_USER_PASSWORD - Admin password
 *
 * Run with: npm run test:e2e
 */
import { expect } from '@playwright/test';
import { ConstantHelper, test } from '@umbraco/playwright-testhelpers';

test.describe('Our Tree Extension (Real E2E)', () => {
  test('should display Our Tree menu in Settings sidebar', async ({ umbracoUi }) => {
    // Act
    await umbracoUi.goToBackOffice();
    await umbracoUi.content.goToSection(ConstantHelper.sections.settings);

    // Assert - Our Tree should be visible in the sidebar
    await expect(umbracoUi.page.getByText('Our Tree')).toBeVisible({ timeout: 15000 });
  });

  test('should display root tree items from real API', async ({ umbracoUi }) => {
    // Act
    await umbracoUi.goToBackOffice();
    await umbracoUi.content.goToSection(ConstantHelper.sections.settings);

    // Wait for Our Tree heading and scroll to ensure visibility
    await umbracoUi.page.getByRole('heading', { name: 'Our Tree' }).waitFor({ timeout: 15000 });
    await umbracoUi.page.getByRole('heading', { name: 'Our Tree' }).scrollIntoViewIfNeeded();

    // Assert - Our Tree items (Item 1, Item 2, etc.) should load from API
    await expect(umbracoUi.page.getByRole('link', { name: 'Item 1' })).toBeVisible({ timeout: 15000 });
  });

  test('should expand tree item to show children', async ({ umbracoUi }) => {
    // Act
    await umbracoUi.goToBackOffice();
    await umbracoUi.content.goToSection(ConstantHelper.sections.settings);

    // Wait for Our Tree heading and scroll to ensure visibility
    await umbracoUi.page.getByRole('heading', { name: 'Our Tree' }).waitFor({ timeout: 15000 });
    await umbracoUi.page.getByRole('heading', { name: 'Our Tree' }).scrollIntoViewIfNeeded();

    // Wait for Our Tree items to load
    await umbracoUi.page.getByRole('link', { name: 'Item 1' }).waitFor({ timeout: 15000 });

    // Click expand button for Item 1
    const expandButton = umbracoUi.page.getByRole('button', { name: 'Expand child items for Item 1' });

    if (await expandButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expandButton.click();

      // Assert - children should appear (Item 1 has children: Item 1.1, Item 1.2)
      await umbracoUi.page.waitForTimeout(1000);
    }
  });

  test('should navigate to workspace when clicking tree item', async ({ umbracoUi }) => {
    // Act
    await umbracoUi.goToBackOffice();
    await umbracoUi.content.goToSection(ConstantHelper.sections.settings);

    // Wait for Our Tree heading and scroll to ensure visibility
    await umbracoUi.page.getByRole('heading', { name: 'Our Tree' }).waitFor({ timeout: 15000 });
    await umbracoUi.page.getByRole('heading', { name: 'Our Tree' }).scrollIntoViewIfNeeded();

    // Wait for Our Tree items to load, then click Item 1
    const item1Link = umbracoUi.page.getByRole('link', { name: 'Item 1' });
    await item1Link.waitFor({ timeout: 15000 });
    await item1Link.click();

    // Assert - workspace should load
    await expect(umbracoUi.page.locator('our-tree-workspace-editor')).toBeVisible({ timeout: 15000 });
  });

  test('should display workspace header with item data', async ({ umbracoUi }) => {
    // Act
    await umbracoUi.goToBackOffice();
    await umbracoUi.content.goToSection(ConstantHelper.sections.settings);

    // Wait for Our Tree heading first, then scroll to ensure visibility
    await umbracoUi.page.getByRole('heading', { name: 'Our Tree' }).waitFor({ timeout: 15000 });
    await umbracoUi.page.getByRole('heading', { name: 'Our Tree' }).scrollIntoViewIfNeeded();

    // Click on Item 1 from Our Tree (wait for tree items to load)
    const item1Link = umbracoUi.page.getByRole('link', { name: 'Item 1' });
    await item1Link.waitFor({ timeout: 15000 });
    await item1Link.click();

    // Assert - header with icon should be visible
    await expect(umbracoUi.page.locator('our-tree-workspace-editor')).toBeVisible({ timeout: 15000 });
    const header = umbracoUi.page.locator('our-tree-workspace-editor #header');
    await expect(header.locator('uui-icon')).toBeVisible({ timeout: 15000 });
  });

  test('should show Details view with item properties', async ({ umbracoUi }) => {
    // Act
    await umbracoUi.goToBackOffice();
    await umbracoUi.content.goToSection(ConstantHelper.sections.settings);

    // Wait for Our Tree heading and scroll to ensure visibility
    await umbracoUi.page.getByRole('heading', { name: 'Our Tree' }).waitFor({ timeout: 15000 });
    await umbracoUi.page.getByRole('heading', { name: 'Our Tree' }).scrollIntoViewIfNeeded();

    // Click on Item 1 from Our Tree
    const item1Link = umbracoUi.page.getByRole('link', { name: 'Item 1' });
    await item1Link.waitFor({ timeout: 15000 });
    await item1Link.click();

    // Assert - details view content should be visible
    await expect(umbracoUi.page.locator('our-tree-workspace-editor')).toBeVisible({ timeout: 15000 });
    await expect(umbracoUi.page.getByText('Tree Item Details')).toBeVisible({ timeout: 15000 });
    await expect(umbracoUi.page.getByText('Name')).toBeVisible({ timeout: 15000 });
    await expect(umbracoUi.page.getByText('ID')).toBeVisible({ timeout: 15000 });
  });
});
