import { test, expect } from '@playwright/test';

/**
 * Smoke tests for the dashboards the functional specs don't use.
 */
test.describe('Dashboards', () => {
    test('Config dashboard lists the installed components', async ({ page }) => {
        const config = page.waitForResponse(r => r.url().includes('xstatic/config/get-config'));
        await page.goto('/umbraco/section/xstatic/dashboard/xstatic-config');
        expect((await config).status()).toBe(200);

        await expect(page.getByText('Installed Components:').first()).toBeVisible();
        for (const component of ['StaticHtmlSiteGenerator', 'BasicJsonApiGenerator', 'EverythingIsIndexHtmlFileNameGenerator', 'FileCopyAction']) {
            await expect(page.getByText(component).first(), `${component} is listed`).toBeVisible();
        }
    });

    test('Documentation dashboard shows built-in wiki documentation and plugins tab', async ({ page }) => {
        await page.goto('/umbraco/section/xstatic/dashboard/xstatic-info');

        await expect(page.getByRole('tab', { name: /Documentation/ })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Home/ })).toBeVisible();

        await page.getByRole('tab', { name: /Plugins/ }).click();
        await expect(page.getByRole('heading', { name: /Plugins/ })).toBeVisible();
    });
});
