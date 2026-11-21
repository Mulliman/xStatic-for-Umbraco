import { test, expect } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ActionPage } from '../pages/ActionPage';
import { DeploymentTargetPage } from '../pages/DeploymentTargetPage';
import { GenerateResponse, SitePage } from '../pages/SitePage';

/**
 * Checks what xStatic actually produces, not just that each step "worked": assets, media and image crops in the
 * output, post-generation actions that succeed and fail, files arriving in the deployment folder, and Clean keeping
 * the default do-not-delete paths. Self-contained: creates and removes its own target, actions and site.
 */
test.describe.serial('Generated output', () => {
    const runId = process.env.TEST_RUN_ID || 'local';
    const siteName = `Output Site ${runId}`;
    const targetName = `Output Target ${runId}`;
    const copy404Action = `Copy 404 ${runId}`;
    const cnameAction = `Make CNAME ${runId}`;
    const brokenAction = `Broken Copy ${runId}`;
    const crop = '300x200';
    const deployFolder = path.join(os.tmpdir(), `xstatic-playwright-${runId}`);
    const downloadDir = path.join(__dirname, '..', 'test-results');

    let generated: GenerateResponse;

    test.beforeAll(() => {
        fs.mkdirSync(downloadDir, { recursive: true });
    });

    test('Set up a deployment target, actions and a site with assets, media and crops', async ({ page }) => {
        const targets = new DeploymentTargetPage(page);
        await targets.goto();
        await targets.create(targetName, 'filesystem', { 'Folder Path': deployFolder });
        await targets.verifyExists(targetName, 'filesystem');

        const actions = new ActionPage(page);
        await actions.goto();
        await actions.create(copy404Action, 'FileCopyAction', { FilePath: '/error/index.html', NewFilePath: '404.html' });
        await actions.verifyExists(copy404Action, 'FileCopyAction');
        await actions.create(cnameAction, 'FileCopyAction', { FilePath: '/error/index.html', NewFilePath: 'CNAME' });
        await actions.verifyExists(cnameAction, 'FileCopyAction');
        await actions.create(brokenAction, 'FileCopyAction', { FilePath: '/does-not-exist.html', NewFilePath: 'nowhere.html' });
        await actions.verifyExists(brokenAction, 'FileCopyAction');

        const sites = new SitePage(page);
        await sites.goto();
        const createRequest = page.waitForRequest(r => r.url().includes('xstatic/sites/create'));
        await sites.create(siteName, 'Home', 'HTML Website', targetName, ['/css'], {
            imageCrops: [crop],
            postActions: [copy404Action, cnameAction, brokenAction],
            mediaRoot: 'Sample Images',
        });
        const sent = (await createRequest).postDataJSON();
        console.log('Site create request:', JSON.stringify({ mediaRootNodes: sent.mediaRootNodes, imageCrops: sent.imageCrops, assetPaths: sent.assetPaths, postGenerationActionIds: sent.postGenerationActionIds }));
        expect(sent.mediaRootNodes?.length, 'a media root is sent').toBe(1);
        expect(sent.imageCrops).toBe(crop);
        expect(sent.postGenerationActionIds?.length).toBe(3);
        await sites.verifyExists(siteName, 'HTML Website');
    });

    test('Generate reports pages, assets, media and each post-generation action', async ({ page }) => {
        const sites = new SitePage(page);
        await sites.goto();
        generated = await sites.generateAndWait(siteName);

        const ofType = (type: string) => generated.results.filter(r => r.type === type);
        const summary = generated.results.reduce<Record<string, number>>((s, r) => ({ ...s, [r.type]: (s[r.type] ?? 0) + 1 }), {});
        console.log('Generate results by type:', JSON.stringify(summary));
        const failures = generated.results.filter(r => !r.wasSuccessful);

        expect(ofType('Page').length, 'pages generated').toBeGreaterThan(5);
        expect(ofType('Page').every(r => r.wasSuccessful), 'every page generated').toBeTruthy();
        expect(ofType('Folder').some(r => r.wasSuccessful && r.item.replace(/\\/g, '/').endsWith('/index.css')), 'css copied').toBeTruthy();
        expect(ofType('Media').some(r => r.wasSuccessful), 'media generated').toBeTruthy();

        const actionResult = (name: string) => generated.results.find(r => r.type === 'PostAction' && r.item === name);
        expect(actionResult(copy404Action)?.wasSuccessful, 'working copy action succeeds').toBe(true);
        expect(actionResult(cnameAction)?.wasSuccessful, 'CNAME copy action succeeds').toBe(true);
        expect(actionResult(brokenAction)?.wasSuccessful, 'copy of a missing file is reported as failed').toBe(false);

        // The only failure is the deliberately broken action, so the run as a whole is unsuccessful.
        expect(failures.map(f => f.item)).toEqual([brokenAction]);
        expect(generated.wasSuccessful).toBe(false);

        await expect(sites.row(siteName).getByRole('table')).toContainText('Last generated on', { timeout: 30000 });
    });

    test('Download contains the pages, assets, media, crops and action output', async ({ page }) => {
        const sites = new SitePage(page);
        await sites.goto();
        const entries = await sites.downloadEntries(siteName, downloadDir);
        const names = [...entries.keys()];

        expect(names).toContain('index.html');
        expect(entries.get('index.html')!.toString()).toContain('<html');
        expect(names).toContain('error/index.html');
        expect(names).toContain('css/index.css');

        // Post-generation actions ran on the stored output.
        expect(names).toContain('404.html');
        expect(entries.get('404.html')!.equals(entries.get('error/index.html')!)).toBeTruthy();
        expect(names).toContain('CNAME');
        expect(names).not.toContain('nowhere.html');

        // Media from the chosen media root, plus a resized copy for each crop.
        const media = names.filter(n => n.startsWith('media/'));
        expect(media.length, 'media files').toBeGreaterThan(0);
        const crops = media.filter(n => n.includes(`--${crop}.`));
        const croppable = media.filter(n => /\.(jpe?g|png|gif|webp)$/i.test(n) && !n.includes('--'));
        if (croppable.length > 0) {
            expect(crops.length, `a --${crop} crop for the images`).toBeGreaterThan(0);
            for (const cropFile of crops) {
                expect(entries.get(cropFile)!.length, `${cropFile} is not empty`).toBeGreaterThan(0);
            }
        }
    });

    test('Deploy copies the generated site into the deployment folder', async ({ page }) => {
        const sites = new SitePage(page);
        await sites.goto();
        const response = await sites.deployAndWait(siteName);
        expect(response.ok(), await response.text()).toBeTruthy();

        expect(fs.existsSync(path.join(deployFolder, 'index.html'))).toBeTruthy();
        expect(fs.existsSync(path.join(deployFolder, '404.html'))).toBeTruthy();
        expect(fs.existsSync(path.join(deployFolder, 'css', 'index.css'))).toBeTruthy();
        await expect(sites.row(siteName).getByRole('table')).toContainText('Last deployed on', { timeout: 30000 });
    });

    test('Clean removes the output but keeps the default do-not-delete paths (CNAME)', async ({ page }) => {
        const sites = new SitePage(page);
        await sites.goto();
        await sites.clean(siteName);

        const entries = await sites.downloadEntries(siteName, downloadDir);
        expect([...entries.keys()]).toEqual(['CNAME']);
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

            const actions = new ActionPage(page);
            await actions.goto();
            for (const name of [copy404Action, cnameAction, brokenAction]) {
                await actions.delete(name);
            }

            const targets = new DeploymentTargetPage(page);
            await targets.goto();
            await targets.delete(targetName);
        } finally {
            await page.close();
            fs.rmSync(deployFolder, { recursive: true, force: true });
        }
    });
});
