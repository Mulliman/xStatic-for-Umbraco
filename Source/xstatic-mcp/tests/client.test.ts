import { describe, expect, it, vi } from 'vitest';
import { UmbracoTokenProvider } from '../src/auth.js';
import {
  PASSWORD_EDITOR_ALIAS,
  REDACTED_VALUE,
  redactActions,
  redactDeploymentTargets,
  XStaticApiError,
  XStaticClient,
} from '../src/client.js';
import { loadConfig } from '../src/config.js';

function jsonResponse(body: unknown, status = 200, statusText = 'OK'): Response {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('loadConfig', () => {
  it('loads valid environment variables and strips trailing slash', () => {
    const config = loadConfig({
      UMBRACO_BASE_URL: 'https://localhost:44391/',
      UMBRACO_CLIENT_ID: 'umbraco-back-office-xstatic',
      UMBRACO_CLIENT_SECRET: 'super-secret',
      XSTATIC_REQUEST_TIMEOUT_MS: '60000',
      XSTATIC_ALLOW_INSECURE_TLS: 'true',
    });

    expect(config).toEqual({
      baseUrl: 'https://localhost:44391',
      clientId: 'umbraco-back-office-xstatic',
      clientSecret: 'super-secret',
      requestTimeoutMs: 60000,
      allowInsecureTls: true,
    });
  });

  it('throws when required variables are missing', () => {
    expect(() => loadConfig({})).toThrow(/UMBRACO_BASE_URL.*UMBRACO_CLIENT_ID.*UMBRACO_CLIENT_SECRET/);
  });
});

describe('UmbracoTokenProvider', () => {
  it('caches tokens until expiry buffer and refreshes afterwards', async () => {
    let currentTime = 1_000_000;
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'token-1', expires_in: 60 }))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'token-2', expires_in: 60 }));

    const provider = new UmbracoTokenProvider({
      baseUrl: 'https://umbraco.example.com',
      clientId: 'cid',
      clientSecret: 'csecret',
      fetchImpl: fetchMock,
      now: () => currentTime,
    });

    expect(await provider.getAccessToken()).toBe('token-1');
    expect(await provider.getAccessToken()).toBe('token-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Advance past 60s - 10s buffer
    currentTime += 51_000;
    expect(await provider.getAccessToken()).toBe('token-2');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('deduplicates concurrent token requests and passes an abort signal', async () => {
    let seenSignal: AbortSignal | null | undefined;
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => {
      seenSignal = init?.signal;
      return jsonResponse({ access_token: 'shared-token', expires_in: 60 });
    });

    const provider = new UmbracoTokenProvider({
      baseUrl: 'https://umbraco.example.com',
      clientId: 'cid',
      clientSecret: 'csecret',
      requestTimeoutMs: 5000,
      fetchImpl: fetchMock,
    });

    const [t1, t2] = await Promise.all([provider.getAccessToken(), provider.getAccessToken()]);
    expect(t1).toBe('shared-token');
    expect(t2).toBe('shared-token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(seenSignal).toBeInstanceOf(AbortSignal);
  });
});

describe('XStaticClient', () => {
  it('retries once on 401 by refreshing the token', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'stale-token', expires_in: 300 }))
      .mockResolvedValueOnce(new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'fresh-token', expires_in: 300 }))
      .mockResolvedValueOnce(jsonResponse([{ id: 1, name: 'Marketing' }]));

    const tokenProvider = new UmbracoTokenProvider({
      baseUrl: 'https://umbraco.example.com',
      clientId: 'cid',
      clientSecret: 'csecret',
      fetchImpl: fetchMock,
    });

    const client = new XStaticClient({
      baseUrl: 'https://umbraco.example.com',
      tokenProvider,
      fetchImpl: fetchMock,
    });

    const sites = await client.listSites();
    expect(sites).toHaveLength(1);
    expect(sites[0].name).toBe('Marketing');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('falls back to listSites when single-site route returns empty 404', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'tok', expires_in: 300 }))
      .mockResolvedValueOnce(new Response('', { status: 404, statusText: 'Not Found' }))
      .mockResolvedValueOnce(jsonResponse([{ id: 7, name: 'Docs Site' }]));

    const tokenProvider = new UmbracoTokenProvider({
      baseUrl: 'https://umbraco.example.com',
      clientId: 'cid',
      clientSecret: 'csecret',
      fetchImpl: fetchMock,
    });

    const client = new XStaticClient({
      baseUrl: 'https://umbraco.example.com',
      tokenProvider,
      fetchImpl: fetchMock,
    });

    const site = await client.getSite(7);
    expect(site?.name).toBe('Docs Site');
  });

  it('returns null without fallback when single-site route returns ProblemDetails 404', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'tok', expires_in: 300 }))
      .mockResolvedValueOnce(
        jsonResponse({ type: 'https://tools.ietf.org/html/rfc9110#section-15.5.5', title: 'Not Found', status: 404 }, 404, 'Not Found')
      );

    const tokenProvider = new UmbracoTokenProvider({
      baseUrl: 'https://umbraco.example.com',
      clientId: 'cid',
      clientSecret: 'csecret',
      fetchImpl: fetchMock,
    });

    const client = new XStaticClient({
      baseUrl: 'https://umbraco.example.com',
      tokenProvider,
      fetchImpl: fetchMock,
    });

    const site = await client.getSite(999);
    expect(site).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('includes actionable role guidance on 403 Forbidden', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ access_token: 'tok', expires_in: 300 }))
      .mockResolvedValueOnce(new Response('', { status: 403, statusText: 'Forbidden' }));

    const tokenProvider = new UmbracoTokenProvider({
      baseUrl: 'https://umbraco.example.com',
      clientId: 'cid',
      clientSecret: 'csecret',
      fetchImpl: fetchMock,
    });

    const client = new XStaticClient({
      baseUrl: 'https://umbraco.example.com',
      tokenProvider,
      fetchImpl: fetchMock,
    });

    const rejection = client.listActions();
    await expect(rejection).rejects.toThrow(XStaticApiError);
    await expect(rejection).rejects.toThrow(/xStaticAdmin/);
  });
});

describe('secret redaction', () => {
  it('redacts password fields in deployment targets and actions', () => {
    const targets = redactDeploymentTargets([
      {
        id: 1,
        name: 'Prod Netlify',
        deployerDefinition: 'netlify',
        fields: [
          { alias: 'Netlify.PAT', name: 'PAT', editorUiAlias: PASSWORD_EDITOR_ALIAS, value: 'nfp_secret123' },
          { alias: 'Netlify.SiteId', name: 'Site ID', editorUiAlias: 'Umb.PropertyEditorUi.TextBox', value: 'site-abc' },
          {
            alias: 'Git.RemoteUrl',
            name: 'Remote URL',
            editorUiAlias: 'Umb.PropertyEditorUi.TextBox',
            value: 'https://user:ghp_supersecret@github.com/org/repo.git',
          },
        ],
      },
    ]);

    expect(targets[0].fields?.[0].value).toBe(REDACTED_VALUE);
    expect(targets[0].fields?.[1].value).toBe('site-abc');
    expect(targets[0].fields?.[2].value).not.toContain('ghp_supersecret');
    expect(targets[0].fields?.[2].value).toContain('github.com/org/repo.git');

    const actions = redactActions([
      {
        id: 2,
        name: 'Webhook',
        type: {
          id: 'webhook',
          name: 'WebhookAction',
          fields: [
            { alias: 'ApiToken', editorUiAlias: 'Umb.PropertyEditorUi.TextBox', value: 'tok_live_999' },
            { alias: 'FilePath', editorUiAlias: 'Umb.PropertyEditorUi.TextBox', value: '/404.html' },
          ],
        },
      },
    ]);

    expect(actions[0].type?.fields?.[0].value).toBe(REDACTED_VALUE);
    expect(actions[0].type?.fields?.[1].value).toBe('/404.html');
  });
});
