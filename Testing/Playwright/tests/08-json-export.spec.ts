import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { ExportTypePage } from '../pages/ExportTypePage';
import { SitePage } from '../pages/SitePage';

/**
 * Generates a site with a JSON export type (BasicJsonApiGenerator) and checks the output is valid JSON with
 * content links turned into .json URLs. Self-contained.
 */
test.describe.serial('JSON export', () => {
    const runId = process.env.TEST_RUN_ID || 'local';
    const exportTypeName = `JSON Export ${runId}`;
    const siteName = `JSON Site ${runId}`;
    const downloadDir = path.join(__dirname, '..', 'test-results');

    test.beforeAll(() => {
        fs.mkdirSync(downloadDir, { recursive: true });
    });

    test('Create a JSON export type and a site that uses it', async ({ page }) => {
        const exportTypes = new ExportTypePage(page);
        await exportTypes.goto();
        await exportTypes.create(exportTypeName, 'DefaultJsonTransformerListFactory', 'BasicJsonApiGenerator', 'JsonFileNameGenerator');
        await expect(exportTypes.getItemBox(exportTypeName)).toBeVisible();

        const sites = new SitePage(page);
        await sites.goto();
        await sites.create(siteName, 'Home', exportTypeName);
        await sites.verifyExists(siteName, exportTypeName);
    });

    test('Generating writes one valid JSON file per page', async ({ page }) => {
        const sites = new SitePage(page);
        await sites.goto();
        const generated = await sites.generateAndWait(siteName);

        const pages = generated.results.filter(r => r.type === 'Page');
        expect(pages.length).toBeGreaterThan(5);
        expect(pages.filter(p => !p.wasSuccessful), 'failed pages').toEqual([]);

        const entries = await sites.downloadEntries(siteName, downloadDir);
        const jsonFiles = [...entries.keys()].filter(n => n.endsWith('.json'));

        expect(jsonFiles).toContain('index.json');
        expect(jsonFiles.length).toBe(pages.length);
        expect([...entries.keys()].filter(n => n.endsWith('.html')), 'no HTML in a JSON export').toEqual([]);

        for (const file of jsonFiles) {
            const text = entries.get(file)!.toString('utf8');
            expect(() => JSON.parse(text), `${file} is valid JSON`).not.toThrow();
            // UmbracoContentUdiToJsonUrlTransformer turns content links into .json URLs.
            expect(text, `${file} has no unresolved umb://document links`).not.toMatch(/umb:\/\/document\/[a-f0-9]{32}/);
        }
    });

    test.afterAll(async ({ browser }) => {
        const page = await browser.newPage({
            storageState: path.join(__dirname, '..', 'playwright/.auth/user.json'),
            baseURL: 'https://localhost:5000',
            ignoreHTTPSErrors: true,
        });
        try {
            const sites = new SitePage(page);
            await sites.goto();
            await sites.delete(siteName);

            const exportTypes = new ExportTypePage(page);
            await exportTypes.goto();
            await exportTypes.delete(exportTypeName);
        } finally {
            await page.close();
        }
    });
});
