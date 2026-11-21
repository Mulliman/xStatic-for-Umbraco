using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
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
        public const long MaxSingleFileSizeBytes = 25 * 1024 * 1024; // Cloudflare Pages 25 MiB per-file limit
        public const string DefaultMarkdownHeadersContent =
            "/*\n" +
            "  Vary: Accept\n\n" +
            "/*.md\n" +
            "  Content-Type: text/markdown; charset=utf-8\n" +
            "  X-Robots-Tag: index, follow\n";

        private const int MaxBatchFiles = 100;
        private const long MaxBatchBase64Bytes = 25 * 1024 * 1024; // 25 MiB safety cap per upload batch
        private const int MaxTransientRetries = 3;

        private static readonly HashSet<string> ExcludedSpecialPaths = new(StringComparer.OrdinalIgnoreCase)
        {
            "/_routes.json",
            "/_worker.js"
        };

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
            _httpClient = httpClient ?? new HttpClient { Timeout = TimeSpan.FromMinutes(5) };
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

                string headersFilePath = null;
                string redirectsFilePath = null;

                var assetFiles = new List<PreparedAsset>();
                foreach (var file in files)
                {
                    if (string.Equals(file.RelativePath, "/_headers", StringComparison.OrdinalIgnoreCase))
                    {
                        headersFilePath = file.FullPath;
                        continue;
                    }

                    if (string.Equals(file.RelativePath, "/_redirects", StringComparison.OrdinalIgnoreCase))
                    {
                        redirectsFilePath = file.FullPath;
                        continue;
                    }

                    if (ExcludedSpecialPaths.Contains(file.RelativePath) ||
                        file.RelativePath.StartsWith("/functions/", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    if (file.FileSizeBytes > MaxSingleFileSizeBytes)
                    {
                        return XStaticResult.Error(
                            $"File '{file.RelativePath}' ({file.FileSizeBytes} bytes) exceeds Cloudflare Pages' 25 MiB single-file limit.");
                    }

                    assetFiles.Add(file);
                }

                byte[] headersBytes = headersFilePath != null
                    ? await File.ReadAllBytesAsync(headersFilePath)
                    : (_enableMarkdownHeaders ? Encoding.UTF8.GetBytes(DefaultMarkdownHeadersContent) : null);

                byte[] redirectsBytes = redirectsFilePath != null
                    ? await File.ReadAllBytesAsync(redirectsFilePath)
                    : null;

                var jwt = await GetUploadTokenAsync();

                var allHashes = assetFiles.Select(f => f.Hash).Distinct(StringComparer.Ordinal).ToList();
                var missingHashes = allHashes.Count > 0
                    ? await CheckMissingAssetsAsync(jwt, allHashes, newJwt => jwt = newJwt)
                    : new HashSet<string>(StringComparer.Ordinal);

                if (missingHashes.Count > 0)
                {
                    var assetsToUpload = assetFiles
                        .Where(f => missingHashes.Contains(f.Hash))
                        .GroupBy(f => f.Hash, StringComparer.Ordinal)
                        .Select(g => g.First())
                        .ToList();

                    jwt = await UploadAssetsInBatchesAsync(jwt, assetsToUpload);
                }

                if (allHashes.Count > 0)
                {
                    await UpsertHashesAsync(jwt, allHashes, newJwt => jwt = newJwt);
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

                var info = new FileInfo(filePath);
                var relative = "/" + Path.GetRelativePath(fullRoot, filePath).Replace(Path.DirectorySeparatorChar, '/');
                var extension = Path.GetExtension(filePath).TrimStart('.').ToLowerInvariant();
                var contentType = CloudflareMimeTypes.GetContentType(filePath);

                // Avoid hashing oversized files that will immediately fail the 25 MiB check.
                var hash = info.Length <= MaxSingleFileSizeBytes
                    ? ComputeAssetHash(File.ReadAllBytes(filePath), extension)
                    : string.Empty;

                result.Add(new PreparedAsset(filePath, relative, hash, contentType, info.Length));
            }

            return result;
        }

        /// <summary>
        /// Computes a deterministic 32-character lowercase hex asset key using SHA-256 over
        /// <c>base64(content) + extensionWithoutDot</c>.
        /// Note: Cloudflare's Wrangler CLI uses BLAKE3 for the same input; Pages Direct Upload accepts
        /// opaque 32-char hex keys consistently across check-missing, upload, upsert-hashes, and manifest,
        /// though assets uploaded here will not deduplicate against assets previously uploaded by Wrangler.
        /// </summary>
        public static string ComputeAssetHash(byte[] content, string extensionWithoutDot)
        {
            var base64 = Convert.ToBase64String(content ?? Array.Empty<byte>());
            var input = Encoding.UTF8.GetBytes(base64 + (extensionWithoutDot ?? string.Empty));
            var digest = SHA256.HashData(input);
            return Convert.ToHexString(digest).ToLowerInvariant().Substring(0, 32);
        }

        private async Task<string> GetUploadTokenAsync()
        {
            var url = $"{_apiBaseUrl}/accounts/{Uri.EscapeDataString(_accountId)}/pages/projects/{Uri.EscapeDataString(_projectName)}/upload-token";
            var body = await SendWithRetriesAsync(
                () =>
                {
                    var req = new HttpRequestMessage(HttpMethod.Get, url);
                    req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiToken);
                    return req;
                },
                "fetching Cloudflare Pages upload token");

            var parsed = JsonSerializer.Deserialize<CloudflareApiResponse<UploadTokenResult>>(body);
            if (parsed?.Result?.Jwt == null)
            {
                throw new XStaticException("Cloudflare Pages upload-token response did not contain a JWT.");
            }

            return parsed.Result.Jwt;
        }

        private async Task<HashSet<string>> CheckMissingAssetsAsync(string jwt, List<string> hashes, Action<string> onJwtRefreshed)
        {
            var url = $"{_apiBaseUrl}/pages/assets/check-missing";
            var payload = JsonSerializer.Serialize(new { hashes });

            var (body, currentJwt) = await SendWithJwtRefreshAsync(
                jwt,
                token =>
                {
                    var req = new HttpRequestMessage(HttpMethod.Post, url);
                    req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                    req.Content = new StringContent(payload, Encoding.UTF8, "application/json");
                    return req;
                },
                "checking missing Cloudflare Pages assets");

            onJwtRefreshed?.Invoke(currentJwt);
            var parsed = JsonSerializer.Deserialize<CloudflareApiResponse<List<string>>>(body);
            return new HashSet<string>(parsed?.Result ?? Enumerable.Empty<string>(), StringComparer.Ordinal);
        }

        private async Task<string> UploadAssetsInBatchesAsync(string jwt, List<PreparedAsset> assets)
        {
            var batch = new List<AssetUploadPayload>();
            long currentBytes = 0;

            foreach (var asset in assets)
            {
                // Read file bytes lazily per batch so the entire site is never held in memory at once.
                var bytes = await File.ReadAllBytesAsync(asset.FullPath);
                var base64Value = Convert.ToBase64String(bytes);
                var payloadItem = new AssetUploadPayload
                {
                    Key = asset.Hash,
                    Value = base64Value,
                    Metadata = new AssetUploadMetadata { ContentType = asset.ContentType },
                    Base64 = true
                };

                if (batch.Count > 0 && (batch.Count >= MaxBatchFiles || currentBytes + base64Value.Length > MaxBatchBase64Bytes))
                {
                    jwt = await UploadBatchAsync(jwt, batch);
                    batch.Clear();
                    currentBytes = 0;
                }

                batch.Add(payloadItem);
                currentBytes += base64Value.Length;
            }

            if (batch.Count > 0)
            {
                jwt = await UploadBatchAsync(jwt, batch);
            }

            return jwt;
        }

        private async Task<string> UploadBatchAsync(string jwt, List<AssetUploadPayload> batch)
        {
            var url = $"{_apiBaseUrl}/pages/assets/upload";
            var payload = JsonSerializer.Serialize(batch);

            var (_, currentJwt) = await SendWithJwtRefreshAsync(
                jwt,
                token =>
                {
                    var req = new HttpRequestMessage(HttpMethod.Post, url);
                    req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                    req.Content = new StringContent(payload, Encoding.UTF8, "application/json");
                    return req;
                },
                "uploading assets to Cloudflare Pages");

            return currentJwt;
        }

        private async Task UpsertHashesAsync(string jwt, List<string> hashes, Action<string> onJwtRefreshed)
        {
            var url = $"{_apiBaseUrl}/pages/assets/upsert-hashes";
            var payload = JsonSerializer.Serialize(new { hashes });

            var (_, currentJwt) = await SendWithJwtRefreshAsync(
                jwt,
                token =>
                {
                    var req = new HttpRequestMessage(HttpMethod.Post, url);
                    req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                    req.Content = new StringContent(payload, Encoding.UTF8, "application/json");
                    return req;
                },
                "upserting Cloudflare Pages asset hashes");

            onJwtRefreshed?.Invoke(currentJwt);
        }

        private async Task<string> CreateDeploymentAsync(Dictionary<string, string> manifest, byte[] headersBytes, byte[] redirectsBytes)
        {
            var url = $"{_apiBaseUrl}/accounts/{Uri.EscapeDataString(_accountId)}/pages/projects/{Uri.EscapeDataString(_projectName)}/deployments";
            var manifestJson = JsonSerializer.Serialize(manifest);

            var body = await SendWithRetriesAsync(
                () =>
                {
                    var req = new HttpRequestMessage(HttpMethod.Post, url);
                    req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiToken);

                    var form = new MultipartFormDataContent();
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

                    req.Content = form;
                    return req;
                },
                "creating Cloudflare Pages deployment");

            var parsed = JsonSerializer.Deserialize<CloudflareApiResponse<DeploymentResult>>(body);
            return parsed?.Result?.Url;
        }

        private async Task<(string Body, string CurrentJwt)> SendWithJwtRefreshAsync(
            string jwt,
            Func<string, HttpRequestMessage> requestFactory,
            string operation)
        {
            var currentJwt = jwt;

            for (var authAttempt = 0; authAttempt < 2; authAttempt++)
            {
                var (statusCode, body) = await SendRawWithTransientRetriesAsync(() => requestFactory(currentJwt));

                if (statusCode == HttpStatusCode.Unauthorized && authAttempt == 0)
                {
                    currentJwt = await GetUploadTokenAsync();
                    continue;
                }

                EnsureCloudflareSuccess(statusCode, body, operation);
                return (body, currentJwt);
            }

            throw new XStaticException($"Cloudflare upload JWT expired and refresh failed while {operation}.");
        }

        private async Task<string> SendWithRetriesAsync(Func<HttpRequestMessage> requestFactory, string operation)
        {
            var (statusCode, body) = await SendRawWithTransientRetriesAsync(requestFactory);
            EnsureCloudflareSuccess(statusCode, body, operation);
            return body;
        }

        private async Task<(HttpStatusCode StatusCode, string Body)> SendRawWithTransientRetriesAsync(Func<HttpRequestMessage> requestFactory)
        {
            for (var attempt = 0; attempt < MaxTransientRetries; attempt++)
            {
                using var request = requestFactory();
                using var response = await _httpClient.SendAsync(request);
                var body = await response.Content.ReadAsStringAsync();

                var code = (int)response.StatusCode;
                if ((code == 429 || code >= 500) && attempt < MaxTransientRetries - 1)
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(200 * (attempt + 1)));
                    continue;
                }

                return (response.StatusCode, body);
            }

            throw new XStaticException("Cloudflare API request exceeded maximum retry attempts.");
        }

        private static void EnsureCloudflareSuccess(HttpStatusCode statusCode, string body, string operation)
        {
            if ((int)statusCode < 200 || (int)statusCode >= 300)
            {
                throw new XStaticException($"Cloudflare API error while {operation} (HTTP {(int)statusCode}): {body}");
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

        protected sealed record PreparedAsset(string FullPath, string RelativePath, string Hash, string ContentType, long FileSizeBytes);

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
