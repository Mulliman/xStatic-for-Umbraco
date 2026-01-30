import { test, expect } from '@playwright/test';

test.describe('Initial Configuration', () => {
  test('Create and Edit Export Type', async ({ page }) => {
    // Arrange
    await page.goto('/umbraco/section/xstatic/dashboard/xstatic-export-types');

    // Act
    await page.getByRole('button', { name: 'Create new Export Type' }).click();
    await page.getByRole('textbox', { name: 'Field for Export Type Name *' }).click();
    await page.getByRole('textbox', { name: 'Field for Export Type Name *' }).fill('Test Export Type');
    await page.getByRole('textbox', { name: 'Field for Export Type Name *' }).click();
    await page.getByRole('textbox', { name: 'Field for Export Type Name *' }).press('Tab');
    await page.getByLabel('Field for Transformer Factory').selectOption('XStatic.Core.Generator.Transformers.DefaultHtmlTransformerListFactory, XStatic.Core, Version=17.0.0.0, Culture=neutral, PublicKeyToken=null');
    await page.getByLabel('Field for Transformer Factory').press('Tab');
    await page.getByLabel('Field for Generator *').selectOption('XStatic.Core.Generator.StaticHtmlSiteGenerator, XStatic.Core, Version=17.0.0.0, Culture=neutral, PublicKeyToken=null');
    await page.getByLabel('Field for Generator *').press('Tab');
    await page.getByLabel('Field for File Name Generator').selectOption('XStatic.Core.Generator.Storage.EverythingIsIndexHtmlFileNameGenerator, XStatic.Core, Version=17.0.0.0, Culture=neutral, PublicKeyToken=null');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Assert
    const exportTypeBox = page.locator('uui-box').filter({ hasText: /Test Export Type/ }).first();
    await expect(exportTypeBox).toBeVisible();
    await expect(exportTypeBox).toContainText('DefaultHtmlTransformerListFactory');
    await expect(exportTypeBox).toContainText('StaticHtmlSiteGenerator');
    await expect(exportTypeBox).toContainText('EverythingIsIndexHtmlFileNameGenerator');

    // Act
    await exportTypeBox.getByLabel('Edit').click();
    await page.getByRole('textbox', { name: 'Field for Export Type Name *' }).click();
    await page.getByRole('textbox', { name: 'Field for Export Type Name *' }).fill('Test Export Type Edited');
    await page.getByRole('button', { name: 'Submit' }).click();
    
    // Assert
    await expect(page.locator('uui-box').filter({ hasText: /Test Export Type Edited/ }).first()).toBeVisible();
  });

  test('Create and Edit Action', async ({ page }) => {

    // Arrange
    await page.goto('/umbraco/section/xstatic/dashboard/xstatic-actions');

    // Act
    await page.locator('.lucide.lucide-plus').click();
    await page.getByRole('textbox', { name: 'Field for Action Name *' }).click();
    await page.getByRole('textbox', { name: 'Field for Action Name *' }).fill('Test Action');
    await page.getByLabel('Field for Action Type *').selectOption('XStatic.Core.Actions.FileActions.FileCopyAction, XStatic.Core, Version=17.0.0.0, Culture=neutral, PublicKeyToken=null');
    await page.getByRole('textbox', { name: 'Field for FilePath' }).click();
    await page.getByRole('textbox', { name: 'Field for FilePath' }).fill('index.html');
    await page.getByRole('textbox', { name: 'Field for FilePath' }).press('Tab');
    await page.getByRole('textbox', { name: 'Field for NewFilePath' }).fill('index2.html');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Assert
    const actionBox = page.locator('xstatic-action-element').filter({ hasText: /Test Action/ }).first();
    await expect(actionBox).toBeVisible();
    await expect(actionBox).toContainText('FileCopyAction');

    // Act
    await actionBox.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('textbox', { name: 'Field for Action Name *' }).click();
    await page.getByRole('textbox', { name: 'Field for Action Name *' }).fill('Test Action ');
    await page.getByRole('textbox', { name: 'Field for Action Name *' }).click();
    await page.getByRole('textbox', { name: 'Field for Action Name *' }).fill('Test Action Edited');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Assert
    await expect(page.locator('xstatic-action-element').filter({ hasText: /Test Action Edited/ }).first()).toBeVisible();
  });

  test('Create and Edit Deployment Target', async ({ page }) => {
    // Arrange
    await page.goto('/umbraco/section/xstatic/dashboard/xstatic-deployment-targets');
    
    // Act
    await page.getByRole('button', { name: 'Manually Configure New' }).click();
    await page.getByRole('textbox', { name: 'Field for Name *' }).click();
    await page.getByRole('textbox', { name: 'Field for Name *' }).fill('Test Deployment Target');
    await page.getByRole('textbox', { name: 'Field for Name *' }).press('Tab');
    await page.getByLabel('Field for Deployer *').selectOption('filesystem');
    await page.getByLabel('Field for Deployer *').press('Tab');
    await page.getByRole('textbox', { name: 'Field for Folder Path' }).click();
    await page.getByRole('textbox', { name: 'Field for Folder Path' }).click();
    await page.getByRole('textbox', { name: 'Field for Folder Path' }).fill('C:\\Public\\XStaticTestDeploy');
    await page.getByRole('textbox', { name: 'Field for Folder Path' }).click();
    await page.getByRole('button', { name: 'Submit' }).click();
    
    // Assert
    const targetBox = page.locator('uui-box').filter({ hasText: /Test Deployment Target/ }).first();
    await expect(targetBox).toBeVisible();
    await expect(targetBox).toContainText('filesystem');
    
    // Edit
    await targetBox.getByLabel('Edit').click();
    await page.getByRole('textbox', { name: 'Field for Name *' }).click();
    await page.getByRole('textbox', { name: 'Field for Name *' }).fill('Test Deployment Target Edited');
    await page.getByRole('button', { name: 'Submit' }).click();
    
    // Assert
    await expect(page.locator('uui-box').filter({ hasText: /Test Deployment Target Edited/ }).first()).toBeVisible();
  });
});
