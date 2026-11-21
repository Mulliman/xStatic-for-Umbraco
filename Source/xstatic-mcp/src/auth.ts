export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type?: string;
}

export interface TokenProviderOptions {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  requestTimeoutMs?: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

const EXPIRY_BUFFER_MS = 10_000;
const DEFAULT_TOKEN_TIMEOUT_MS = 30_000;

/**
 * Retrieves and caches Umbraco BackOffice OAuth2 client-credentials bearer tokens
 * from `/umbraco/management/api/v1/security/back-office/token`.
 */
export class UmbracoTokenProvider {
  private readonly tokenUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly requestTimeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;

  private cachedToken: { value: string; expiresAtMs: number } | null = null;
  private inFlightRequest: Promise<string> | null = null;

  constructor(options: TokenProviderOptions) {
    this.tokenUrl = `${options.baseUrl.replace(/\/+$/, '')}/umbraco/management/api/v1/security/back-office/token`;
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.requestTimeoutMs = options.requestTimeoutMs ?? DEFAULT_TOKEN_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? (() => Date.now());
  }

  public clearCache(): void {
    this.cachedToken = null;
  }

  public async getAccessToken(forceRefresh = false): Promise<string> {
    if (!forceRefresh && this.cachedToken && this.cachedToken.expiresAtMs > this.now()) {
      return this.cachedToken.value;
    }

    if (!forceRefresh && this.inFlightRequest) {
      return this.inFlightRequest;
    }

    const requestPromise = this.fetchNewToken().finally(() => {
      if (this.inFlightRequest === requestPromise) {
        this.inFlightRequest = null;
      }
    });

    this.inFlightRequest = requestPromise;
    return requestPromise;
  }

  private async fetchNewToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      const response = await this.fetchImpl(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: body.toString(),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await safeReadText(response);
        throw new Error(
          `Failed to obtain Umbraco API User token (${response.status} ${response.statusText}) from ${this.tokenUrl}` +
            (errorText ? `: ${errorText}` : '')
        );
      }

      const payload = (await response.json()) as Partial<TokenResponse>;
      if (!payload.access_token || typeof payload.expires_in !== 'number' || payload.expires_in <= 0) {
        throw new Error('Umbraco token endpoint returned an invalid token response (missing access_token or expires_in).');
      }

      const ttlMs = Math.max(payload.expires_in * 1000 - EXPIRY_BUFFER_MS, 1000);
      this.cachedToken = {
        value: payload.access_token,
        expiresAtMs: this.now() + ttlMs,
      };

      return this.cachedToken.value;
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return (await response.text()).trim();
  } catch {
    return '';
  }
}
