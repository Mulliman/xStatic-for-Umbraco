import { test, expect } from '@playwright/test';
import fs from 'fs';
import net from 'net';
import path from 'path';
import { DeploymentTargetPage } from '../pages/DeploymentTargetPage';
import { SitePage } from '../pages/SitePage';

/**
 * Deploys a site through the backoffice to the Docker FTP server in Testing/Ftp and checks the files on the server.
 * Skipped unless that server is running and the test site has the FTP deployer installed (setup-local-instance.ps1
 * -IncludeAllExtensions). See Testing.md, "FTP deployer".
 */
const ftpPort = Number(process.env.XSTATIC_FTP_PORT || 2121);
const ftpData = path.join(__dirname, '..', '..', 'Ftp', 'data');
const remoteSite = path.join(ftpData, 'site');

function ftpServerIsRunning(): Promise<boolean> {
    return new Promise(resolve => {
        const socket = net.connect({ host: '127.0.0.1', port: ftpPort });
        socket.setTimeout(2000);
        socket.once('connect', () => { socket.destroy(); resolve(true); });
        socket.once('timeout', () => { socket.destroy(); resolve(false); });
        socket.once('error', () => resolve(false));
    });
}

test.describe.serial('FTP deploy', () => {
    const runId = process.env.TEST_RUN_ID || 'local';
    const siteName = `FTP Site ${runId}`;
    const targetName = `FTP Target ${runId}`;

    test.beforeAll(async () => {
        test.skip(!(await ftpServerIsRunning()), `No FTP server on 127.0.0.1:${ftpPort}. Start it with: docker compose -f Testing/Ftp/docker-compose.yml up -d`);
    });

    test('Set up an FTP deployment target and a site that uses it', async ({ page }) => {
        const targets = new DeploymentTargetPage(page);
        await targets.goto();
        await page.getByRole('button', { name: 'Manually Configure New' }).click();
        const deployerOptions = await page.getByLabel('Field for Deployer *').locator('option').allTextContents();
        await page.getByRole('button', { name: 'Cancel' }).click();
        test.skip(!deployerOptions.some(o => /ftp/i.test(o)), 'The FTP deployer is not installed in this test site (setup-local-instance.ps1 -IncludeAllExtensions).');

        await targets.create(targetName, 'ftp', {
            Hostname: '127.0.0.1',
            Port: String(ftpPort),
            Username: 'xstest',
            Password: 'xstestpw',
            Folder: '/home/xstest/site',
        });
        await targets.verifyExists(targetName, 'ftp');

        const sites = new SitePage(page);
        await sites.goto();
        await sites.create(siteName, 'Home', 'HTML Website', targetName, ['/css']);
        await sites.verifyExists(siteName, 'HTML Website');
    });

    test('Deploy uploads the site, replaces old files and removes ones no longer in the site', async ({ page }) => {
        // What an earlier deploy might have left: an out-of-date home page and a page since deleted.
        fs.rmSync(remoteSite, { recursive: true, force: true });
        fs.mkdirSync(remoteSite, { recursive: true });
        fs.writeFileSync(path.join(remoteSite, 'index.html'), 'old home page');
        fs.writeFileSync(path.join(remoteSite, 'deleted-page.html'), 'no longer in the site');

        const sites = new SitePage(page);
        await sites.goto();
        const generated = await sites.generateAndWait(siteName);
        expect(generated.results.filter(r => r.type === 'Page' && !r.wasSuccessful), 'failed pages').toEqual([]);

        const response = await sites.deployAndWait(siteName);
        const result = await response.json();
        expect(result.wasSuccessful, result.message).toBe(true);

        const home = fs.readFileSync(path.join(remoteSite, 'index.html'), 'utf8');
        expect(home, 'the old home page was replaced').not.toBe('old home page');
        expect(home).toContain('<html');
        expect(fs.existsSync(path.join(remoteSite, 'css', 'index.css')), 'assets are uploaded').toBeTruthy();
        expect(fs.existsSync(path.join(remoteSite, 'deleted-page.html')), 'files no longer in the site are removed').toBeFalsy();
    });

    test.afterAll(async ({ browser }) => {
        if (!(await ftpServerIsRunning())) return;

        const page = await browser.newPage({
            storageState: path.join(__dirname, '..', 'playwright/.auth/user.json'),
            baseURL: 'https://localhost:5000',
            ignoreHTTPSErrors: true,
        });
        try {
            const sites = new SitePage(page);
            await sites.goto();
            await sites.delete(siteName);

            const targets = new DeploymentTargetPage(page);
            await targets.goto();
            await targets.delete(targetName);
        } finally {
            await page.close();
            fs.rmSync(remoteSite, { recursive: true, force: true });
        }
    });
});
