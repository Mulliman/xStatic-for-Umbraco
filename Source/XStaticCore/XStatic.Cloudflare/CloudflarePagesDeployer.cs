using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using XStatic.Core;
using XStatic.Core.Deploy;

namespace XStatic.Cloudflare
{
    public class CloudflarePagesDeployer : IDeployer
    {
        public const string DeployerKey = "cloudflare-pages";
        public const string DefaultApiBaseUrl = "https://api.cloudflare.com/client/v4";
        public const string DefaultMarkdownHeadersContent =
            "/*\n" +
            "  Vary: Accept\n\n" +
            "/*.md\n" +
            "  Content-Type: text/markdown; charset=utf-8\n" +
            "  X-Robots-Tag: index, follow\n";

        private const int MaxBatchFiles = 100;
        private const long MaxBatchBytes = 25 * 1024 * 1024; // 25 MiB safety cap per upload batch

        private readonly string _accountId;
        private readonly string _apiToken;
        private readonly string _projectName;
        private readonly string _branch;
        private readonly bool _enableMarkdownHeaders;
        private readonly HttpClient _httpClient;
        private readonly bool _ownsHttpClient;
        private readonly string _apiBaseUrl;

        public CloudflarePagesDeployer(Dictionary<string, string> parameters)
            : this(parameters, null, DefaultApiBaseUrl)
        {
        }

        public CloudflarePagesDeployer(Dictionary<string, string> parameters, HttpClient httpClient, string apiBaseUrl = DefaultApiBaseUrl)
        {
            if (parameters == null) throw new ArgumentNullException(nameof(parameters));

            parameters.TryGetValue(CloudflarePagesDeployerDefinition.FieldNames.AccountId, out _accountId);
            parameters.TryGetValue(CloudflarePagesDeployerDefinition.FieldNames.ApiToken, out _apiToken);
            parameters.TryGetValue(CloudflarePagesDeployerDefinition.FieldNames.ProjectName, out _projectName);
            parameters.TryGetValue(CloudflarePagesDeployerDefinition.FieldNames.Branch, out _branch);

            if (parameters.TryGetValue(CloudflarePagesDeployerDefinition.FieldNames.EnableMarkdownHeaders, out var mdHeadersVal))
            {
                _enableMarkdownHeaders = ParseToggle(mdHeadersVal);
            }

            _ownsHttpClient = httpClient == null;
            _httpClient = httpClient ?? new HttpClient();
            _apiBaseUrl = (apiBaseUrl ?? DefaultApiBaseUrl).TrimEnd('/');
        }

        public virtual async Task<XStaticResult> DeployWholeSite(string folderPath)
        {
            if (string.IsNullOrWhiteSpace(_accountId))
            {
                return XStaticResult.Error("Cloudflare Account ID is required.");
            }

            if (string.IsNullOrWhiteSpace(_apiToken))
            {
                return XStaticResult.Error("Cloudflare API Token is required.");
            }

            if (string.IsNullOrWhiteSpace(_projectName))
            {
                return XStaticResult.Error("Cloudflare Pages Project Name is required.");
            }

            if (string.IsNullOrWhiteSpace(folderPath) || !Directory.Exists(folderPath))
            {
                return XStaticResult.Error($"Generated site folder does not exist: '{folderPath}'.");
            }

            try
            {
                var files = CollectFiles(folderPath);

                // Extract _headers and _redirects if present, or synthesize _headers when EnableMarkdownHeaders is enabled.
                byte[] headersBytes = null;
                byte[] redirectsBytes = null;

                var assetFiles = new List<PreparedAsset>();
                foreach (var file in files)
                {
                    if (string.Equals(file.RelativePath, "/_headers", StringComparison.OrdinalIgnoreCase))
                    {
                        headersBytes = file.Content;
                        continue;
                    }

                    if (string.Equals(file.RelativePath, "/_redirects", StringComparison.OrdinalIgnoreCase))
                    {
                        redirectsBytes = file.Content;
                        continue;
                    }

                    assetFiles.Add(file);
                }

                if (headersBytes == null && _enableMarkdownHeaders)
                {
                    headersBytes = Encoding.UTF8.GetBytes(DefaultMarkdownHeadersContent);
                }

                var jwt = await GetUploadTokenAsync();

                var allHashes = assetFiles.Select(f => f.Hash).Distinct(StringComparer.Ordinal).ToList();
                var missingHashes = allHashes.Count > 0
                    ? await CheckMissingAssetsAsync(jwt, allHashes)
                    : new HashSet<string>(StringComparer.Ordinal);

                if (missingHashes.Count > 0)
                {
                    var assetsToUpload = assetFiles
                        .Where(f => missingHashes.Contains(f.Hash))
                        .GroupBy(f => f.Hash, StringComparer.Ordinal)
                        .Select(g => g.First())
                        .ToList();

                    await UploadAssetsInBatchesAsync(jwt, assetsToUpload);
                }

                if (allHashes.Count > 0)
                {
                    await UpsertHashesAsync(jwt, allHashes);
                }

                var manifest = assetFiles.ToDictionary(f => f.RelativePath, f => f.Hash, StringComparer.Ordinal);
                var deploymentUrl = await CreateDeploymentAsync(manifest, headersBytes, redirectsBytes);

                var message = string.IsNullOrWhiteSpace(deploymentUrl)
                    ? $"Site was successfully deployed to Cloudflare Pages project '{_projectName}'."
                    : $"Site was successfully deployed to Cloudflare Pages: {deploymentUrl}";

                return XStaticResult.Success(message);
            }
            catch (Exception ex)
            {
                return XStaticResult.Error($"Error deploying site to Cloudflare Pages project '{_projectName}'. The deployment was not completed.", ex);
            }
            finally
            {
                if (_ownsHttpClient)
                {
                    _httpClient.Dispose();
                }
            }
        }

        protected virtual List<PreparedAsset> CollectFiles(string folderPath)
        {
            var result = new List<PreparedAsset>();
            var fullRoot = Path.GetFullPath(folderPath);

            foreach (var filePath in Directory.EnumerateFiles(fullRoot, "*.*", SearchOption.AllDirectories))
            {
                if (!File.Exists(filePath))
                {
                    continue;
                }

                var relative = "/" + Path.GetRelativePath(fullRoot, filePath).Replace(Path.DirectorySeparatorChar, '/');
                var bytes = File.ReadAllBytes(filePath);
                var extension = Path.GetExtension(filePath).TrimStart('.').ToLowerInvariant();
                var hash = ComputeAssetHash(bytes, extension);
                var contentType = CloudflareMimeTypes.GetContentType(filePath);

                result.Add(new PreparedAsset(relative, hash, bytes, contentType));
            }

            return result;
        }

        public static string ComputeAssetHash(byte[] content, string extensionWithoutDot)
        {
            var base64 = Convert.ToBase64String(content ?? Array.Empty<byte>());
            var input = Encoding.UTF8.GetBytes(base64 + (extensionWithoutDot ?? string.Empty));
            var digest = SHA256.HashData(input);
            // Cloudflare Pages Direct Upload uses a 32-character lowercase hex key.
            return Convert.ToHexString(digest).ToLowerInvariant().Substring(0, 32);
        }

        private async Task<string> GetUploadTokenAsync()
        {
            var url = $"{_apiBaseUrl}/accounts/{Uri.EscapeDataString(_accountId)}/pages/projects/{Uri.EscapeDataString(_projectName)}/upload-token";
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiToken);

            using var response = await _httpClient.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();
            EnsureCloudflareSuccess(response, body, "fetching Cloudflare Pages upload token");

            var parsed = JsonSerializer.Deserialize<CloudflareApiResponse<UploadTokenResult>>(body);
            if (parsed?.Result?.Jwt == null)
            {
                throw new XStaticException("Cloudflare Pages upload-token response did not contain a JWT.");
            }

            return parsed.Result.Jwt;
        }

        private async Task<HashSet<string>> CheckMissingAssetsAsync(string jwt, List<string> hashes)
        {
            var url = $"{_apiBaseUrl}/pages/assets/check-missing";
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);
            request.Content = new StringContent(
                JsonSerializer.Serialize(new { hashes }),
                Encoding.UTF8,
                "application/json");

            using var response = await _httpClient.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();
            EnsureCloudflareSuccess(response, body, "checking missing Cloudflare Pages assets");

            var parsed = JsonSerializer.Deserialize<CloudflareApiResponse<List<string>>>(body);
            return new HashSet<string>(parsed?.Result ?? Enumerable.Empty<string>(), StringComparer.Ordinal);
        }

        private async Task UploadAssetsInBatchesAsync(string jwt, List<PreparedAsset> assets)
        {
            var batch = new List<AssetUploadPayload>();
            long currentBytes = 0;

            foreach (var asset in assets)
            {
                var base64Value = Convert.ToBase64String(asset.Content);
                var payloadItem = new AssetUploadPayload
                {
                    Key = asset.Hash,
                    Value = base64Value,
                    Metadata = new AssetUploadMetadata { ContentType = asset.ContentType },
                    Base64 = true
                };

                if (batch.Count > 0 && (batch.Count >= MaxBatchFiles || currentBytes + base64Value.Length > MaxBatchBytes))
                {
                    await UploadBatchAsync(jwt, batch);
                    batch.Clear();
                    currentBytes = 0;
                }

                batch.Add(payloadItem);
                currentBytes += base64Value.Length;
            }

            if (batch.Count > 0)
            {
                await UploadBatchAsync(jwt, batch);
            }
        }

        private async Task UploadBatchAsync(string jwt, List<AssetUploadPayload> batch)
        {
            var url = $"{_apiBaseUrl}/pages/assets/upload";
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);
            request.Content = new StringContent(
                JsonSerializer.Serialize(batch),
                Encoding.UTF8,
                "application/json");

            using var response = await _httpClient.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();
            EnsureCloudflareSuccess(response, body, "uploading assets to Cloudflare Pages");
        }

        private async Task UpsertHashesAsync(string jwt, List<string> hashes)
        {
            var url = $"{_apiBaseUrl}/pages/assets/upsert-hashes";
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);
            request.Content = new StringContent(
                JsonSerializer.Serialize(new { hashes }),
                Encoding.UTF8,
                "application/json");

            using var response = await _httpClient.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();
            EnsureCloudflareSuccess(response, body, "upserting Cloudflare Pages asset hashes");
        }

        private async Task<string> CreateDeploymentAsync(Dictionary<string, string> manifest, byte[] headersBytes, byte[] redirectsBytes)
        {
            var url = $"{_apiBaseUrl}/accounts/{Uri.EscapeDataString(_accountId)}/pages/projects/{Uri.EscapeDataString(_projectName)}/deployments";
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiToken);

            using var form = new MultipartFormDataContent();
            var manifestJson = JsonSerializer.Serialize(manifest);
            form.Add(new StringContent(manifestJson, Encoding.UTF8, "application/json"), "manifest");

            if (!string.IsNullOrWhiteSpace(_branch))
            {
                form.Add(new StringContent(_branch.Trim(), Encoding.UTF8), "branch");
            }

            if (headersBytes != null)
            {
                var headersContent = new ByteArrayContent(headersBytes);
                headersContent.Headers.ContentType = new MediaTypeHeaderValue("text/plain");
                form.Add(headersContent, "_headers", "_headers");
            }

            if (redirectsBytes != null)
            {
                var redirectsContent = new ByteArrayContent(redirectsBytes);
                redirectsContent.Headers.ContentType = new MediaTypeHeaderValue("text/plain");
                form.Add(redirectsContent, "_redirects", "_redirects");
            }

            request.Content = form;

            using var response = await _httpClient.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();
            EnsureCloudflareSuccess(response, body, "creating Cloudflare Pages deployment");

            var parsed = JsonSerializer.Deserialize<CloudflareApiResponse<DeploymentResult>>(body);
            return parsed?.Result?.Url;
        }

        private static void EnsureCloudflareSuccess(HttpResponseMessage response, string body, string operation)
        {
            if (!response.IsSuccessStatusCode)
            {
                throw new XStaticException($"Cloudflare API error while {operation} (HTTP {(int)response.StatusCode}): {body}");
            }

            if (!string.IsNullOrWhiteSpace(body))
            {
                using var doc = JsonDocument.Parse(body);
                if (doc.RootElement.TryGetProperty("success", out var successProp) &&
                    successProp.ValueKind == JsonValueKind.False)
                {
                    throw new XStaticException($"Cloudflare API reported failure while {operation}: {body}");
                }
            }
        }

        private static bool ParseToggle(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return false;
            return value.Equals("true", StringComparison.OrdinalIgnoreCase) || value == "1";
        }

        protected sealed record PreparedAsset(string RelativePath, string Hash, byte[] Content, string ContentType);

        private sealed class CloudflareApiResponse<T>
        {
            [JsonPropertyName("success")]
            public bool Success { get; set; }

            [JsonPropertyName("result")]
            public T Result { get; set; }
        }

        private sealed class UploadTokenResult
        {
            [JsonPropertyName("jwt")]
            public string Jwt { get; set; }
        }

        private sealed class DeploymentResult
        {
            [JsonPropertyName("id")]
            public string Id { get; set; }

            [JsonPropertyName("url")]
            public string Url { get; set; }
        }

        private sealed class AssetUploadPayload
        {
            [JsonPropertyName("key")]
            public string Key { get; set; }

            [JsonPropertyName("value")]
            public string Value { get; set; }

            [JsonPropertyName("metadata")]
            public AssetUploadMetadata Metadata { get; set; }

            [JsonPropertyName("base64")]
            public bool Base64 { get; set; }
        }

        private sealed class AssetUploadMetadata
        {
            [JsonPropertyName("contentType")]
            public string ContentType { get; set; }
        }
    }
}
