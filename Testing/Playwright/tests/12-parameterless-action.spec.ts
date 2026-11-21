import { test, expect } from '@playwright/test';
import { ActionPage } from '../pages/ActionPage';

/**
 * An action type with no configurable fields (AddGenerationMetadataFileAction) can be created, shows that it can't be
 * configured when edited, and can be deleted. Covers issue #70 for the parameterless case. Self-contained.
 */
test.describe('Parameterless action type', () => {
    const runId = process.env.TEST_RUN_ID || 'local';
    const actionName = `Metadata Action ${runId}`;

    test('Create, reopen and delete an action with no parameters', async ({ page }) => {
        const actions = new ActionPage(page);
        await actions.goto();

        await actions.create(actionName, 'AddGenerationMetadataFileAction', {});
        await actions.verifyExists(actionName, 'AddGenerationMetadataFileAction');

        await actions.getItemBox(actionName).getByRole('button', { name: 'Edit' }).click();
        await expect(page.getByText("This action type can't be configured", { exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Cancel' }).click();

        await actions.delete(actionName);
        await expect(actions.getItemBox(actionName)).not.toBeVisible();
    });
});
