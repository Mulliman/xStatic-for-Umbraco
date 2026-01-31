import { test, expect } from '@playwright/test';
import { SitePage } from '../pages/SitePage';
import { TestData } from './test-data';

test.describe('Site Operations', () => {
    test.beforeEach(async ({ page }) => {
        const sitePage = new SitePage(page);
        await sitePage.goto();
    });

    test('Run a generate', async ({ page }) => {
        const siteElement = page.locator('xstatic-site-element').filter({ hasText: TestData.SiteNameEdited }).first();
        
        // Check if the site is visible, otherwise try the unedited name just in case of prev failure
        // But for this test we assume happy path from 02
        await expect(siteElement).toBeVisible();

        await siteElement.getByRole('button', { name: 'Generate' }).click();

        await expect(siteElement.getByRole('table')).toContainText('Last generated on');
        // Wait for buttons to appear/update
        await expect(siteElement.getByRole('button', { name: 'Clean' })).toBeVisible({ timeout: 60000 });
        await expect(siteElement.getByRole('button', { name: 'Download' })).toBeVisible();
        await expect(siteElement.getByRole('button', { name: 'Deploy' })).toBeVisible();
    });

    test('Run a deploy', async ({ page }) => {
        const siteElement = page.locator('xstatic-site-element').filter({ hasText: TestData.SiteNameEdited }).first();
        
        await siteElement.getByRole('button', { name: 'Deploy' }).click();
        await page.locator('#confirm').getByRole('button', { name: 'Deploy' }).click();
        
        await expect(siteElement.getByRole('table')).toContainText('Last deployed on');
    });

    test('Run a download', async ({ page }) => {
        const siteElement = page.locator('xstatic-site-element').filter({ hasText: TestData.SiteNameEdited }).first();
        
        const downloadPromise = page.waitForEvent('download');
        await siteElement.getByRole('button', { name: 'Download' }).click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toContain('.zip');
    });
});
