import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { DeploymentTargetPage } from '../pages/DeploymentTargetPage';
import { SitePage } from '../pages/SitePage';

/**
 * Covers what goes wrong and what's easy to break without noticing:
 * 1. A deploy that fails is reported as failed and isn't recorded as the site's last deploy.
 * 2. Password fields recommend secret references, flag ones that aren't allowed, and save only the reference,
 *    in a response the browser mustn't cache.
 * 3. Every field of a site's Edit dialog is saved and shown again when the dialog is reopened.
 *
 * Self-contained: each test creates and removes its own deployment target and site.
 */
test.describe('Deploy errors, secret references and site editing', () => {
    const runId = process.env.TEST_RUN_ID || 'local';
    const toast = (page: Page, text: string) => page.locator('uui-toast-notification').filter({ hasText: text }).first();

    test('A failed deploy shows an error and does not update "Last deployed"', async ({ page }) => {
        const siteName = `Failing Deploy Site ${runId}`;
        const targetName = `Failing Deploy Target ${runId}`;
        // The File System deployer creates its folder if it's missing. A file at that path can't be turned into a
        // folder on Windows or Linux, so the deploy fails cleanly without needing permissions set up.
        const notAFolder = path.join(os.tmpdir(), `xstatic-playwright-not-a-folder-${runId}`);
        fs.writeFileSync(notAFolder, 'This is a file, so xStatic cannot deploy into it.');

        const sites = new SitePage(page);
        const targets = new DeploymentTargetPage(page);

        try {
            await targets.goto();
            await targets.create(targetName, 'filesystem', { 'Folder Path': notAFolder });
            await targets.verifyExists(targetName, 'filesystem');

            await sites.goto();
            await sites.create(siteName, 'Home', 'HTML Website', targetName);
            await sites.verifyExists(siteName, 'HTML Website');

            const generated = await sites.generateAndWait(siteName);
            expect(generated.results.filter(r => r.type === 'Page' && !r.wasSuccessful), 'failed pages').toEqual([]);
            await expect(sites.row(siteName).getByRole('button', { name: 'Deploy' })).toBeVisible({ timeout: 30000 });

            const response = await sites.deployAndWait(siteName);
            expect(response.status()).toBe(200);
            const result = await response.json();
            expect(result.wasSuccessful, 'the deploy is reported as failed').toBe(false);
            expect(result.message).toContain('Error deploying site to file system');

            await expect(toast(page, 'Deployment failed')).toBeVisible({ timeout: 30000 });

            // Reload so the card shows what the server saved, not what the page last rendered.
            await sites.goto();
            await expect(sites.row(siteName).getByRole('table')).toContainText('Last generated on', { timeout: 30000 });
            await expect(sites.row(siteName).getByRole('table')).not.toContainText('Last deployed on');
        } finally {
            await sites.goto();
            const clean = sites.row(siteName).getByRole('button', { name: 'Clean' });
            if (await clean.isVisible()) {
                await sites.clean(siteName);
            }
            await sites.delete(siteName);

            await targets.goto();
            await targets.delete(targetName);

            fs.rmSync(notAFolder, { force: true });
        }
    });

    test('Password fields guide towards secret references and only the reference is saved', async ({ page }) => {
        const targetName = `Secret Reference Target ${runId}`;
        const reference = '${env:XSTATIC_PLAYWRIGHT_TEST}';
        // Deployers with a password field (UIEditors.Password), and what else they need to save.
        const candidates = [
            { id: 'ftp', secretLabel: 'Password', fields: { Hostname: '127.0.0.1', Port: '2121', Username: 'xstest', Folder: '/site' } },
            { id: 'netlify', secretLabel: 'Personal Access Token', fields: { 'Site ID': `playwright-${runId}` } },
        ];

        const targets = new DeploymentTargetPage(page);
        await targets.goto();
        await page.getByRole('button', { name: 'Manually Configure New' }).click();
        const deployerSelect = page.getByLabel('Field for Deployer *');
        // The options load after the form opens. File System is always installed, so once it's listed the rest are too.
        await expect(deployerSelect.locator('option', { hasText: 'File System' })).toBeAttached();

        let deployer: (typeof candidates)[number] | undefined;
        for (const candidate of candidates) {
            if ((await deployerSelect.locator(`option[value="${candidate.id}"]`).count()) > 0) {
                deployer = candidate;
                break;
            }
        }
        if (!deployer) {
            await page.getByRole('button', { name: 'Cancel' }).click();
        }
        test.skip(!deployer, 'No deployer with a password field (FTP or Netlify) is installed in this test site (setup-local-instance.ps1 -IncludeAllExtensions).');
        if (!deployer) return;

        try {
            await page.getByRole('textbox', { name: 'Field for Name *' }).fill(targetName);
            await deployerSelect.selectOption(deployer.id);

            await expect(page.locator('xstatic-secret-reference-tip')).toBeVisible();

            // xStatic's password editor renders an input with no accessible name, so find it through its property.
            const secretProperty = page.locator(`umb-property[label="${deployer.secretLabel}"]`);
            const secretInput = secretProperty.locator('input').first();
            const hint = secretProperty.locator('xstatic-secret-reference-hint [data-hint]');

            await expect(hint).toHaveAttribute('data-hint', 'tip');
            await secretInput.fill('typed-in-secret');
            await expect(hint).toHaveAttribute('data-hint', 'plain');
            await secretInput.fill('${env:NOT_ALLOWED}');
            await expect(hint).toHaveAttribute('data-hint', 'blocked');
            await expect(hint).toContainText('NOT_ALLOWED');
            await secretInput.fill(reference);
            await expect(hint).toHaveAttribute('data-hint', 'reference');

            for (const [key, value] of Object.entries(deployer.fields)) {
                await page.getByRole('textbox', { name: `Field for ${key}` }).fill(value);
            }

            const createResponse = page.waitForResponse(r => r.url().includes('xstatic/deployment-targets/create-deployment-target'));
            await page.getByRole('button', { name: 'Submit' }).click();
            const created = await createResponse;
            expect(created.status(), await created.text()).toBe(200);
            await targets.verifyExists(targetName, deployer.id);

            // The list holds secret references (and, for older targets, plain secrets), so it must never be cached.
            const listResponse = page.waitForResponse(r => r.url().includes('xstatic/deployment-targets/get-deployment-targets') && r.status() === 200);
            await targets.goto();
            const list = await listResponse;
            expect(list.headers()['cache-control'] ?? '', 'Cache-Control').toContain('no-store');

            const saved = (await list.json() as Array<{ name: string; fields: Array<{ name: string; value?: string | null }> }>)
                .find(t => t.name === targetName);
            expect(saved, 'the new target is listed').toBeTruthy();
            expect(saved!.fields.find(f => f.name === deployer.secretLabel)?.value, 'the reference is saved, not resolved').toBe(reference);

            // Reopening the target shows the reference again, with the "reference" hint.
            await targets.getItemBox(targetName).getByLabel('Edit').click();
            await expect(secretInput).toHaveValue(reference);
            await expect(hint).toHaveAttribute('data-hint', 'reference');
            await page.getByRole('button', { name: 'Cancel' }).click();
            await expect(secretInput).not.toBeVisible();
        } finally {
            await targets.goto();
            await targets.delete(targetName);
        }
    });

    test('Editing a site saves its name, target hostname, asset paths and image crops', async ({ page }) => {
        const siteName = `Round Trip Site ${runId}`;
        const editedName = `Round Trip Site Edited ${runId}`;
        const editedHostname = 'https://after.example.com';

        const sites = new SitePage(page);
        const modal = page.locator('xstatic-edit-site-modal');
        const nameField = page.getByRole('textbox', { name: 'Field for Site Name *' });
        const hostnameInput = page.locator('umb-property[alias="targetHostname"] input').first();
        const tags = (alias: string) => page.locator(`umb-property[alias="${alias}"] uui-tag`);

        try {
            await sites.goto();
            await sites.create(siteName, 'Home', 'HTML Website', undefined, ['/css'], {
                imageCrops: ['300x200'],
                targetHostname: 'https://before.example.com',
            });
            await sites.verifyExists(siteName, 'HTML Website');

            await sites.openEdit(siteName);
            await expect(nameField).toHaveValue(siteName);
            await nameField.fill(editedName);
            await hostnameInput.fill(editedHostname);
            await sites.addAssetPath('/scripts');
            await sites.addTag('imageCrops', '640x480');

            const updateRequest = page.waitForRequest(r => r.url().includes('xstatic/sites/update'));
            const updateResponse = page.waitForResponse(r => r.url().includes('xstatic/sites/update'));
            await page.getByRole('button', { name: 'Submit' }).click();
            const sent = (await updateRequest).postDataJSON();
            const updated = await updateResponse;
            expect(updated.status(), await updated.text()).toBe(200);
            await expect(modal).not.toBeVisible();

            expect(sent.name).toBe(editedName);
            expect(sent.targetHostname).toBe(editedHostname);
            expect(sent.assetPaths).toBe('/css,/scripts');
            expect(sent.imageCrops).toBe('300x200,640x480');

            // Reload so the dialog is filled from what the server saved.
            await sites.goto();
            await sites.verifyNotExists(siteName);
            await sites.verifyExists(editedName, 'HTML Website');

            await sites.openEdit(editedName);
            await expect(nameField).toHaveValue(editedName);
            await expect(hostnameInput).toHaveValue(editedHostname);
            for (const assetPath of ['/css', '/scripts']) {
                await expect(tags('assetPaths').filter({ hasText: assetPath })).toBeVisible();
            }
            for (const crop of ['300x200', '640x480']) {
                await expect(tags('imageCrops').filter({ hasText: crop })).toBeVisible();
            }
            await expect(tags('assetPaths')).toHaveCount(2);
            await expect(tags('imageCrops')).toHaveCount(2);
            await page.getByRole('button', { name: 'Cancel' }).click();
            await expect(modal).not.toBeVisible();
        } finally {
            await sites.goto();
            await sites.delete(editedName);
            await sites.delete(siteName);
        }
    });
});
