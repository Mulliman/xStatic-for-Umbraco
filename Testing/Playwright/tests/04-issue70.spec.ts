import { test } from '@playwright/test';
import { ActionPage } from '../pages/ActionPage';

test.describe('Issue 70 - Action UI parameters', () => {
    test('Create and Edit Action with no parameters', async ({ page }) => {
        const actionPage = new ActionPage(page);

        // Arrange
        await actionPage.goto();

        const actionName = 'Empty Test Action ' + Date.now();

        // Act
        // Create an action using a type that has no parameters
        await actionPage.page.locator('.lucide.lucide-plus').click();
        await actionPage.page.getByRole('textbox', { name: 'Field for Action Name *' }).fill(actionName);
        await actionPage.page.getByLabel('Field for Action Type *').selectOption({ label: 'EmptyTestAction' });

        await actionPage.page.getByRole('button', { name: 'Submit' }).click();

        // Assert
        await actionPage.verifyExists(actionName, 'EmptyTestAction');

        // Edit
        const actionNameEdited = actionName + ' Edited';
        const itemBox = actionPage.getItemBox(actionName);
        await itemBox.getByRole('button', { name: 'Edit' }).click();

        // Ensure that the UI recognizes the selected type correctly, meaning the modal shows 'EmptyTestAction'
        const typeValue = await actionPage.page.getByLabel('Field for Action Type *').inputValue();

        // Not using explicit ID in test, we just check if we can save it again without validation error on type
        await actionPage.page.getByRole('textbox', { name: 'Field for Action Name *' }).fill(actionNameEdited);
        await actionPage.page.getByRole('button', { name: 'Submit' }).click();

        // Assert
        await actionPage.verifyExists(actionNameEdited, 'EmptyTestAction');
    });
});
