import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SitePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async goto() {
        await super.goto();
    }

    async create(name: string, rootNodeName: string, exportFormatPartial: string) {
        // Wait for config to be loaded upon opening the modal
        const configResponsePromise = this.page.waitForResponse(response => 
            response.url().includes('xstatic/config/get-config') && response.status() === 200
        );

        await this.page.getByRole('button', { name: 'Create new static site' }).click();
        
        // Ensure config is loaded before proceeding
        await configResponsePromise;
        
        // Wait explicitly for the form to appear
        const nameField = this.page.getByRole('textbox', { name: 'Field for Site Name *' });
        await expect(nameField).toBeVisible();
        await nameField.fill(name);

        // Use Robust Scoping for Root Node
        const rootNodeProperty = this.page.locator('umb-property').filter({ hasText: 'Root Node *' });
        await expect(rootNodeProperty).toBeVisible();
        
        // Click the 'Choose' button inside the property 
        const chooseButton = rootNodeProperty.getByRole('button', { name: 'Choose' });
        await chooseButton.click({ force: true });
        
        // Handle Tree Picker Modal
        await this.page.locator('umb-tree-picker-modal').getByText(rootNodeName).click();
        await this.page.locator('umb-tree-picker-modal').getByRole('button', { name: 'Choose' }).click();

        // Use User-Suggested Locator via ARIA Label
        // This targets the specific element (likely in shadow root) with this label
        const exportFormatDropdown = this.page.getByLabel('Field for Export Format *');
        await expect(exportFormatDropdown).toBeVisible();
 
        // Ensure interactions are robust
        await exportFormatDropdown.focus();
        await configResponsePromise; // Wait for data
        
        // Attempt interaction (Keyboard is most robust for UUI)
        // Space to open, Down to select, Enter to confirm
        await this.page.keyboard.press('Space');
        await this.page.waitForTimeout(200);
        await this.page.keyboard.press('ArrowDown');
        await this.page.keyboard.press('Enter');
        
        // Note: If this fails, it is due to the Application Bug where config is not bound to the component.


        await this.page.getByRole('button', { name: 'Submit' }).click();
    }

    async edit(oldName: string, newName: string) {
        await this.page.getByRole('button', { name: 'Edit' }).click();
        const nameField = this.page.getByRole('textbox', { name: 'Field for Site Name *' });
        await expect(nameField).toBeVisible();
        await nameField.fill(newName);
        await this.page.getByRole('button', { name: 'Submit' }).click();
    }

    async verifyExists(name: string, exportType?: string) {
        const siteElement = this.page.locator('xstatic-site-element');
        await expect(siteElement).toContainText(name);
        if (exportType) {
            await expect(this.page.getByRole('table')).toContainText(`Exports as ${exportType}`);
        }
    }

    async delete() {
         await this.page.getByRole('button', { name: 'Delete' }).click();
         await this.page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();
    }
}
