import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DeploymentTargetPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async goto() {
        await super.goto('/dashboard/xstatic-deployment-targets');
    }

    async create(name: string, deployer: string, config: { [key: string]: string }) {
        await this.page.getByRole('button', { name: 'Manually Configure New' }).click();
        
        // Wait for form to appear
        const nameField = this.page.getByRole('textbox', { name: 'Field for Name *' });
        await expect(nameField).toBeVisible();
        await nameField.fill(name);

        // Select by value or label
        await this.page.getByLabel('Field for Deployer *').selectOption(deployer);

        for (const [key, value] of Object.entries(config)) {
            await this.page.getByRole('textbox', { name: `Field for ${key}` }).fill(value);
        }

        await this.page.getByRole('button', { name: 'Submit' }).click();
    }

    async edit(oldName: string, newName: string) {
        const itemBox = this.getItemBox(oldName);
        await itemBox.getByLabel('Edit').click();
        await this.page.getByRole('textbox', { name: 'Field for Name *' }).fill(newName);
        await this.page.getByRole('button', { name: 'Submit' }).click();
    }

    getItemBox(name: string) {
        return this.page.locator('uui-box').filter({ hasText: new RegExp(name) }).first();
    }

    async verifyExists(name: string, deployer: string) {
        const box = this.getItemBox(name);
        await expect(box).toBeVisible();
        await expect(box).toContainText(deployer);
    }

    async verifyNotExists(name: string) {
        await expect(this.page.getByText(name)).not.toBeVisible();
    }

    async delete(name: string) {
        const box = this.getItemBox(name);
        if (await box.isVisible()) {
            await box.locator('#header').click(); 
            await box.getByLabel('Delete').click();
            await this.page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();
        }
    }
}
