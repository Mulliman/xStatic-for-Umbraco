import { Page, expect } from '@playwright/test';

export class BasePage {
    readonly page: Page;
    readonly baseUrl = '/umbraco/section/xstatic';

    constructor(page: Page) {
        this.page = page;
    }

    async goto(path: string = '') {
        await this.page.goto(`${this.baseUrl}${path}`);
    }

    async clickButton(name: string) {
        await this.page.getByRole('button', { name: name, exact: true }).click();
    }

    async clickButtonByRole(role: 'button' | 'link', name: string) {
        await this.page.getByRole(role, { name: name, exact: true }).click();
    }
}
