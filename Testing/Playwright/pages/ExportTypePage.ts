import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ExportTypePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async goto() {
        await super.goto('/dashboard/xstatic-export-types');
    }

    async create(name: string, transformer: string, generator: string, fileNameGenerator: string) {
        await this.page.getByRole('button', { name: 'Create new Export Type' }).click();
        await this.page.getByRole('textbox', { name: 'Field for Export Type Name *' }).fill(name);
        
        await this.page.getByLabel('Field for Transformer Factory').selectOption({ label: transformer });
        await this.page.getByLabel('Field for Generator *').selectOption({ label: generator });
        await this.page.getByLabel('Field for File Name Generator').selectOption({ label: fileNameGenerator });
        
        await this.page.getByRole('button', { name: 'Submit' }).click();
    }

    async edit(oldName: string, newName: string) {
        const itemBox = this.getItemBox(oldName);
        await itemBox.getByLabel('Edit').click();
        await this.page.getByRole('textbox', { name: 'Field for Export Type Name *' }).fill(newName);
        await this.page.getByRole('button', { name: 'Submit' }).click();
    }

    getItemBox(name: string) {
        return this.page.locator('uui-box').filter({ hasText: new RegExp(name) }).first();
    }

    async verifyExists(name: string, transformer: string, generator: string, fileNameGenerator: string) {
        const box = this.getItemBox(name);
        await expect(box).toBeVisible();
        if (transformer) await expect(box).toContainText(transformer.split(',')[0].trim());
        if (generator) await expect(box).toContainText(generator.split(',')[0].trim());
        if (fileNameGenerator) await expect(box).toContainText(fileNameGenerator.split(',')[0].trim());
    }

    async verifyNotExists(name: string) {
        await expect(this.page.getByText(name)).not.toBeVisible();
    }

    async delete(name: string) {
        const box = this.getItemBox(name);
        if (await box.isVisible()) {
            await box.locator('#header').click(); // Expand if needed or focus
            await box.getByLabel('Delete').click();
            await this.page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();
        }
    }
}
