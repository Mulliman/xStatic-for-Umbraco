import { test, expect } from '@playwright/test';

test.describe('Site Operations', () => {
  test('Run a generate', async ({ page }) => {
    await page.goto('/umbraco/section/xstatic');
    await page.getByRole('button', { name: 'Generate' }).click();
    
    // Wait for buttons that appear after generation
    await expect(page.getByRole('button', { name: 'Clean' })).toBeVisible({ timeout: 60000 });
    await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Deploy' })).toBeVisible();
  });

  test('Run a deploy', async ({ page }) => {
    await page.goto('/umbraco/section/xstatic');
    await page.getByRole('button', { name: 'Deploy' }).click();
    await page.locator('#confirm').getByRole('button', { name: 'Deploy' }).click();
    await expect(page.getByText('Deployment successful')).toBeVisible({ timeout: 30000 });
  });

  test('Run a download', async ({ page }) => {
    await page.goto('/umbraco/section/xstatic');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.zip');
  });
});
