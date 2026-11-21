import { test, expect, request } from '@playwright/test';

/**
 * Every xStatic Management API endpoint must reject requests that aren't signed in. Uses a fresh request context with
 * no cookies or tokens. IDs are ones that won't exist, so a regression can't delete real data. This would have caught the endpoints being left open, and checks the auth policies still
 * apply after Umbraco changes how the backoffice authenticates (as Umbraco 19 did).
 */
const endpoints: Array<[method: 'GET' | 'POST' | 'DELETE', path: string]> = [
    ['GET', 'sites/get-all'],
    ['POST', 'sites/create'],
    ['POST', 'sites/update'],
    ['DELETE', 'sites/delete?staticSiteId=2147483647'],
    ['DELETE', 'sites/clear-stored-site?staticSiteId=2147483647'],
    ['GET', 'sites/get-site-dependencies'],
    ['POST', 'generate/generate-site?staticSiteId=2147483647'],
    ['POST', 'deploy/deploy-site?staticSiteId=2147483647'],
    ['GET', 'download/download-site?staticSiteId=2147483647'],
    ['GET', 'config/get-settings'],
    ['GET', 'config/get-config'],
    ['POST', 'config/create-export-type'],
    ['POST', 'config/update-export-type'],
    ['DELETE', 'config/delete-export-type?id=2147483647'],
    ['GET', 'actions/get-post-actions'],
    ['POST', 'actions/create-post-action'],
    ['POST', 'actions/update-post-action'],
    ['DELETE', 'actions/delete-post-action?id=2147483647'],
    ['GET', 'deployment-targets/get-deployment-targets'],
    ['POST', 'deployment-targets/create-deployment-target'],
    ['POST', 'deployment-targets/update-deployment-target'],
    ['POST', 'deployment-targets/auto-create-deployment-target'],
    ['DELETE', 'deployment-targets/delete-deployment-target?id=2147483647'],
];

test.describe('API security', () => {
    test('Every xStatic endpoint rejects anonymous requests with 401', async () => {
        // The test runner applies the project's storageState (the signed-in cookie) to request.newContext() too, so
        // pass an empty one explicitly. Without this the test passes on bearer-token backoffices and fails on cookie
        // ones for the wrong reason.
        const anonymous = await request.newContext({
            baseURL: 'https://localhost:5000',
            ignoreHTTPSErrors: true,
            storageState: { cookies: [], origins: [] },
        });
        try {
            expect((await anonymous.storageState()).cookies, 'the anonymous context has no cookies').toEqual([]);

            const results: string[] = [];
            for (const [method, path] of endpoints) {
                const response = await anonymous.fetch(`/api/v1/xstatic/${path}`, {
                    method,
                    data: method === 'POST' ? {} : undefined,
                    maxRedirects: 0,
                });
                results.push(`${method} ${path} -> ${response.status()}`);
            }

            const notRejected = results.filter(r => !r.endsWith('-> 401'));
            expect(notRejected, 'endpoints that did not return 401').toEqual([]);
        } finally {
            await anonymous.dispose();
        }
    });

    test('The signed-in backoffice user can call the API', async ({ page }) => {
        // The dashboard loading its sites is proof the UI's authenticated calls succeed.
        const sitesResponse = page.waitForResponse(r => r.url().includes('/api/v1/xstatic/sites/get-all'));
        await page.goto('/umbraco/section/xstatic');
        expect((await sitesResponse).status()).toBe(200);
    });
});
