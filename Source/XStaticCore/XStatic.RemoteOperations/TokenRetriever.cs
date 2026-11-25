using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace XStatic.RemoteOperations
{
    public class TokenRetriever
    {
        // Seconds taken off the expiry to allow for latency, so a token isn't used just as it runs out.
        private const int LatencySeconds = 10;

        // Shared so each call doesn't open a new connection pool (and exhaust sockets under load).
        private static readonly HttpClient SharedHttpClient = new();

        private readonly HttpClient _httpClient;
        private readonly ConcurrentDictionary<string, UmbracoAccessToken> _cachedTokens = new(StringComparer.Ordinal);

        public TokenRetriever(string baseUri)
            : this(baseUri, SharedHttpClient)
        {
        }

        /// <summary>
        /// Creates a retriever that sends its requests through <paramref name="httpClient"/>, for example one from
        /// <c>IHttpClientFactory</c>. The caller owns the client; it isn't disposed here.
        /// </summary>
        public TokenRetriever(string baseUri, HttpClient httpClient)
        {
            BaseUri = baseUri;
            _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        }

        public string BaseUri { get; }

        public string TokenUri => $"{BaseUri}/umbraco/management/api/v1/security/back-office/token";

        public async Task<UmbracoAccessToken?> GetAccessToken(string clientId, string clientSecret)
        {
            var cacheKey = CreateCacheKey(clientId, clientSecret);

            if (_cachedTokens.TryGetValue(cacheKey, out var cached) && cached.Expiry.ToUniversalTime() > DateTime.UtcNow)
            {
                return cached;
            }

            // FormUrlEncodedContent escapes the values, so a secret containing '&', '=' or '+' is sent intact.
            using var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["client_id"] = clientId ?? string.Empty,
                ["client_secret"] = clientSecret ?? string.Empty,
                ["grant_type"] = "client_credentials",
            });

            using var response = await _httpClient.PostAsync(TokenUri, content);
            response.EnsureSuccessStatusCode();

            var responseBody = await response.Content.ReadAsStringAsync();
            var token = ParseToken(responseBody);

            _cachedTokens[cacheKey] = token;

            return token;
        }

        private static string CreateCacheKey(string? clientId, string? clientSecret)
        {
            // Hash the secret into the cache key so a subsequent call with a different or wrong secret
            // never reuses a cached token, and raw secrets are not held in cache keys.
            var secretHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(clientSecret ?? string.Empty)));
            return $"{clientId ?? string.Empty}\0{secretHash}";
        }

        private static UmbracoAccessToken ParseToken(string responseBody)
        {
            JsonDocument tokenResponse;

            try
            {
                tokenResponse = JsonDocument.Parse(responseBody);
            }
            catch (JsonException e)
            {
                // Don't include the body: if it's partly valid it could hold the token.
                throw new InvalidOperationException("GetAccessToken - the token response wasn't valid JSON.", e);
            }

            using (tokenResponse)
            {
                var root = tokenResponse.RootElement;

                string? accessToken = null;
                int expiryDuration = 0;

                if (root.ValueKind == JsonValueKind.Object)
                {
                    if (root.TryGetProperty("access_token", out var tokenElement) && tokenElement.ValueKind == JsonValueKind.String)
                    {
                        accessToken = tokenElement.GetString();
                    }

                    if (root.TryGetProperty("expires_in", out var expiryElement) && expiryElement.ValueKind == JsonValueKind.Number)
                    {
                        expiryElement.TryGetInt32(out expiryDuration);
                    }
                }

                if (string.IsNullOrEmpty(accessToken) || expiryDuration <= 0)
                {
                    // Don't put the token itself in the message: exception messages end up in logs.
                    throw new InvalidOperationException($"GetAccessToken - the token response was invalid (token {(string.IsNullOrEmpty(accessToken) ? "missing" : "present")}, expiry {expiryDuration}).");
                }

                var expiryUtc = DateTime.UtcNow.AddSeconds(expiryDuration - LatencySeconds);

                return new UmbracoAccessToken(accessToken, expiryUtc);
            }
        }
    }
}
