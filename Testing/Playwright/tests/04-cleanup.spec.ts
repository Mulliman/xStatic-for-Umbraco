import { test, expect } from '@playwright/test';
import { ExportTypePage } from '../pages/ExportTypePage';
import { ActionPage } from '../pages/ActionPage';
import { DeploymentTargetPage } from '../pages/DeploymentTargetPage';
import { SitePage } from '../pages/SitePage';
import { TestData } from './test-data';

test.describe('Cleanup Operations', () => {

    test('Clean generated site folder and delete site', async ({ page }) => {
        const sitePage = new SitePage(page);
        await sitePage.goto();

        await sitePage.verifyExists(TestData.SiteNameEdited);

        // Check if site exists (Edited Name)
        const siteElement = page.locator('xstatic-site-element').filter({ hasText: TestData.SiteNameEdited }).first();
        if (await siteElement.isVisible()) {
            await siteElement.getByRole('button', { name: 'Clean' }).click();
            await page.getByRole('button', { name: 'Clean up' }).click();
            // Wait for modal to close if needed, but delete() is next
            await page.waitForTimeout(1000); 
        }

        await sitePage.delete(TestData.SiteNameEdited);
        
        await page.waitForTimeout(1000); 

        await sitePage.verifyNotExists(TestData.SiteNameEdited);

        // Check for non-edited version just in case
        const siteElementOld = page.locator('xstatic-site-element').filter({ hasText: TestData.SiteName }).first();
        if (await siteElementOld.isVisible()) {
            // Also clean it if it exists
            await siteElementOld.getByRole('button', { name: 'Clean' }).click();
            await page.getByRole('button', { name: 'Clean up' }).click();
        }
        await sitePage.delete(TestData.SiteName);
    });

    test('Delete Export Type', async ({ page }) => {
        const exportTypePage = new ExportTypePage(page);
        await exportTypePage.goto();

        await exportTypePage.verifyExists(TestData.ExportTypeNameEdited, '', '', '');

        await exportTypePage.delete(TestData.ExportTypeNameEdited);
        await exportTypePage.delete(TestData.ExportTypeName); // Also check for original name
    });

    test('Delete Action', async ({ page }) => {
        const actionPage = new ActionPage(page);
        await actionPage.goto();

        await actionPage.verifyExists(TestData.ActionNameEdited, 'FileCopyAction');

        await actionPage.delete(TestData.ActionNameEdited);
        await actionPage.delete(TestData.ActionName);
    });

    test('Delete Deployment Target', async ({ page }) => {
        const deploymentTargetPage = new DeploymentTargetPage(page);
        await deploymentTargetPage.goto();

        await deploymentTargetPage.verifyExists(TestData.DeploymentTargetNameEdited, 'filesystem');

        await deploymentTargetPage.delete(TestData.DeploymentTargetNameEdited);
        await deploymentTargetPage.delete(TestData.DeploymentTargetName);
    });
});