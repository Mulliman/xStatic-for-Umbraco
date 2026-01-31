import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class SitePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async goto() {
        await super.goto();
    }

    async create(name: string, rootNodeName: string, exportFormatPartial: string, deploymentTarget?: string) {
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
        // Ensure config is loaded before proceeding
        await configResponsePromise;

        // Find specific control
        // Note: The property renders the editor. The editor *usually* contains uui-select.
        // We target generic 'uui-select' or 'uui-combobox' inside the property.
        const exportFormatDropdown = this.page.locator('umb-property[alias="exportFormat"]');
        
        // Check for native select first (likely what Umb.PropertyEditorUi.Dropdown uses in some contexts)
        const nativeSelect = exportFormatDropdown.locator('select').first();
        const uuiControl = exportFormatDropdown.locator('uui-select, uui-combobox').first();
        
        if (await nativeSelect.count() > 0) {
             console.log('DEBUG: Found native select');
             await nativeSelect.selectOption({ label: exportFormatPartial });
        } else {
            // UUI interaction
            await exportFormatDropdown.click(); // Click propery/control area
            
            if (await uuiControl.count() > 0) {
                await uuiControl.click({ force: true });
            }
            
            await this.page.waitForTimeout(500); 
            
            const option = this.page.getByRole('option', { name: exportFormatPartial }).first();
            await expect(option).toBeVisible(); 
            await option.click();
        }

        if (deploymentTarget) {
             const deployDropdown = this.page.locator('umb-property[alias="deploymentTarget"]');
             const nativeSelectDeploy = deployDropdown.locator('select').first();
             const uuiControlDeploy = deployDropdown.locator('uui-select, uui-combobox').first();

             if (await nativeSelectDeploy.count() > 0) {
                 await nativeSelectDeploy.selectOption({ label: deploymentTarget });
             } else {
                 await deployDropdown.click();
                 if (await uuiControlDeploy.count() > 0) {
                     await uuiControlDeploy.click({ force: true });
                 }
                 await this.page.waitForTimeout(500);
                 const option = this.page.getByRole('option', { name: deploymentTarget }).first();
                 await expect(option).toBeVisible();
                 await option.click();
             }
        }

        await this.page.getByRole('button', { name: 'Submit' }).click();
        
        // Debug: Check for validation errors
        const validationError = this.page.locator('xstatic-validation-error-wrapper[errorMessage]');
        if (await validationError.count() > 0) {
             const errorMsg = await validationError.first().getAttribute('errorMessage');
             console.log('DEBUG: Validation Error:', errorMsg);
             throw new Error(`Form validation failed: ${errorMsg}`);
        }
        
        // Ensure modal closes
        await expect(this.page.locator('xstatic-edit-site-modal')).not.toBeVisible();
    }

    async edit(oldName: string, newName: string) {
        const row = this.page.locator('xstatic-site-element').filter({ hasText: oldName }).first();
        await row.getByRole('button', { name: 'Edit' }).click();
        
        const nameField = this.page.getByRole('textbox', { name: 'Field for Site Name *' });
        await expect(nameField).toBeVisible();
        await nameField.fill(newName);
        await this.page.getByRole('button', { name: 'Submit' }).click();
    }

    async verifyExists(name: string, exportType?: string) {
        const siteElement = this.page.locator('xstatic-site-element').filter({ hasText: name }).first();
        await expect(siteElement).toBeVisible();
        if (exportType) {
            // Need to scope the table check to the row? 
            // xstatic-site-element CONTAINS the table.
            await expect(siteElement).toContainText(`Exports as ${exportType}`);
        }
    }

    async delete(name?: string) {
         const parent = name 
            ? this.page.locator('xstatic-site-element').filter({ hasText: name }).first() 
            : this.page;

         await parent.getByRole('button', { name: 'Delete' }).click();
         await this.page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();
    }

    async generate(name: string) {
        const row = this.page.locator('xstatic-site-element').filter({ hasText: name }).first();
        await row.getByRole('button', { name: 'Generate' }).click();
        // Wait for generation to complete? 
        // The UI shows a loader.
        // We might want to wait for success message.
    }

    async deploy(name: string) {
        const row = this.page.locator('xstatic-site-element').filter({ hasText: name }).first();
        await row.getByRole('button', { name: 'Deploy' }).click();
        await this.page.locator('#confirm').getByRole('button', { name: 'Deploy' }).click();
    }
}
