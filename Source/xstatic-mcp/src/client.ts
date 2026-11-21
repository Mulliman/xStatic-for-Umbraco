import { UmbracoTokenProvider } from './auth.js';
import type {
  ActionModel,
  DeploymentTargetModel,
  RebuildProcessResult,
  SiteApiModel,
  XStaticConfig,
  XStaticSettings,
  XStaticWebResult,
} from './types.js';

export const PASSWORD_EDITOR_ALIAS = 'xstatic.propertyEditorUi.password';
export const REDACTED_VALUE = '***REDACTED***';

export class XStaticApiError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly path: string;
  public readonly responseBody: string;

  constructor(status: number, statusText: string, path: string, responseBody: string) {
    let hint = '';
    if (status === 401) {
      hint = ' Check UMBRACO_CLIENT_ID and UMBRACO_CLIENT_SECRET.';
    } else if (status === 403) {
      hint =
        ' Ensure the Umbraco API User is assigned to the xStaticNormalUser group ' +
        '(and xStaticAdmin for actions and deployment targets) when xStatic roles are enabled.';
    }

    super(
      `xStatic API request failed (${status} ${statusText}) for ${path}.${hint}` +
        (responseBody ? ` Response: ${responseBody}` : '')
    );
    this.name = 'XStaticApiError';
    this.status = status;
    this.statusText = statusText;
    this.path = path;
    this.responseBody = responseBody;
  }
}

export interface XStaticClientOptions {
  baseUrl: string;
  tokenProvider: UmbracoTokenProvider;
  requestTimeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class XStaticClient {
  private readonly baseUrl: string;
  private readonly tokenProvider: UmbracoTokenProvider;
  private readonly requestTimeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: XStaticClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.tokenProvider = options.tokenProvider;
    this.requestTimeoutMs = options.requestTimeoutMs ?? 300_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  public async listSites(): Promise<SiteApiModel[]> {
    return this.request<SiteApiModel[]>('GET', '/api/v1/xstatic/sites/get-all');
  }

  public async getSite(staticSiteId: number): Promise<SiteApiModel | null> {
    try {
      return await this.request<SiteApiModel>('GET', `/api/v1/xstatic/sites/${encodeURIComponent(staticSiteId)}`);
    } catch (error) {
      if (error instanceof XStaticApiError && (error.status === 404 || error.status === 405)) {
        // ASP.NET Core [ApiController] NotFound() returns RFC 7807 ProblemDetails JSON,
        // meaning the single-site route exists and the site ID genuinely does not exist.
        if (error.status === 404 && isProblemDetailsResponse(error.responseBody)) {
          return null;
        }

        // Fallback for older xStatic servers without the single-site route.
        const sites = await this.listSites();
        return sites.find((s) => s.id === staticSiteId) ?? null;
      }
      throw error;
    }
  }

  public async generateSite(staticSiteId: number): Promise<RebuildProcessResult> {
    return this.request<RebuildProcessResult>(
      'POST',
      `/api/v1/xstatic/generate/generate-site?staticSiteId=${encodeURIComponent(staticSiteId)}`
    );
  }

  public async deploySite(staticSiteId: number): Promise<XStaticWebResult> {
    return this.request<XStaticWebResult>(
      'POST',
      `/api/v1/xstatic/deploy/deploy-site?staticSiteId=${encodeURIComponent(staticSiteId)}`
    );
  }

  public async listActions(): Promise<ActionModel[]> {
    return this.request<ActionModel[]>('GET', '/api/v1/xstatic/actions/get-post-actions');
  }

  public async listDeploymentTargets(): Promise<DeploymentTargetModel[]> {
    return this.request<DeploymentTargetModel[]>('GET', '/api/v1/xstatic/deployment-targets/get-deployment-targets');
  }

  public async getConfig(): Promise<XStaticConfig> {
    return this.request<XStaticConfig>('GET', '/api/v1/xstatic/config/get-config');
  }

  public async getSettings(): Promise<XStaticSettings> {
    return this.request<XStaticSettings>('GET', '/api/v1/xstatic/config/get-settings');
  }

  private async request<T>(method: string, path: string, body?: unknown, isRetry = false): Promise<T> {
    const token = await this.tokenProvider.getAccessToken(isRetry);
    const url = `${this.baseUrl}${path}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };

      let serializedBody: string | undefined;
      if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        serializedBody = JSON.stringify(body);
      }

      const response = await this.fetchImpl(url, {
        method,
        headers,
        body: serializedBody,
        signal: controller.signal,
      });

      if (response.status === 401 && !isRetry) {
        this.tokenProvider.clearCache();
        return this.request<T>(method, path, body, true);
      }

      if (!response.ok) {
        const text = await safeReadText(response);
        throw new XStaticApiError(response.status, response.statusText, path, text);
      }

      const text = await safeReadText(response);
      if (!text) {
        return undefined as T;
      }

      return JSON.parse(text) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function isProblemDetailsResponse(body: string): boolean {
  if (!body) {
    return false;
  }

  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    return typeof parsed === 'object' && parsed !== null && parsed.status === 404 && typeof parsed.title === 'string';
  } catch {
    return false;
  }
}

function isSensitiveField(alias: string, editorUiAlias?: string | null): boolean {
  if (editorUiAlias?.toLowerCase() === PASSWORD_EDITOR_ALIAS.toLowerCase()) {
    return true;
  }

  return (
    /(password|secret|token|apikey|api_key|credential)/i.test(alias) ||
    /(^|[._-])(pat|key)($|[._-])/i.test(alias)
  );
}

function redactFieldValue(alias: string, editorUiAlias: string | null | undefined, value: string | null | undefined): string | null | undefined {
  if (!value) {
    return value;
  }

  if (isSensitiveField(alias, editorUiAlias)) {
    return REDACTED_VALUE;
  }

  // Strip embedded credentials from URL-shaped values (e.g. https://user:pat@github.com/org/repo.git)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) {
    try {
      const parsed = new URL(value);
      if (parsed.username || parsed.password) {
        parsed.username = REDACTED_VALUE;
        parsed.password = '';
        return parsed.toString();
      }
    } catch {
      // Not a valid URL; fall through
    }
  }

  return value;
}

/**
 * Redacts password/secret field values from deployment targets before returning them to an LLM.
 */
export function redactDeploymentTargets(targets: DeploymentTargetModel[]): DeploymentTargetModel[] {
  return targets.map((target) => ({
    ...target,
    fields: target.fields?.map((field) => ({
      ...field,
      value: redactFieldValue(field.alias, field.editorUiAlias, field.value),
    })),
  }));
}

/**
 * Redacts password/secret field values from post-generation actions before returning them to an LLM.
 */
export function redactActions(actions: ActionModel[]): ActionModel[] {
  return actions.map((action) => ({
    ...action,
    type: action.type
      ? {
          ...action.type,
          fields: action.type.fields?.map((field) => ({
            ...field,
            value: redactFieldValue(field.alias, field.editorUiAlias, field.value),
          })),
        }
      : action.type,
  }));
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return (await response.text()).trim();
  } catch {
    return '';
  }
}
