import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { ActionPage } from '../pages/ActionPage';
import { ExportTypePage } from '../pages/ExportTypePage';
import { SitePage } from '../pages/SitePage';

/**
 * Verifies two things end-to-end against the real Umbraco backoffice:
 * 1. Typed action fields (Toggle and Integer) pre-populate defaults, save without 400 JSON conversion
 *    errors, and re-hydrate accurately (including false toggles staying unchecked) when reopened.
 * 2. Companion Markdown (.md), MarkdownDiscoveryTransformer, /llms.txt, /llms-full.txt, RAG JSONL
 *    chunks, and webmcp-index.json are generated and included in the downloaded static output.
 *
 * Self-contained: creates and cleans up its own export type, actions, and site.
 */
test.describe.serial('Typed action fields and AI / GEO / RAG output', () => {
    const runId = process.env.TEST_RUN_ID || 'local';
    const llmsActionName = `PW llms.txt ${runId}`;
    const ragActionName = `PW RAG Export ${runId}`;
    const exportTypeName = `PW HTML MD GEO ${runId}`;
    const siteName = `PW GEO Site ${runId}`;
    const targetHostname = 'https://geo-test.example.com';
    const downloadDir = path.join(__dirname, '..', 'test-results');

    const toggleCheckbox = (page: Page, alias: string) =>
        page.locator(`xstatic-edit-action-modal umb-property[alias="${alias}"] input[type="checkbox"]`).first();

    const toggleControl = (page: Page, alias: string) =>
        page.locator(`xstatic-edit-action-modal umb-property[alias="${alias}"] uui-toggle`).first();

    const numberInput = (page: Page, alias: string) =>
        page.locator(`xstatic-edit-action-modal umb-property[alias="${alias}"] input`).first();

    test.beforeAll(() => {
        fs.mkdirSync(downloadDir, { recursive: true });
    });

    test('Toggle fields pre-populate defaults, save cleanly, and persist toggled states on reopen', async ({ page }) => {
        const actions = new ActionPage(page);
        await actions.goto();

        await page.getByRole('button', { name: 'Create new Action', exact: true }).click();
        await page.getByRole('textbox', { name: 'Field for Action Name *' }).fill(llmsActionName);
        await page.getByLabel('Field for Action Type *').selectOption({ label: 'GenerateLlmsTxtAction' });

        // Defaults from [XStaticEditableField(..., DefaultValue = ...)]
        await expect(toggleCheckbox(page, 'GenerateFullFile')).toBeChecked();
        await expect(toggleCheckbox(page, 'GenerateCompanionMarkdown')).not.toBeChecked();
        await expect(toggleCheckbox(page, 'UseMarkdownLinks')).toBeChecked();

        await page.getByRole('textbox', { name: 'Field for SiteTitle' }).fill('Playwright GEO Demo');
        // Flip GenerateFullFile OFF -> ON check via companion flip: turn GenerateCompanionMarkdown ON,
        // and leave GenerateFullFile ON first; we'll test flipping ON->OFF in the edit step below.
        await toggleControl(page, 'GenerateCompanionMarkdown').click();
        await expect(toggleCheckbox(page, 'GenerateCompanionMarkdown')).toBeChecked();

        const createResponse = page.waitForResponse(r => r.url().includes('xstatic/actions/create-post-action'));
        await page.getByRole('button', { name: 'Submit' }).click();
        const created = await createResponse;
        expect(created.status(), await created.text()).toBe(200);
        await expect(page.locator('xstatic-edit-action-modal')).not.toBeVisible();
        await actions.verifyExists(llmsActionName, 'GenerateLlmsTxtAction');

        // Reopen and verify persisted toggle values (including flipping back OFF -> saved as "false",
        // then reopening again to ensure "false" is NOT hydrated as truthy).
        await actions.getItemBox(llmsActionName).getByRole('button', { name: 'Edit' }).click();
        await expect(toggleCheckbox(page, 'GenerateFullFile')).toBeChecked();
        await expect(toggleCheckbox(page, 'GenerateCompanionMarkdown')).toBeChecked();
        await expect(toggleCheckbox(page, 'UseMarkdownLinks')).toBeChecked();

        await toggleControl(page, 'GenerateCompanionMarkdown').click();
        await expect(toggleCheckbox(page, 'GenerateCompanionMarkdown')).not.toBeChecked();

        const updateResponse = page.waitForResponse(r => r.url().includes('xstatic/actions/update-post-action'));
        await page.getByRole('button', { name: 'Submit' }).click();
        const updated = await updateResponse;
        expect(updated.status(), await updated.text()).toBe(200);
        await expect(page.locator('xstatic-edit-action-modal')).not.toBeVisible();

        // Reopen once more to prove "false" stays unchecked.
        await actions.getItemBox(llmsActionName).getByRole('button', { name: 'Edit' }).click();
        await expect(toggleCheckbox(page, 'GenerateFullFile')).toBeChecked();
        await expect(toggleCheckbox(page, 'GenerateCompanionMarkdown')).not.toBeChecked();
        await expect(toggleCheckbox(page, 'UseMarkdownLinks')).toBeChecked();
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.locator('xstatic-edit-action-modal')).not.toBeVisible();
    });

    test('Integer and Toggle fields on RagExportPostGenerationAction save and reload cleanly', async ({ page }) => {
        const actions = new ActionPage(page);
        await actions.goto();

        await page.getByRole('button', { name: 'Create new Action', exact: true }).click();
        await page.getByRole('textbox', { name: 'Field for Action Name *' }).fill(ragActionName);
        await page.getByLabel('Field for Action Type *').selectOption({ label: 'RagExportPostGenerationAction' });

        await expect(numberInput(page, 'MaxChunkSize')).toHaveValue('1000');
        await expect(numberInput(page, 'ChunkOverlap')).toHaveValue('150');
        await expect(toggleCheckbox(page, 'SplitOnHeadings')).toBeChecked();
        await expect(toggleCheckbox(page, 'GenerateWebMcpIndex')).toBeChecked();

        await numberInput(page, 'MaxChunkSize').fill('800');
        await numberInput(page, 'ChunkOverlap').fill('100');

        const createResponse = page.waitForResponse(r => r.url().includes('xstatic/actions/create-post-action'));
        await page.getByRole('button', { name: 'Submit' }).click();
        const created = await createResponse;
        expect(created.status(), await created.text()).toBe(200);
        await expect(page.locator('xstatic-edit-action-modal')).not.toBeVisible();
        await actions.verifyExists(ragActionName, 'RagExportPostGenerationAction');

        await actions.getItemBox(ragActionName).getByRole('button', { name: 'Edit' }).click();
        await expect(numberInput(page, 'MaxChunkSize')).toHaveValue('800');
        await expect(numberInput(page, 'ChunkOverlap')).toHaveValue('100');
        await expect(toggleCheckbox(page, 'SplitOnHeadings')).toBeChecked();
        await expect(toggleCheckbox(page, 'GenerateWebMcpIndex')).toBeChecked();
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.locator('xstatic-edit-action-modal')).not.toBeVisible();
    });

    test('Generating a GEO + RAG site emits companion .md, discovery tags, llms.txt, RAG JSONL, and webmcp-index.json', async ({ page }) => {
        const exportTypes = new ExportTypePage(page);
        await exportTypes.goto();
        await exportTypes.create(
            exportTypeName,
            'GeoHtmlTransformerListFactory',
            'StaticHtmlWithMarkdownSiteGenerator',
            'EverythingIsIndexHtmlFileNameGenerator',
        );
        await expect(exportTypes.getItemBox(exportTypeName)).toBeVisible();

        const sites = new SitePage(page);
        await sites.goto();
        await sites.create(siteName, 'Home', exportTypeName, undefined, [], {
            postActions: [llmsActionName, ragActionName],
            targetHostname,
        });
        await sites.verifyExists(siteName, exportTypeName);

        const generated = await sites.generateAndWait(siteName);
        expect(generated.wasSuccessful, JSON.stringify(generated.results.filter(r => !r.wasSuccessful))).toBe(true);

        const entries = await sites.downloadEntries(siteName, downloadDir);
        const names = [...entries.keys()];

        // Companion Markdown & MarkdownDiscoveryTransformer
        expect(names).toContain('index.html');
        expect(names).toContain('index.md');
        const homeHtml = entries.get('index.html')!.toString('utf8');
        expect(homeHtml).toContain(`rel="alternate" type="text/markdown" href="${targetHostname}/index.md"`);
        expect(entries.get('index.md')!.toString('utf8').trim().length).toBeGreaterThan(20);

        // /llms.txt and /llms-full.txt
        expect(names).toContain('llms.txt');
        expect(names).toContain('llms-full.txt');
        const llmsTxt = entries.get('llms.txt')!.toString('utf8');
        expect(llmsTxt).toContain('# Playwright GEO Demo');
        expect(llmsTxt).toContain(`${targetHostname}/index.md`);

        // RAG chunks (JSONL) and WebMCP index
        expect(names).toContain('rag-chunks.jsonl');
        expect(names).toContain('webmcp-index.json');
        const jsonlLines = entries.get('rag-chunks.jsonl')!.toString('utf8').trim().split(/\r?\n/);
        expect(jsonlLines.length).toBeGreaterThan(0);
        const firstChunk = JSON.parse(jsonlLines[0]);
        expect(firstChunk).toHaveProperty('content');
        expect(firstChunk).toHaveProperty('contentHash');

        const webMcp = JSON.parse(entries.get('webmcp-index.json')!.toString('utf8'));
        expect(webMcp.tools.map((t: { name: string }) => t.name)).toEqual(
            expect.arrayContaining(['search_site_content', 'get_page_chunks']),
        );
        expect(webMcp.pages.length).toBeGreaterThan(0);
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

            const actions = new ActionPage(page);
            await actions.goto();
            for (const name of [llmsActionName, ragActionName]) {
                await actions.delete(name);
            }
        } finally {
            await page.close();
        }
    });
});
