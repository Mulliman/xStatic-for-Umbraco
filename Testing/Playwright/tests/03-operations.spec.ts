import { test, expect } from '@playwright/test';

test.describe('Site Operations', () => {
  test('Run a generate', async ({ page }) => {
    // Arrange
    await page.goto('/umbraco/section/xstatic');

    // Act
    await page.getByRole('button', { name: 'Generate' }).click();
    
    // Assert
    await expect(page.getByRole('table')).toContainText('Last generated on');
    await expect(page.getByRole('button', { name: 'Clean' })).toBeVisible({ timeout: 60000 });
    await expect(page.getByRole('button', { name: 'Download' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Deploy' })).toBeVisible();
  });

  test('Run a deploy', async ({ page }) => {
    await page.goto('/umbraco/section/xstatic');

    await page.getByRole('button', { name: 'Deploy' }).click();
    await page.locator('#confirm').getByRole('button', { name: 'Deploy' }).click();
    await expect(page.getByRole('table')).toContainText('Last deployed on');
  });

  test('Run a download', async ({ page }) => {
    // Arrange
    await page.goto('/umbraco/section/xstatic');
    const downloadPromise = page.waitForEvent('download');

    // Act
    await page.getByRole('button', { name: 'Download' }).click();
    const download = await downloadPromise;

    // Assert
    expect(download.suggestedFilename()).toContain('.zip');
  });
});
