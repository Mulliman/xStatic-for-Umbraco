using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using XStatic.Core;
using XStatic.Core.Deploy;

namespace XStatic.Cloudflare
{
    /// <summary>
    /// Deploys the generated site as an assets-only Cloudflare Worker using the Workers static assets
    /// Direct Upload API: an upload session with the full manifest, base64 bucket uploads for the files
    /// Cloudflare doesn't already have, then a script upload whose metadata carries the completion token,
    /// the routing options and the raw <c>_headers</c> and <c>_redirects</c> files.
    /// </summary>
    public class CloudflareWorkersDeployer : IDeployer
    {
        public const string DeployerKey = "cloudflare-workers";
        public const long MaxSingleFileSizeBytes = 25 * 1024 * 1024; // Workers static assets 25 MiB per-file limit

        public static readonly IReadOnlyCollection<string> HtmlHandlingValues = new[]
        {
            "auto-trailing-slash", "force-trailing-slash", "drop-trailing-slash", "none"
        };

        public static readonly IReadOnlyCollection<string> NotFoundHandlingValues = new[]
        {
            "404-page", "single-page-application", "none"
        };

        private const int MaxTransientRetries = 3;

        // Cloudflare parses these from the asset directory rather than serving them. _worker.js and
        // _routes.json are Pages-only files that would otherwise be served publicly as plain assets.
        private static readonly HashSet<string> ExcludedPaths = new(StringComparer.OrdinalIgnoreCase)
        {
            "/_headers",
            "/_redirects",
            "/.assetsignore",
            "/_worker.js",
            "/_routes.json"
        };

        private static readonly JsonSerializerOptions MetadataJsonOptions = new()
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        private readonly string _accountId;
        private readonly string _apiToken;
        private readonly string _workerName;
        private readonly string _compatibilityDate;
        private readonly string _htmlHandling;
        private readonly string _notFoundHandling;
        private readonly bool _enableWorkersDev;
        private readonly bool _enableMarkdownHeaders;
        private readonly HttpClient _httpClient;
        private readonly bool _ownsHttpClient;
        private readonly string _apiBaseUrl;

        public CloudflareWorkersDeployer(Dictionary<string, string> parameters)
            : this(parameters, null, CloudflarePagesDeployer.DefaultApiBaseUrl)
        {
        }

        public CloudflareWorkersDeployer(Dictionary<string, string> parameters, HttpClient httpClient, string apiBaseUrl = CloudflarePagesDeployer.DefaultApiBaseUrl)
        {
            if (parameters == null) throw new ArgumentNullException(nameof(parameters));

            _accountId = Get(parameters, CloudflareWorkersDeployerDefinition.FieldNames.AccountId);
            _apiToken = Get(parameters, CloudflareWorkersDeployerDefinition.FieldNames.ApiToken);
            _workerName = Get(parameters, CloudflareWorkersDeployerDefinition.FieldNames.WorkerName);
            _compatibilityDate = Get(parameters, CloudflareWorkersDeployerDefinition.FieldNames.CompatibilityDate);
            _htmlHandling = Get(parameters, CloudflareWorkersDeployerDefinition.FieldNames.HtmlHandling)?.ToLowerInvariant();
            _notFoundHandling = Get(parameters, CloudflareWorkersDeployerDefinition.FieldNames.NotFoundHandling)?.ToLowerInvariant();

            // workers.dev is on unless the field was explicitly switched off, matching Wrangler's default.
            var workersDevRaw = Get(parameters, CloudflareWorkersDeployerDefinition.FieldNames.EnableWorkersDev);
            _enableWorkersDev = workersDevRaw == null || ParseToggle(workersDevRaw);
            _enableMarkdownHeaders = ParseToggle(Get(parameters, CloudflareWorkersDeployerDefinition.FieldNames.EnableMarkdownHeaders));

            _ownsHttpClient = httpClient == null;
            _httpClient = httpClient ?? new HttpClient { Timeout = TimeSpan.FromMinutes(5) };
            _apiBaseUrl = (apiBaseUrl ?? CloudflarePagesDeployer.DefaultApiBaseUrl).TrimEnd('/');
        }

        public virtual async Task<XStaticResult> DeployWholeSite(string folderPath)
        {
            var validationError = Validate(folderPath);
            if (validationError != null)
            {
                return XStaticResult.Error(validationError);
            }

            try
            {
                string headers = null;
                string redirects = null;
                var assets = new List<PreparedAsset>();

                foreach (var file in CollectFiles(folderPath))
                {
                    if (string.Equals(file.RelativePath, "/_headers", StringComparison.OrdinalIgnoreCase))
                    {
                        headers = await File.ReadAllTextAsync(file.FullPath);
                        continue;
                    }

                    if (string.Equals(file.RelativePath, "/_redirects", StringComparison.OrdinalIgnoreCase))
                    {
                        redirects = await File.ReadAllTextAsync(file.FullPath);
                        continue;
                    }

                    if (ExcludedPaths.Contains(file.RelativePath))
                    {
                        continue;
                    }

                    if (file.FileSizeBytes > MaxSingleFileSizeBytes)
                    {
                        return XStaticResult.Error(
                            $"File '{file.RelativePath}' ({file.FileSizeBytes} bytes) exceeds Cloudflare Workers' 25 MiB static asset file limit.");
                    }

                    assets.Add(file);
                }

                if (assets.Count == 0)
                {
                    return XStaticResult.Error($"There are no files to deploy in '{folderPath}'.");
                }

                if (headers == null && _enableMarkdownHeaders)
                {
                    headers = CloudflarePagesDeployer.DefaultMarkdownHeadersContent;
                }

                var completionJwt = await UploadAssetsAsync(assets);
                await UploadWorkerAsync(completionJwt, headers, redirects);

                if (!_enableWorkersDev)
                {
                    return XStaticResult.Success($"Site was successfully deployed to the Cloudflare Worker '{_workerName}'.");
                }

                string workersDevUrl;
                try
                {
                    workersDevUrl = await EnableWorkersDevAsync();
                }
                catch (Exception ex)
                {
                    return XStaticResult.Success(
                        $"Site was deployed to the Cloudflare Worker '{_workerName}', but its workers.dev URL could not be turned on: {ex.Message} " +
                        "Check that the account has a workers.dev subdomain, or add a custom domain to the Worker in the Cloudflare dashboard.");
                }

                return string.IsNullOrWhiteSpace(workersDevUrl)
                    ? XStaticResult.Success($"Site was successfully deployed to the Cloudflare Worker '{_workerName}'.")
                    : XStaticResult.Success($"Site was successfully deployed to Cloudflare Workers: {workersDevUrl}");
            }
            catch (Exception ex)
            {
                return XStaticResult.Error($"Error deploying site to the Cloudflare Worker '{_workerName}'. The deployment was not completed.", ex);
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

            foreach (var filePath in Directory.EnumerateFiles(fullRoot, "*", SearchOption.AllDirectories))
            {
                var info = new FileInfo(filePath);
                var relative = "/" + Path.GetRelativePath(fullRoot, filePath).Replace(Path.DirectorySeparatorChar, '/');
                var extension = Path.GetExtension(filePath).TrimStart('.').ToLowerInvariant();

                // Don't hash oversized files that will fail the 25 MiB check anyway.
                var hash = info.Length <= MaxSingleFileSizeBytes
                    ? CloudflarePagesDeployer.ComputeAssetHash(File.ReadAllBytes(filePath), extension)
                    : string.Empty;

                result.Add(new PreparedAsset(filePath, relative, hash, CloudflareMimeTypes.GetContentType(filePath), info.Length));
            }

            return result;
        }

        private string Validate(string folderPath)
        {
            if (string.IsNullOrWhiteSpace(_accountId)) return "Cloudflare Account ID is required.";
            if (string.IsNullOrWhiteSpace(_apiToken)) return "Cloudflare API Token is required.";
            if (string.IsNullOrWhiteSpace(_workerName)) return "Cloudflare Worker Name is required.";

            if (_htmlHandling != null && !HtmlHandlingValues.Contains(_htmlHandling))
            {
                return $"Invalid HTML Handling '{_htmlHandling}'. Use one of: {string.Join(", ", HtmlHandlingValues)}, or leave it blank.";
            }

            if (_notFoundHandling != null && !NotFoundHandlingValues.Contains(_notFoundHandling))
            {
                return $"Invalid Not Found Handling '{_notFoundHandling}'. Use one of: {string.Join(", ", NotFoundHandlingValues)}, or leave it blank.";
            }

            if (string.IsNullOrWhiteSpace(folderPath) || !Directory.Exists(folderPath))
            {
                return $"Generated site folder does not exist: '{folderPath}'.";
            }

            return null;
        }

        private string ScriptUrl => $"{_apiBaseUrl}/accounts/{Uri.EscapeDataString(_accountId)}/workers/scripts/{Uri.EscapeDataString(_workerName)}";

        private async Task<string> UploadAssetsAsync(List<PreparedAsset> assets)
        {
            // The manifest lists every file, unchanged ones included; Cloudflare replies with buckets of
            // only the hashes it doesn't already have.
            var manifest = assets.ToDictionary(
                a => a.RelativePath,
                a => new ManifestEntry { Hash = a.Hash, Size = a.FileSizeBytes },
                StringComparer.Ordinal);

            var sessionBody = await SendAsync(
                () => JsonRequest(HttpMethod.Post, $"{ScriptUrl}/assets-upload-session", new { manifest }, _apiToken),
                "starting the Cloudflare Workers asset upload session");

            var session = JsonSerializer.Deserialize<CloudflareApiResponse<UploadSessionResult>>(sessionBody)?.Result;
            if (string.IsNullOrWhiteSpace(session?.Jwt))
            {
                throw new XStaticException("The Cloudflare Workers asset upload session response did not contain a JWT.");
            }

            var buckets = session.Buckets?.Where(b => b != null && b.Count > 0).ToList() ?? new List<List<string>>();
            if (buckets.Count == 0)
            {
                // Everything is already uploaded, so the session JWT is the completion token.
                return session.Jwt;
            }

            var assetsByHash = assets
                .GroupBy(a => a.Hash, StringComparer.Ordinal)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.Ordinal);

            string completionJwt = null;
            foreach (var bucket in buckets)
            {
                var jwt = await UploadBucketAsync(session.Jwt, bucket, assetsByHash);
                completionJwt = string.IsNullOrWhiteSpace(jwt) ? completionJwt : jwt;
            }

            if (string.IsNullOrWhiteSpace(completionJwt))
            {
                throw new XStaticException("Cloudflare did not return a completion token after the asset upload.");
            }

            return completionJwt;
        }

        private async Task<string> UploadBucketAsync(string uploadJwt, List<string> bucket, Dictionary<string, PreparedAsset> assetsByHash)
        {
            // Read the bucket's files once; the request factory may run again on a transient retry.
            var parts = new List<(string Hash, byte[] Base64, string ContentType)>();
            foreach (var hash in bucket)
            {
                if (!assetsByHash.TryGetValue(hash, out var asset))
                {
                    throw new XStaticException($"Cloudflare asked for an asset with hash '{hash}' that isn't in the manifest.");
                }

                var base64 = Convert.ToBase64String(await File.ReadAllBytesAsync(asset.FullPath));
                parts.Add((hash, Encoding.ASCII.GetBytes(base64), asset.ContentType));
            }

            var body = await SendAsync(
                () =>
                {
                    var form = new MultipartFormDataContent();
                    foreach (var (hash, base64, contentType) in parts)
                    {
                        var content = new ByteArrayContent(base64);
                        content.Headers.ContentType = MediaTypeHeaderValue.TryParse(contentType, out var parsed)
                            ? parsed
                            : new MediaTypeHeaderValue("application/null");
                        form.Add(content, hash, hash);
                    }

                    var request = new HttpRequestMessage(HttpMethod.Post, $"{_apiBaseUrl}/accounts/{Uri.EscapeDataString(_accountId)}/workers/assets/upload?base64=true")
                    {
                        Content = form
                    };
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", uploadJwt);
                    return request;
                },
                "uploading assets to Cloudflare Workers");

            // Only the final bucket's response carries the completion token.
            return JsonSerializer.Deserialize<CloudflareApiResponse<UploadSessionResult>>(body)?.Result?.Jwt;
        }

        private async Task UploadWorkerAsync(string completionJwt, string headers, string redirects)
        {
            var config = new Dictionary<string, string>();
            if (_htmlHandling != null) config["html_handling"] = _htmlHandling;
            if (_notFoundHandling != null) config["not_found_handling"] = _notFoundHandling;
            if (headers != null) config["_headers"] = headers;
            if (redirects != null) config["_redirects"] = redirects;

            // An assets-only Worker: the metadata part is the whole upload, with no main_module or script part.
            var metadata = JsonSerializer.Serialize(new WorkerMetadata
            {
                Assets = new WorkerAssets { Jwt = completionJwt, Config = config.Count > 0 ? config : null },
                CompatibilityDate = _compatibilityDate
            }, MetadataJsonOptions);

            await SendAsync(
                () =>
                {
                    var form = new MultipartFormDataContent
                    {
                        { new StringContent(metadata, Encoding.UTF8, "application/json"), "metadata" }
                    };

                    var request = new HttpRequestMessage(HttpMethod.Put, $"{ScriptUrl}?excludeScript=true") { Content = form };
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiToken);
                    return request;
                },
                "uploading the Cloudflare Worker");
        }

        private async Task<string> EnableWorkersDevAsync()
        {
            await SendAsync(
                () => JsonRequest(HttpMethod.Post, $"{ScriptUrl}/subdomain", new { enabled = true }, _apiToken),
                "turning on the workers.dev URL");

            try
            {
                var body = await SendAsync(
                    () => JsonRequest(HttpMethod.Get, $"{_apiBaseUrl}/accounts/{Uri.EscapeDataString(_accountId)}/workers/subdomain", null, _apiToken),
                    "reading the account's workers.dev subdomain");

                var subdomain = JsonSerializer.Deserialize<CloudflareApiResponse<AccountSubdomainResult>>(body)?.Result?.Subdomain;
                return string.IsNullOrWhiteSpace(subdomain) ? null : $"https://{_workerName}.{subdomain}.workers.dev";
            }
            catch (XStaticException)
            {
                // The URL is only for the result message; a token without read access shouldn't fail the deploy.
                return null;
            }
        }

        private static HttpRequestMessage JsonRequest(HttpMethod method, string url, object payload, string bearer)
        {
            var request = new HttpRequestMessage(method, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", bearer);
            if (payload != null)
            {
                request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            }

            return request;
        }

        private async Task<string> SendAsync(Func<HttpRequestMessage> requestFactory, string operation)
        {
            for (var attempt = 0; ; attempt++)
            {
                using var request = requestFactory();
                using var response = await _httpClient.SendAsync(request);
                var body = await response.Content.ReadAsStringAsync();
                var code = (int)response.StatusCode;

                if ((code == 429 || code >= 500) && attempt < MaxTransientRetries - 1)
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(500 * (attempt + 1)));
                    continue;
                }

                EnsureSuccess(response.StatusCode, body, operation);
                return body;
            }
        }

        private static void EnsureSuccess(HttpStatusCode statusCode, string body, string operation)
        {
            if ((int)statusCode < 200 || (int)statusCode >= 300)
            {
                throw new XStaticException($"Cloudflare API error while {operation} (HTTP {(int)statusCode}): {body}");
            }

            if (string.IsNullOrWhiteSpace(body)) return;

            try
            {
                using var doc = JsonDocument.Parse(body);
                if (doc.RootElement.ValueKind == JsonValueKind.Object &&
                    doc.RootElement.TryGetProperty("success", out var success) &&
                    success.ValueKind == JsonValueKind.False)
                {
                    throw new XStaticException($"Cloudflare API reported failure while {operation}: {body}");
                }
            }
            catch (JsonException)
            {
                // A non-JSON 2xx body is treated as success.
            }
        }

        private static string Get(Dictionary<string, string> parameters, string key)
        {
            return parameters.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value) ? value.Trim() : null;
        }

        private static bool ParseToggle(string value)
        {
            return value != null && (value.Equals("true", StringComparison.OrdinalIgnoreCase) || value == "1");
        }

        protected sealed record PreparedAsset(string FullPath, string RelativePath, string Hash, string ContentType, long FileSizeBytes);

        private sealed class ManifestEntry
        {
            [JsonPropertyName("hash")]
            public string Hash { get; set; }

            [JsonPropertyName("size")]
            public long Size { get; set; }
        }

        private sealed class CloudflareApiResponse<T>
        {
            [JsonPropertyName("result")]
            public T Result { get; set; }
        }

        private sealed class UploadSessionResult
        {
            [JsonPropertyName("jwt")]
            public string Jwt { get; set; }

            [JsonPropertyName("buckets")]
            public List<List<string>> Buckets { get; set; }
        }

        private sealed class AccountSubdomainResult
        {
            [JsonPropertyName("subdomain")]
            public string Subdomain { get; set; }
        }

        private sealed class WorkerMetadata
        {
            [JsonPropertyName("assets")]
            public WorkerAssets Assets { get; set; }

            [JsonPropertyName("compatibility_date")]
            public string CompatibilityDate { get; set; }
        }

        private sealed class WorkerAssets
        {
            [JsonPropertyName("jwt")]
            public string Jwt { get; set; }

            [JsonPropertyName("config")]
            public Dictionary<string, string> Config { get; set; }
        }
    }
}
