import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ActionPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async goto() {
        await super.goto('/dashboard/xstatic-actions');
    }

    async create(name: string, type: string, config: { [key: string]: string }) {
        await this.page.locator('.lucide.lucide-plus').click();
        await this.page.getByRole('textbox', { name: 'Field for Action Name *' }).fill(name);
        await this.page.getByLabel('Field for Action Type *').selectOption({ label: type });

        for (const [key, value] of Object.entries(config)) {
            await this.page.getByRole('textbox', { name: `Field for ${key}` }).fill(value);
        }

        await this.page.getByRole('button', { name: 'Submit' }).click();
    }

    async edit(oldName: string, newName: string) {
        const itemBox = this.getItemBox(oldName);
        await itemBox.getByRole('button', { name: 'Edit' }).click();
        await this.page.getByRole('textbox', { name: 'Field for Action Name *' }).fill(newName);
        await this.page.getByRole('button', { name: 'Submit' }).click();
    }

    getItemBox(name: string) {
        // xstatic-action-element uses shadow DOM or similar, assuming standard locator works as in old test
        return this.page.locator('xstatic-action-element').filter({ hasText: new RegExp(name) }).first();
    }

    async verifyExists(name: string, type: string) {
        const box = this.getItemBox(name);
        await expect(box).toBeVisible();
        await expect(box).toContainText(type.split(',')[0].trim());
    }

    async verifyNotExists(name: string) {
        await expect(this.page.getByText(name)).not.toBeVisible();
    }

    async delete(name: string) {
        const box = this.getItemBox(name);
        if (await box.isVisible()) {
            await box.getByRole('button', { name: 'Delete' }).click();
            await this.page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();
        }
    }
}
