import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it, vi } from 'vitest';
import { UmbracoTokenProvider } from '../src/auth.js';
import { PASSWORD_EDITOR_ALIAS, REDACTED_VALUE, XStaticClient } from '../src/client.js';
import { createXStaticMcpServer } from '../src/server.js';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function setupConnectedPair(fetchImpl: typeof fetch) {
  const tokenProvider = new UmbracoTokenProvider({
    baseUrl: 'https://umbraco.local',
    clientId: 'test-client',
    clientSecret: 'test-secret',
    fetchImpl,
  });

  const apiClient = new XStaticClient({
    baseUrl: 'https://umbraco.local',
    tokenProvider,
    fetchImpl,
  });

  const server = createXStaticMcpServer({ client: apiClient });
  const mcpClient = new Client({ name: 'test-client', version: '1.0.0' });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), mcpClient.connect(clientTransport)]);

  return { mcpClient, server };
}

describe('xstatic-mcp server', () => {
  it('exposes all core xStatic tools', async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const { mcpClient } = await setupConnectedPair(fetchMock);

    const { tools } = await mcpClient.listTools();
    const names = tools.map((t) => t.name).sort();

    expect(names).toEqual([
      'deploy_site',
      'generate_and_deploy_site',
      'generate_site',
      'get_site',
      'get_xstatic_config',
      'list_actions',
      'list_deployment_targets',
      'list_sites',
    ]);
  });

  it('handles list_sites, generate_site, deploy_site, and list_deployment_targets', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/security/back-office/token')) {
        return jsonResponse({ access_token: 'abc', expires_in: 3600 });
      }
      if (url.endsWith('/api/v1/xstatic/sites/get-all')) {
        return jsonResponse([
          { id: 1, name: 'Main Site', autoPublish: false, rootNode: '00000000-0000-0000-0000-000000000001', exportFormat: 1 },
        ]);
      }
      if (url.includes('/api/v1/xstatic/generate/generate-site?staticSiteId=1')) {
        return jsonResponse({
          siteId: 1,
          wasSuccessful: true,
          buildTime: 1234,
          results: [
            { wasSuccessful: true, type: 'Page', item: 'home', message: 'ok' },
            { wasSuccessful: true, type: 'Media', item: 'logo.png', message: 'ok' },
          ],
          warnings: [],
        });
      }
      if (url.includes('/api/v1/xstatic/deploy/deploy-site?staticSiteId=1')) {
        return jsonResponse({ wasSuccessful: true, message: 'Deployed to Netlify.' });
      }
      if (url.endsWith('/api/v1/xstatic/deployment-targets/get-deployment-targets')) {
        return jsonResponse([
          {
            id: 10,
            name: 'Netlify Prod',
            deployerDefinition: 'netlify',
            fields: [
              { alias: 'Netlify.PAT', name: 'PAT', editorUiAlias: PASSWORD_EDITOR_ALIAS, value: 'secret-token' },
            ],
          },
        ]);
      }
      return new Response('Not found', { status: 404 });
    });

    const { mcpClient } = await setupConnectedPair(fetchMock);

    const listRes = await mcpClient.callTool({ name: 'list_sites', arguments: {} });
    const listData = JSON.parse((listRes.content as Array<{ text: string }>)[0].text);
    expect(listData.count).toBe(1);
    expect(listData.sites[0].name).toBe('Main Site');

    const genRes = await mcpClient.callTool({ name: 'generate_site', arguments: { staticSiteId: 1 } });
    const genData = JSON.parse((genRes.content as Array<{ text: string }>)[0].text);
    expect(genData.wasSuccessful).toBe(true);
    expect(genData.totalItems).toBe(2);
    expect(genData.results).toBeUndefined();

    const deployRes = await mcpClient.callTool({ name: 'deploy_site', arguments: { staticSiteId: 1 } });
    const deployData = JSON.parse((deployRes.content as Array<{ text: string }>)[0].text);
    expect(deployData.wasSuccessful).toBe(true);

    const targetsRes = await mcpClient.callTool({ name: 'list_deployment_targets', arguments: {} });
    const targetsData = JSON.parse((targetsRes.content as Array<{ text: string }>)[0].text);
    expect(targetsData.deploymentTargets[0].fields[0].value).toBe(REDACTED_VALUE);
  });

  it('skips deploy in generate_and_deploy_site when build fails and deployOnWarnings is false', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/security/back-office/token')) {
        return jsonResponse({ access_token: 'abc', expires_in: 3600 });
      }
      if (url.includes('/api/v1/xstatic/generate/generate-site?staticSiteId=2')) {
        return jsonResponse({
          siteId: 2,
          wasSuccessful: false,
          buildTime: 500,
          results: [{ wasSuccessful: false, type: 'Asset', item: '/missing.css', message: 'Not found' }],
          warnings: [{ wasSuccessful: false, type: 'Asset', item: '/missing.css', message: 'Not found' }],
        });
      }
      return new Response('Unexpected call', { status: 500 });
    });

    const { mcpClient } = await setupConnectedPair(fetchMock);
    const res = await mcpClient.callTool({
      name: 'generate_and_deploy_site',
      arguments: { staticSiteId: 2 },
    });

    const data = JSON.parse((res.content as Array<{ text: string }>)[0].text);
    expect(data.deployed).toBe(false);
    expect(data.build.failedItems).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2); // token + generate only, no deploy
  });

  it('always skips deploy in generate_and_deploy_site on fatal build exception even when deployOnWarnings is true', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/security/back-office/token')) {
        return jsonResponse({ access_token: 'abc', expires_in: 3600 });
      }
      if (url.includes('/api/v1/xstatic/generate/generate-site?staticSiteId=3')) {
        return jsonResponse({
          siteId: 3,
          wasSuccessful: false,
          buildTime: 0,
          results: [],
          warnings: [],
          exception: 'Root node not found',
        });
      }
      return new Response('Unexpected call', { status: 500 });
    });

    const { mcpClient } = await setupConnectedPair(fetchMock);
    const res = await mcpClient.callTool({
      name: 'generate_and_deploy_site',
      arguments: { staticSiteId: 3, deployOnWarnings: true },
    });

    const data = JSON.parse((res.content as Array<{ text: string }>)[0].text);
    expect(data.deployed).toBe(false);
    expect(data.build.exception).toBe('Root node not found');
    expect(data.reason).toMatch(/fatal error/i);
    expect(fetchMock).toHaveBeenCalledTimes(2); // token + generate only, no deploy
  });
});
