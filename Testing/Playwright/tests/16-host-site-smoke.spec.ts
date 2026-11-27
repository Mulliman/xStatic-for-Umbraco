import { test, expect } from '@playwright/test';

/**
 * Smoke tests verifying that installing xStatic does not break the host Umbraco site
 * (Clean Starter Kit): front-end rendering, SurfaceController form posts (issue #146),
 * the xStatic OpenAPI/Swagger document, and standard Umbraco content publishing.
 */
test.describe('Host site smoke checks', () => {
    test('Front-end pages render and unknown routes return 404 (not 500)', async ({ request }) => {
        for (const path of ['/', '/about/', '/contact/']) {
            const response = await request.get(path);
            expect(response.status(), `GET ${path}`).toBe(200);
            const html = await response.text();
            expect(html.length, `GET ${path} body should not be empty`).toBeGreaterThan(100);
        }

        const notFound = await request.get('/this-page-does-not-exist-xstatic-smoke');
        expect(notFound.status(), 'unknown front-end route should return 404').toBe(404);
    });

    test('Submitting the Clean Starter Kit contact form (SurfaceController) does not throw duplicate endpoint name (#146)', async ({ page }) => {
        const contactResponse = await page.goto('/contact/');
        expect(contactResponse?.status(), 'GET /contact/').toBe(200);

        const form = page.locator('form').first();
        await expect(form).toBeVisible();

        // Bypass HTML5 client-side required checks so the browser sends a real POST to the
        // Umbraco SurfaceController (which routes through UmbracoVirtualPageRoute ->
        // LinkParser.ParsePathByEndpointName) without depending on SMTP configuration.
        await form.evaluate((el: HTMLFormElement) => {
            el.noValidate = true;
        });

        const submitButton = form.locator('button[type="submit"], input[type="submit"]').first();
        await expect(submitButton).toBeVisible();

        const [postResponse] = await Promise.all([
            page.waitForResponse(r => r.request().method() === 'POST' && r.url().includes('/contact')),
            submitButton.click(),
        ]);

        const body = await postResponse.text().catch(() => '');
        expect(body, 'POST /contact/ should not fail with duplicate endpoint name').not.toContain('duplicate endpoint name');
        expect(postResponse.status(), `POST /contact/ returned ${postResponse.status()}`).toBeLessThan(500);
    });

    test('xStatic OpenAPI document generates cleanly with expected operation IDs', async ({ request }) => {
        const response = await request.get('/umbraco/openapi/xstatic-v1.json');
        expect(response.status(), 'GET xstatic-v1 openapi json').toBe(200);

        const doc = await response.json();
        expect(doc?.info?.title).toContain('xStatic');

        const operationIds = new Set<string>();
        for (const pathItem of Object.values<Record<string, { operationId?: string }>>(doc.paths ?? {})) {
            for (const op of Object.values(pathItem)) {
                if (op?.operationId) {
                    operationIds.add(op.operationId);
                }
            }
        }

        const found = Array.from(operationIds);
        for (const expectedId of [
            'Actions_GetPostActions',
            'Sites_GetAll',
            'Sites_GetById',
            'Generate_GenerateSite',
            'Deploy_DeploySite',
            'Config_GetSettings',
        ]) {
            expect(
                operationIds.has(expectedId),
                `OpenAPI doc should include operationId '${expectedId}' (found: ${found.slice(0, 10).join(', ')})`,
            ).toBe(true);
        }
    });

    test('Standard Umbraco content save and publish still succeeds', async ({ page }) => {
        await page.goto('/umbraco/section/content');

        // Open the Clean Starter Kit root Home node in the content tree.
        const homeNode = page.locator('umb-tree-item').filter({ hasText: 'Home' }).first();
        await expect(homeNode).toBeVisible({ timeout: 30_000 });
        await homeNode.click();

        const publishButton = page.getByRole('button', { name: 'Save and publish' }).first();
        await expect(publishButton).toBeVisible({ timeout: 20_000 });

        const [apiResponse] = await Promise.all([
            page.waitForResponse(
                r => r.request().method() === 'PUT' && r.url().includes('/umbraco/management/api/v1/document/'),
                { timeout: 20_000 },
            ),
            publishButton.click(),
        ]);

        expect(apiResponse.status(), `Umbraco document API status (${apiResponse.url()})`).toBeLessThan(300);
    });
});
