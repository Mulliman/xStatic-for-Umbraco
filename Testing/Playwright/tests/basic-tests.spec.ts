import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://localhost:5000/umbraco/section/xstatic');

  // Export Types
  await page.getByRole('tab', { name: 'Export Types' }).click();
  await page.getByRole('button', { name: 'Create new Export Type' }).click();
  await page.getByRole('textbox', { name: 'Field for Export Type Name *' }).click();
  await page.getByRole('textbox', { name: 'Field for Export Type Name *' }).fill('Test Export Type');
  await page.getByRole('textbox', { name: 'Field for Export Type Name *' }).selectOption('XStatic.Core.Generator.Transformers.DefaultHtmlTransformerListFactory, XStatic.Core, Version=17.0.0.0, Culture=neutral, PublicKeyToken=null');
  await page.getByRole('textbox', { name: 'Field for Export Type Name *' }).selectOption('XStatic.Core.Generator.StaticHtmlSiteGenerator, XStatic.Core, Version=17.0.0.0, Culture=neutral, PublicKeyToken=null');
  await page.getByRole('textbox', { name: 'Field for Export Type Name *' }).selectOption('XStatic.Core.Generator.Storage.EverythingIsIndexHtmlFileNameGenerator, XStatic.Core, Version=17.0.0.0, Culture=neutral, PublicKeyToken=null');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Check Export Type
  await expect(page.locator('uui-box').filter({ hasText: 'Test Export Type Test Export' }).locator('#header')).toBeVisible();

  await page.getByRole('cell', { name: 'Test Export Type' }).click();

  // Edit Export Type
  await page.locator('uui-box').filter({ hasText: 'Test Export Type Test Export' }).getByLabel('Edit').click();
  await page.getByRole('textbox', { name: 'Field for Export Type Name *' }).click();
  await page.getByRole('textbox', { name: 'Field for Export Type Name *' }).fill('Test Export Type Edited');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Deployment Targets
  await page.getByRole('tab', { name: 'Deployment Targets' }).click();
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await page.getByRole('textbox', { name: 'Field for Name *' }).click();
  await page.getByRole('textbox', { name: 'Field for Name *' }).fill('Test Deployment Target');
  await page.getByRole('textbox', { name: 'Field for Name *' }).selectOption('filesystem');
  await page.getByRole('textbox', { name: 'Field for Folder Path' }).click();
  await page.getByRole('textbox', { name: 'Field for Folder Path' }).click();
  await page.getByRole('textbox', { name: 'Field for Folder Path' }).fill('C:\\Public\\XStaticTestDeploy');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Deployment Target
  await page.goto('https://localhost:5000/umbraco/section/xstatic/dashboard/xstatic-deployment-targets');

  // Edit Deployment Target
  await page.locator('.lucide.lucide-plus').click();
  await page.getByRole('textbox', { name: 'Field for Name *' }).click();
  await page.getByRole('textbox', { name: 'Field for Name *' }).fill('Test');
  await page.getByRole('textbox', { name: 'Field for Name *' }).selectOption('filesystem');
  await page.getByRole('textbox', { name: 'Field for Folder Path' }).click();
  await page.getByRole('textbox', { name: 'Field for Folder Path' }).fill('C:\\Public\\XStaticTestDeploy');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Check Deployment Target
  await expect(page.locator('xstatic-deployment-target-element #header')).toBeVisible();
  await expect(page.locator('xstatic-deployment-target-element')).toContainText('Test');

  // Edit Deployment Target
  await page.locator('.lucide.lucide-brush').click();
  await page.getByRole('textbox', { name: 'Field for Name *' }).click();
  await page.getByRole('textbox', { name: 'Field for Name *' }).fill('Test Edited');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Check Deployment Target
  await expect(page.locator('xstatic-deployment-target-element')).toContainText('Test Edited');

  // Actions
  await page.getByRole('tab', { name: 'Actions' }).click();
  await page.getByRole('button', { name: 'Create new Action' }).click();
  await page.getByRole('textbox', { name: 'Field for Action Name *' }).click();
  await page.getByRole('textbox', { name: 'Field for Action Name *' }).fill('Test Action');
  await page.getByRole('textbox', { name: 'Field for Action Name *' }).selectOption('XStatic.Core.Actions.FileActions.FileCopyAction, XStatic.Core, Version=17.0.0.0, Culture=neutral, PublicKeyToken=null');
  await page.getByRole('textbox', { name: 'Field for FilePath' }).click();
  await page.getByRole('textbox', { name: 'Field for FilePath' }).fill('index.html');
  await page.getByRole('textbox', { name: 'Field for FilePath' }).click();
  await page.locator('#layout').nth(3).click();
  await page.getByRole('textbox', { name: 'Field for NewFilePath' }).click();
  await page.getByRole('textbox', { name: 'Field for NewFilePath' }).fill('index2.html');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Check Action
  await expect(page.locator('div').filter({ hasText: /^Test Action$/ })).toBeVisible();

  // Edit Action
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('textbox', { name: 'Field for Action Name *' }).click();
  await page.getByRole('textbox', { name: 'Field for Action Name *' }).fill('Test Action Edited');
  await page.getByRole('button', { name: 'Submit' }).click();

  // xStatic Sites
  await page.getByRole('tab', { name: 'xStatic Sites' }).click();
  await page.getByRole('button', { name: 'Create new static site' }).click();
  await page.getByRole('textbox', { name: 'Field for Site Name *' }).click();
  await page.getByRole('textbox', { name: 'Field for Site Name *' }).fill('Test');
  await page.locator('umb-input-document').getByRole('button', { name: 'Choose' }).click();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.locator('umb-tree-picker-modal').getByRole('button', { name: 'Choose' }).click();
  await page.getByRole('button', { name: 'Choose' }).click();
  await page.locator('uui-card-media').filter({ hasText: 'Social Icons' }).click();
  await page.getByRole('button', { name: 'Media' }).click();
  await page.locator('uui-card-media').filter({ hasText: 'Social Icons' }).click();
  await page.getByRole('button', { name: 'Media' }).click();
  await page.getByRole('button', { name: 'Social Icons' }).click();
  await page.getByRole('button', { name: 'Media' }).click();
  await page.locator('uui-card-media').filter({ hasText: 'Social Icons' }).locator('polyline').click();
  await page.locator('umb-media-picker-modal').getByRole('button', { name: 'Choose' }).click();

  await page.getByText('HTML Website Test Export Type Edited Export Format * Do you want to export this').click();
  await page.getByRole('dialog').selectOption('2');
  await page.locator('#icon-add > .lucide').first().click();
  await page.locator('umb-property-layout').filter({ hasText: 'Asset Paths Add folder names' }).getByPlaceholder('Enter tag').fill('/css');
  await page.locator('umb-property-layout').filter({ hasText: 'Asset Paths Add folder names' }).getByPlaceholder('Enter tag').press('Enter');
  await page.locator('umb-tags-input').filter({ hasText: '/css' }).getByPlaceholder('Enter tag').fill('/assets/*');
  await page.locator('umb-tags-input').filter({ hasText: '/css' }).getByPlaceholder('Enter tag').press('Enter');
  
  await page.locator('umb-property-layout').filter({ hasText: 'Test Action Edited Post' }).getByRole('img').click();
  await page.getByRole('checkbox', { name: 'Test Action Edited' }).selectOption('1');
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Test', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Generate' }).click();
  await expect(page.getByRole('button', { name: 'Clean' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();
  await page.getByRole('button', { name: 'Deploy' }).click();
  await page.locator('#confirm').getByRole('button', { name: 'Deploy' }).click();
  await page.getByRole('button', { name: 'Clean' }).click();
  await page.getByRole('button', { name: 'Clean up' }).click();
});