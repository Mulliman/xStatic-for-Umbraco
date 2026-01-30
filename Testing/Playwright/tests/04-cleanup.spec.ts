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

test('Delete Configuration Items', async ({ page }) => {
  await page.goto('/umbraco/section/xstatic');
  
  // Delete Target
  await page.getByRole('tab', { name: 'Deployment Targets' }).click();
  await page.locator('.lucide.lucide-trash-2').first().click();
  await page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();

  // Delete Export Type
  await page.getByRole('tab', { name: 'Export Types' }).click();
  await page.locator('uui-box').filter({ hasText: 'Test Export Type Edited' }).getByLabel('Delete').click();
  await page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();

  // Delete Action
  await page.getByRole('tab', { name: 'Actions' }).click();
  await page.getByRole('button', { name: 'Delete' }).first().click();
  await page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();
});
