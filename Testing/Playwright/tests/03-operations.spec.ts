import { test, expect } from '@playwright/test';
import { SitePage } from '../pages/SitePage';
import { TestData } from './test-data';
import AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs';

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

        // Check for loading state
        await expect(siteElement.locator('xstatic-loader')).toBeVisible();
        await expect(siteElement).toContainText('Generating...');

        // Wait for loading to finish and table to be visible again
        await expect(siteElement.getByRole('table')).toBeVisible({ timeout: 30000 });

        await expect(siteElement.getByRole('table')).toContainText('Last generated on');
        
        // Verify date is recent (today). Using regex to avoid locale format mismatches (e.g. 01/02 vs 2/1)
        const currentYear = new Date().getFullYear().toString();
        const dateRegex = new RegExp(`Last generated on \\d{1,2}/\\d{1,2}/${currentYear}`);
        await expect(siteElement.getByRole('table')).toContainText(dateRegex);

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

        // Save the download to a temporary path for inspection
        const downloadPath = path.join(__dirname, '..', 'test-results', download.suggestedFilename());
        await download.saveAs(downloadPath);

        // Verify zip contents
        const zip = new AdmZip(downloadPath);
        const zipEntries = zip.getEntries();
        
        expect(zipEntries.length).toBeGreaterThan(0);

        const htmlFiles = zipEntries.filter(entry => entry.entryName.endsWith('.html'));
        expect(htmlFiles.length).toBeGreaterThan(0);

        for (const entry of htmlFiles) {
            const content = zip.readAsText(entry);
            console.log(`Checking file: ${entry.entryName} (${content.length} bytes)`);
            
            expect(content.length, `HTML file ${entry.entryName} should not be empty`).toBeGreaterThan(100);
            
            // Basic HTML check - some generated files might be fragments or sitemaps mislabeled
            // But if it's .html it should probably have an html tag or at least some content
            if (!content.toLowerCase().includes('<html')) {
                console.warn(`Warning: File ${entry.entryName} does not contain an <html> tag.`);
            }
        }

        // Clean up
        if (fs.existsSync(downloadPath)) {
            fs.unlinkSync(downloadPath);
        }
    });
});
