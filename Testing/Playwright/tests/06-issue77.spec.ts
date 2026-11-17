import { test, expect, Page } from '@playwright/test';
import { SitePage } from '../pages/SitePage';
import { TestData } from './test-data';

/**
 * Issue 77 - "Generate" fails silently when an Asset Path folder doesn't exist.
 * https://github.com/Mulliman/xStatic-for-Umbraco/issues/77
 *
 * Uses its own site (with an asset path that can't exist) so it doesn't disturb the
 * shared site used by 02/03. Relies on the export type and deployment target from 01.
 */
test.describe.serial('Issue 77 - Missing asset path is reported', () => {
    const siteName = TestData.Issue77SiteName;
    const missingAssetPath = TestData.MissingAssetPath;

    const siteRow = (page: Page) => page.locator('xstatic-site-element').filter({ hasText: siteName }).first();
    const toast = (page: Page, text: string) => page.locator('uui-toast-notification').filter({ hasText: text }).first();

    test('Create a site with an asset path that does not exist', async ({ page }) => {
        const sitePage = new SitePage(page);
        await sitePage.goto();

        await sitePage.create(
            siteName,
            'Home',
            TestData.ExportTypeNameEdited,
            TestData.DeploymentTargetNameEdited,
            [missingAssetPath]
        );

        await sitePage.verifyExists(siteName, TestData.ExportTypeNameEdited);
    });

    test('Deploying before generating explains that the site must be generated first', async ({ page }) => {
        const sitePage = new SitePage(page);
        await sitePage.goto();

        const row = siteRow(page);
        await expect(row).toBeVisible();

        const deployResponse = page.waitForResponse(r => r.url().includes('xstatic/deploy/deploy-site'));
        await sitePage.deploy(siteName);
        const response = await deployResponse;

        // Previously a bare FileNotFoundException ("Unable to find the specified file.").
        expect(response.ok()).toBeFalsy();
        expect(await response.text()).toContain('Generate the site before deploying');

        await expect(row.getByRole('table')).not.toContainText('Last deployed on');
    });

    test('Generating reports the missing asset path but still generates the pages', async ({ page }) => {
        const sitePage = new SitePage(page);
        await sitePage.goto();

        const row = siteRow(page);
        await expect(row).toBeVisible();

        const generateResponse = page.waitForResponse(r =>
            r.url().includes('xstatic/generate/generate-site') && r.request().method() === 'POST'
        , { timeout: 60000 });

        await sitePage.generate(siteName);

        const response = await generateResponse;
        expect(response.status()).toBe(200);

        const result = await response.json();

        // Previously: wasSuccessful false, exception "Could not find a part of the path ...", results [].
        expect(result.exception ?? null).toBeNull();
        expect(result.results.length).toBeGreaterThan(0);
        expect(result.results).toContainEqual(expect.objectContaining({
            wasSuccessful: false,
            type: 'Asset',
            item: missingAssetPath,
        }));
        expect(result.results.some((r: { wasSuccessful: boolean; type: string }) => r.wasSuccessful && r.type !== 'Asset')).toBeTruthy();

        // Previously the UI showed nothing at all.
        const warning = toast(page, 'Site generated with');
        await expect(warning).toBeVisible({ timeout: 30000 });
        await expect(warning).toContainText(missingAssetPath);

        // Pages were still generated.
        await expect(row.getByRole('table')).toContainText('Last generated on', { timeout: 30000 });
        await expect(row.getByRole('button', { name: 'Clean' })).toBeVisible({ timeout: 30000 });
    });

    test.afterAll(async ({ browser }) => {
        const context = await browser.newContext({
            baseURL: 'https://localhost:5000',
            ignoreHTTPSErrors: true,
            storageState: 'playwright/.auth/user.json',
        });
        const page = await context.newPage();

        try {
            const sitePage = new SitePage(page);
            await sitePage.goto();

            const row = siteRow(page);
            await row.waitFor({ state: 'visible', timeout: 15000 }).catch(() => undefined);

            if (await row.isVisible()) {
                const clean = row.getByRole('button', { name: 'Clean' });
                if (await clean.isVisible()) {
                    await clean.click();
                    await page.getByRole('button', { name: 'Clean up' }).click();
                    await page.waitForTimeout(1000);
                }

                await sitePage.delete(siteName);
            }
        } finally {
            await context.close();
        }
    });
});
