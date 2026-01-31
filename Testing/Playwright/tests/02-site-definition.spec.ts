import { test, expect } from '@playwright/test';

test('Create and edit a site definition', async ({ page }) => {
  // Arrange
  await page.goto('/umbraco/section/xstatic');

  // Act
  await page.getByRole('button', { name: 'Create new static site' }).click();
  await page.getByRole('textbox', { name: 'Field for Site Name *' }).click();
  await page.getByRole('textbox', { name: 'Field for Site Name *' }).fill('Test');
  await page.locator('umb-input-document').getByRole('button', { name: 'Choose' }).click();
  await page.getByText('Home').click();
  await page.locator('umb-tree-picker-modal').getByRole('button', { name: 'Choose' }).click();

  await page.getByLabel('Field for Export Format *').selectOption('11');
  await page.getByText('Test Action Edited').click();
  await page.getByRole('button', { name: 'Submit' }).click();

  // Assert
  await expect(page.locator('xstatic-site-element')).toContainText('Test');
  await expect(page.getByRole('table')).toContainText('Exports as Test Export Type Edited');
  await expect(page.getByRole('table')).toContainText('Manual Deploy');
  await expect(page.getByRole('table')).toContainText('This site has never been built.');
  await expect(page.getByRole('table')).toContainText('This site has never been deployed.');

  // Edit Act
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('textbox', { name: 'Field for Site Name *' }).click();
  await page.getByRole('textbox', { name: 'Field for Site Name *' }).fill('Test Edited');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Assert
  await expect(page.locator('xstatic-site-element')).toContainText('Test Edited');
});
