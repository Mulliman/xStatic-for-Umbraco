import { test, expect } from '@playwright/test';
import { ActionPage } from '../pages/ActionPage';

test.describe('Issue 70 - Action UI parameters', () => {
    test('Action type switching updates configuration message', async ({ page }) => {
        const actionPage = new ActionPage(page);

        // Arrange
        await actionPage.goto();

        // 1. Check that "No type selected" is the default
        await page.locator('.lucide.lucide-plus').click();
        
        const typeSelect = page.getByLabel('Field for Action Type *');
        // Check that the configuration message says "No type selected"
        await expect(page.getByText('No type selected', { exact: true })).toBeVisible();


        // 2. Choose the "AddGenerationMetadataFileAction" option
        await typeSelect.selectOption({ label: 'AddGenerationMetadataFileAction' });

        // 3. Check that it says "This action type can't be configured"
        await expect(page.getByText("This action type can't be configured")).toBeVisible();

        // 4. Change to "FileCopyAction".
        await typeSelect.selectOption({ label: 'FileCopyAction' });

        // 5. Check that fields now appear instead of the message.
        await expect(page.getByText("This action type can't be configured", { exact: true })).not.toBeVisible();
        // The subagent found 'FilePath' and 'NewFilePath' as labels.
        // We check for one of them to confirm fields are visible.
        // We use exact: true because FilePath is a substring of NewFilePath.
        await expect(page.getByText('FilePath', { exact: true })).toBeVisible();

        // 6. Change back to the "AddGenerationMetadataFileAction" option
        await typeSelect.selectOption({ label: 'AddGenerationMetadataFileAction' });

        // 7. Check that it says "This action type can't be configured"
        await expect(page.getByText("This action type can't be configured", { exact: true })).toBeVisible();
        await expect(page.getByText('FilePath', { exact: true })).not.toBeVisible();

    });
});


