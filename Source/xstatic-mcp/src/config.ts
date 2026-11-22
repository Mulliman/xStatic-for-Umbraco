export interface XStaticMcpConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  requestTimeoutMs: number;
  allowInsecureTls: boolean;
}

const DEFAULT_TIMEOUT_MS = 300_000;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): XStaticMcpConfig {
  const rawBaseUrl = env.UMBRACO_BASE_URL?.trim();
  const clientId = env.UMBRACO_CLIENT_ID?.trim();
  const clientSecret = env.UMBRACO_CLIENT_SECRET?.trim();

  const missing: string[] = [];
  if (!rawBaseUrl) missing.push('UMBRACO_BASE_URL');
  if (!clientId) missing.push('UMBRACO_CLIENT_ID');
  if (!clientSecret) missing.push('UMBRACO_CLIENT_SECRET');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Configure UMBRACO_BASE_URL, UMBRACO_CLIENT_ID, and UMBRACO_CLIENT_SECRET for an Umbraco API User.'
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawBaseUrl!);
  } catch {
    throw new Error(`UMBRACO_BASE_URL is not a valid URL: "${rawBaseUrl}"`);
  }

  const baseUrl = parsedUrl.toString().replace(/\/+$/, '');

  const timeoutRaw = env.XSTATIC_REQUEST_TIMEOUT_MS?.trim();
  let requestTimeoutMs = DEFAULT_TIMEOUT_MS;
  if (timeoutRaw) {
    const parsedTimeout = Number.parseInt(timeoutRaw, 10);
    if (!Number.isFinite(parsedTimeout) || parsedTimeout <= 0) {
      throw new Error(`XSTATIC_REQUEST_TIMEOUT_MS must be a positive integer, received "${timeoutRaw}".`);
    }
    requestTimeoutMs = parsedTimeout;
  }

  const allowInsecureTls = env.XSTATIC_ALLOW_INSECURE_TLS?.trim().toLowerCase() === 'true';

  return {
    baseUrl,
    clientId: clientId!,
    clientSecret: clientSecret!,
    requestTimeoutMs,
    allowInsecureTls,
  };
}
