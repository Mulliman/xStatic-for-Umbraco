import { test, expect } from '@playwright/test';
import { ExportTypePage } from '../pages/ExportTypePage';
import { ActionPage } from '../pages/ActionPage';
import { DeploymentTargetPage } from '../pages/DeploymentTargetPage';
import { SitePage } from '../pages/SitePage';
import { TestData } from './test-data';

test.describe.configure({ mode: 'serial' });

test('Clean generated site folder and delete site', async ({ page }) => {
    const sitePage = new SitePage(page);
    await sitePage.goto();

    // Check if site exists
    const siteElement = page.locator('xstatic-site-element').filter({ hasText: TestData.SiteNameEdited }).first();
    if (await siteElement.isVisible()) {
        await siteElement.getByRole('button', { name: 'Clean' }).click();
        await page.getByRole('button', { name: 'Clean up' }).click();
        
        await siteElement.getByRole('button', { name: 'Delete' }).click();
        await page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();
        await expect(siteElement).not.toBeVisible();
    } else {
        // Check for non-edited version
        const siteElementOld = page.locator('xstatic-site-element').filter({ hasText: TestData.SiteName }).first();
        if (await siteElementOld.isVisible()) {
             await siteElementOld.getByRole('button', { name: 'Delete' }).click();
             await page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();
             await expect(siteElementOld).not.toBeVisible();
        }
    }
});

test('Delete Export Type', async ({ page }) => {
    const exportTypePage = new ExportTypePage(page);
    await exportTypePage.goto();

    await exportTypePage.delete(TestData.ExportTypeNameEdited);
    await exportTypePage.delete(TestData.ExportTypeName); // Also check for original name
});

test('Delete Action', async ({ page }) => {
    const actionPage = new ActionPage(page);
    await actionPage.goto();

    await actionPage.delete(TestData.ActionNameEdited);
    await actionPage.delete(TestData.ActionName);
});

test('Delete Deployment Target', async ({ page }) => {
    const deploymentTargetPage = new DeploymentTargetPage(page);
    await deploymentTargetPage.goto();

    await deploymentTargetPage.delete(TestData.DeploymentTargetNameEdited);
    await deploymentTargetPage.delete(TestData.DeploymentTargetName);
});
