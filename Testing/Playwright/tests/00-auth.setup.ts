import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // 1. Go to login
  await page.goto('https://localhost:5000/umbraco/login');
  
  // 2. Fill credentials
  await page.getByLabel('EmailE-mail').fill('admin@admin.com');
  await page.getByLabel('PasswordPassword').fill('1234567890');
  await page.getByRole('button', { name: 'Login' }).click();

  // 3. WAIT for a real logged-in element (CRITICAL)
  // This ensures Umbraco has finished its redirects and set the auth cookies
  await expect(page.getByRole('tab', { name: 'Content' })).toBeVisible({ timeout: 10000 });
  
  // 4. Double check we are in the backoffice
  await expect(page).toHaveURL(/.*umbraco\//);
  
  // 5. Save storage state
  await page.context().storageState({ path: authFile });
});