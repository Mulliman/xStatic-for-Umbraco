import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface SiteOptions {
    imageCrops?: string[];
    postActions?: string[];
    /** Name of a media folder to pick as the media root. */
    mediaRoot?: string;
    targetHostname?: string;
}

export interface GenerateItemResult {
    wasSuccessful: boolean;
    type: string;
    item: string;
    message?: string;
}

export interface GenerateResponse {
    wasSuccessful: boolean;
    exception?: string;
    results: GenerateItemResult[];
}

export class SitePage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async goto() {
        await super.goto();
    }

    async create(name: string, rootNodeName: string, exportFormatPartial: string, deploymentTarget?: string, assetPaths: string[] = [], options: SiteOptions = {}) {
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
        
        // Handle the document picker modal. Later Umbraco 17 minors replaced umb-tree-picker-modal
        // with umb-document-picker-modal (which adds Browse/Search tabs), so match either.
        const pickerModal = this.page.locator('umb-document-picker-modal, umb-tree-picker-modal').first();
        await expect(pickerModal).toBeVisible();
        await pickerModal.getByRole('button', { name: rootNodeName, exact: true }).click();

        const chooseInPicker = pickerModal.getByRole('button', { name: 'Choose', exact: true });
        await expect(chooseInPicker).toBeEnabled();
        await chooseInPicker.click();
        await expect(pickerModal).not.toBeVisible();

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

        for (const assetPath of assetPaths) {
            await this.addAssetPath(assetPath);
        }

        for (const crop of options.imageCrops ?? []) {
            await this.addTag('imageCrops', crop);
        }

        for (const actionName of options.postActions ?? []) {
            await this.checkPostAction(actionName);
        }

        if (options.mediaRoot) {
            await this.chooseMediaRoot(options.mediaRoot);
        }

        if (options.targetHostname) {
            const hostProp = this.page.locator('umb-property[alias="targetHostname"]');
            await expect(hostProp).toBeVisible();
            await hostProp.locator('input').first().fill(options.targetHostname);
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

    /** Adds a value to the "Asset Paths" tags editor in the open site modal. */
    async addAssetPath(assetPath: string) {
        await this.addTag('assetPaths', assetPath);
    }

    /** Adds a value to a tags editor (asset paths, image crops) in the open site modal. */
    async addTag(alias: string, value: string) {
        const property = this.page.locator(`umb-property[alias="${alias}"]`);
        await expect(property).toBeVisible();

        // Umb.PropertyEditorUi.Tags renders <umb-tags-input> with <input aria-label="tag input">.
        // No click(): the input is 16px wide until focused and its "+" icon intercepts pointer
        // events. fill() focuses it directly.
        const input = property.getByRole('textbox', { name: 'tag input' });
        await input.fill(value);
        await input.press('Enter');

        await expect(property.locator('uui-tag').filter({ hasText: value })).toBeVisible();
    }

    /** Ticks a post-generation action in the open site modal. */
    async checkPostAction(actionName: string) {
        const property = this.page.locator('umb-property[alias="postGenerationActionIds"]');
        await expect(property).toBeVisible();
        // uui-checkbox hides its native input, so click the component itself.
        const checkbox = property.locator('uui-checkbox').filter({ hasText: actionName }).first();
        await checkbox.click();
        await expect(checkbox).toHaveAttribute('checked', '');
    }

    /** Picks a media folder as a media root. */
    async chooseMediaRoot(folderName: string) {
        const property = this.page.locator('umb-property[alias="mediaRootNodes"]');
        await expect(property).toBeVisible();
        await property.getByRole('button', { name: 'Choose' }).click({ force: true });

        const pickerModal = this.page.locator('umb-media-picker-modal').first();
        await expect(pickerModal).toBeVisible();
        // Clicking a folder card opens the folder. Selecting it uses the card's select checkbox (in its shadow
        // DOM), which appears on hover.
        const card = pickerModal.locator('uui-card-media').filter({ hasText: folderName }).first();
        await card.hover();
        await card.locator('#select-checkbox').click();
        await expect(card).toHaveAttribute('selected', '');

        const chooseInPicker = pickerModal.getByRole('button', { name: 'Choose', exact: true });
        await expect(chooseInPicker).toBeEnabled();
        await chooseInPicker.click();
        await expect(pickerModal).not.toBeVisible();
    }

    row(name: string) {
        return this.page.locator('xstatic-site-element').filter({ hasText: name }).first();
    }

    /** Clicks Generate and returns the parsed generate-site response. */
    async generateAndWait(name: string): Promise<GenerateResponse> {
        const responsePromise = this.page.waitForResponse(r => r.url().includes('xstatic/generate/generate-site'), { timeout: 120000 });
        await this.generate(name);
        const response = await responsePromise;
        expect(response.status()).toBe(200);
        return await response.json();
    }

    /** Clicks Deploy, confirms, and returns the deploy-site response. */
    async deployAndWait(name: string) {
        const responsePromise = this.page.waitForResponse(r => r.url().includes('xstatic/deploy/deploy-site'), { timeout: 120000 });
        await this.deploy(name);
        return await responsePromise;
    }

    /** Clicks Clean and confirms. Resolves when the clear-stored-site call returns. */
    async clean(name: string) {
        const responsePromise = this.page.waitForResponse(r => r.url().includes('xstatic/sites/clear-stored-site'));
        await this.row(name).getByRole('button', { name: 'Clean' }).click();
        await this.page.getByRole('button', { name: 'Clean up' }).click();
        const response = await responsePromise;
        expect(response.status()).toBe(200);
    }

    /** Downloads the site's zip and returns its entries as forward-slash paths mapped to their text. */
    async downloadEntries(name: string, saveDir: string): Promise<Map<string, Buffer>> {
        const downloadPromise = this.page.waitForEvent('download');
        await this.row(name).getByRole('button', { name: 'Download' }).click();
        const download = await downloadPromise;
        const zipPath = `${saveDir}/${Date.now()}-${download.suggestedFilename()}`;
        await download.saveAs(zipPath);

        const AdmZip = (await import('adm-zip')).default;
        const zip = new AdmZip(zipPath);
        const entries = new Map<string, Buffer>();
        for (const entry of zip.getEntries()) {
            if (!entry.isDirectory) {
                entries.set(entry.entryName.replace(/\\/g, '/').replace(/^\/+/, ''), entry.getData());
            }
        }
        return entries;
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

    async verifyNotExists(name: string) {
        const siteElement = this.page.locator('xstatic-site-element').filter({ hasText: name }).first();
        await expect(siteElement).not.toBeVisible();
    }

    async delete(name?: string) {
         if (name) {
             const row = this.page.locator('xstatic-site-element').filter({ hasText: name }).first();
             
             if (await row.isVisible()) {
                 const responsePromise = this.page.waitForResponse(response => 
                    response.url().includes('xstatic') && response.status() === 200
                 );

                 await row.getByRole('button', { name: 'Delete' }).click();
                 await this.page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();
                 
                 await responsePromise;
                 
                 // Initial check
                 await expect(row).not.toBeVisible();

                 // Robust check: Reload to ensure it wasn't just a UI optimistic update
                 await this.page.reload();
                 await expect(row).not.toBeVisible();
             }
         } else {
             // Fallback for global delete button if no name specified
             await this.page.getByRole('button', { name: 'Delete' }).click();
             await this.page.locator('#confirm').getByRole('button', { name: 'Delete' }).click();
         }
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
