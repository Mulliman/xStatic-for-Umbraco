import { test, expect, Page } from '@playwright/test';

/**
 * Submitting an empty create form must show validation errors, keep the dialog open, and send nothing to the API.
 */
async function expectEmptySubmitIsBlocked(page: Page, dashboard: string, openButton: string, createApi: string) {
    const createCalls: string[] = [];
    page.on('request', r => {
        if (r.url().includes(createApi)) createCalls.push(r.url());
    });

    await page.goto(`/umbraco/section/xstatic/dashboard/${dashboard}`);
    await page.getByRole('button', { name: openButton }).first().click();

    const submit = page.getByRole('button', { name: 'Submit' });
    await expect(submit).toBeVisible();
    await submit.click();

    await expect(page.locator('xstatic-validation-error-wrapper[errorMessage]').first()).toBeVisible();
    await expect(submit, 'the dialog stays open').toBeVisible();
    expect(createCalls, `no call to ${createApi}`).toEqual([]);

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(submit).not.toBeVisible();
}

test.describe('Form validation', () => {
    test('Empty site form is not submitted', async ({ page }) => {
        await expectEmptySubmitIsBlocked(page, 'xstatic', 'Create new static site', 'xstatic/sites/create');
    });

    test('Empty export type form is not submitted', async ({ page }) => {
        await expectEmptySubmitIsBlocked(page, 'xstatic-export-types', 'Create new Export Type', 'xstatic/config/create-export-type');
    });

    test('Empty action form is not submitted', async ({ page }) => {
        await expectEmptySubmitIsBlocked(page, 'xstatic-actions', 'Create new Action', 'xstatic/actions/create-post-action');
    });

    test('Empty deployment target form is not submitted', async ({ page }) => {
        await expectEmptySubmitIsBlocked(page, 'xstatic-deployment-targets', 'Manually Configure New', 'xstatic/deployment-targets/create-deployment-target');
    });
});
