import { test, expect } from '@playwright/test';

test('Create and edit a site definition', async ({ page }) => {
  await page.goto('/umbraco/section/xstatic');
  await page.getByRole('tab', { name: 'xStatic Sites' }).click();
  await page.getByRole('button', { name: 'Create new static site' }).click();
  await page.getByRole('textbox', { name: 'Field for Site Name *' }).fill('Test Site');
  
  // Pick root node
  await page.locator('umb-input-document').getByRole('button', { name: 'Choose' }).click();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.locator('umb-tree-picker-modal').getByRole('button', { name: 'Choose' }).click();

  // Select Export Type created in step 1
  await page.locator('select').first().selectOption({ label: 'Test Export Type Edited' });
  
  // Select Action created in step 1
  await page.getByRole('checkbox', { name: 'Test Action Edited' }).check();

  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Test Site', { exact: true })).toBeVisible();
});
