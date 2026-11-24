using System.Text;

namespace XStatic.RemoteOperations
{
    public class TokenRetriever(string baseUri)
    {
        public string BaseUri { get; } = baseUri;

        public string TokenUri => $"{BaseUri}/umbraco/management/api/v1/security/back-office/token";

        private UmbracoAccessToken? _cachedToken { get; set; }

        public async Task<UmbracoAccessToken?> GetAccessToken(string clientId, string clientSecret)
        {
            if (_cachedToken != null && _cachedToken.Expiry > DateTime.Now)
            {
                return _cachedToken;
            }

            using var client = new HttpClient();

            // FormUrlEncodedContent escapes the values, so a secret containing '&', '=' or '+' is sent intact.
            using var content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["client_id"] = clientId,
                ["client_secret"] = clientSecret,
                ["grant_type"] = "client_credentials",
            });

            var response = await client.PostAsync(TokenUri, content);
            response.EnsureSuccessStatusCode();

            var responseBody = await response.Content.ReadAsStringAsync();
            var tokenResponse = System.Text.Json.JsonDocument.Parse(responseBody);

            if(tokenResponse?.RootElement == null)
            {
                throw new System.Exception("GetAccessToken - Token response null");
            }

            string? accessToken = tokenResponse.RootElement.GetProperty("access_token").GetString();
            int? expiryDuration = tokenResponse.RootElement.GetProperty("expires_in").GetInt32();

            var isValid = accessToken != null && expiryDuration > 0;

            if(!isValid)
            {
                // Don't put the token itself in the message: exception messages end up in logs.
                throw new System.Exception($"GetAccessToken - the token response was invalid (token {(accessToken == null ? "missing" : "present")}, expiry {expiryDuration}).");
            }

            // Remove a few seconds from the expiry to account for some latecy and avoid some failed requests.
            const int latencySeconds = 10;
            var expiryDateTime = DateTime.Now.AddSeconds(expiryDuration.Value).AddSeconds(-latencySeconds);

            return new UmbracoAccessToken(accessToken!, expiryDateTime);
        }
    }
}
