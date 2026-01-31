import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test('Clean generated site folder and delete site', async ({ page }) => {
  await page.goto('/umbraco/section/xstatic');
  
  // Clean generated files
  await page.getByRole('button', { name: 'Clean' }).click();
  await page.getByRole('button', { name: 'Clean up' }).click();
  
  // Delete Site
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByText('Test Site')).not.toBeVisible();
});

test('Delete Export Type', async ({ page }) => {
  // Arrange
  await page.goto('/umbraco/section/xstatic/dashboard/xstatic-export-types');

  // Act
  await page.locator('uui-box').filter({ hasText: 'Test Export Type Edited' }).locator('#header').click();
  await page.locator('uui-box').filter({ hasText: 'Test Export Type Edited' }).getByLabel('Delete').click();
  await page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();

  // Assert
  await expect(page.getByText('Test Export Type Edited')).not.toBeVisible();
});

test('Delete Action', async ({ page }) => {
  // Arrange
  await page.goto('/umbraco/section/xstatic/dashboard/xstatic-actions');

  // Act
  const actionElement = page.locator('xstatic-action-element').filter({ hasText: 'Test Action Edited' });
  await actionElement.getByRole('button', { name: 'Delete' }).click();
  await page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();

  // Assert
  await expect(page.getByText('Test Action Edited')).not.toBeVisible();
});

test('Delete Deployment Target', async ({ page }) => {
  // Arrange
  await page.goto('/umbraco/section/xstatic/dashboard/xstatic-deployment-targets');

  // Act
  await page.locator('uui-box').filter({ hasText: 'Test Deployment Target Edited' }).locator('#header').click();
  await page.locator('uui-box').filter({ hasText: 'Test Deployment Target Edited' }).getByLabel('Delete').click();
  await page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();

  // Assert
  await expect(page.getByText('Test Deployment Target Edited')).not.toBeVisible();
});

