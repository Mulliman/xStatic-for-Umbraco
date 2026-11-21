using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using XStatic.Core;
using XStatic.Core.Deploy;

namespace XStatic.Cloudflare
{
    public class CloudflareR2Deployer : IDeployer
    {
        public const string DeployerKey = "cloudflare-r2";

        private readonly string _accountId;
        private readonly string _bucketName;
        private readonly string _accessKeyId;
        private readonly string _secretAccessKey;
        private readonly string _keyPrefix;
        private readonly string _endpointOverride;
        private readonly HttpClient _httpClient;
        private readonly bool _ownsHttpClient;
        private readonly Func<DateTimeOffset> _clock;

        public CloudflareR2Deployer(Dictionary<string, string> parameters)
            : this(parameters, null, null)
        {
        }

        public CloudflareR2Deployer(
            Dictionary<string, string> parameters,
            HttpClient httpClient,
            Func<DateTimeOffset> clock = null)
        {
            if (parameters == null) throw new ArgumentNullException(nameof(parameters));

            parameters.TryGetValue(CloudflareR2DeployerDefinition.FieldNames.AccountId, out _accountId);
            parameters.TryGetValue(CloudflareR2DeployerDefinition.FieldNames.BucketName, out _bucketName);
            parameters.TryGetValue(CloudflareR2DeployerDefinition.FieldNames.AccessKeyId, out _accessKeyId);
            parameters.TryGetValue(CloudflareR2DeployerDefinition.FieldNames.SecretAccessKey, out _secretAccessKey);
            parameters.TryGetValue(CloudflareR2DeployerDefinition.FieldNames.KeyPrefix, out _keyPrefix);
            parameters.TryGetValue(CloudflareR2DeployerDefinition.FieldNames.EndpointOverride, out _endpointOverride);

            _ownsHttpClient = httpClient == null;
            _httpClient = httpClient ?? new HttpClient();
            _clock = clock ?? (() => DateTimeOffset.UtcNow);
        }

        public virtual async Task<XStaticResult> DeployWholeSite(string folderPath)
        {
            if (string.IsNullOrWhiteSpace(_accountId) && string.IsNullOrWhiteSpace(_endpointOverride))
            {
                return XStaticResult.Error("Cloudflare Account ID (or Endpoint URL Override) is required.");
            }

            if (string.IsNullOrWhiteSpace(_bucketName))
            {
                return XStaticResult.Error("Cloudflare R2 Bucket Name is required.");
            }

            if (string.IsNullOrWhiteSpace(_accessKeyId) || string.IsNullOrWhiteSpace(_secretAccessKey))
            {
                return XStaticResult.Error("Cloudflare R2 Access Key ID and Secret Access Key are required.");
            }

            if (string.IsNullOrWhiteSpace(folderPath) || !Directory.Exists(folderPath))
            {
                return XStaticResult.Error($"Generated site folder does not exist: '{folderPath}'.");
            }

            try
            {
                var endpoint = string.IsNullOrWhiteSpace(_endpointOverride)
                    ? $"https://{_accountId.Trim()}.r2.cloudflarestorage.com"
                    : _endpointOverride.Trim().TrimEnd('/');

                var normalizedPrefix = NormalizePrefix(_keyPrefix);
                var fullRoot = Path.GetFullPath(folderPath);
                var files = Directory.EnumerateFiles(fullRoot, "*.*", SearchOption.AllDirectories).ToList();

                int uploadedCount = 0;

                foreach (var filePath in files)
                {
                    if (!File.Exists(filePath))
                    {
                        continue;
                    }

                    var relativePath = Path.GetRelativePath(fullRoot, filePath).Replace(Path.DirectorySeparatorChar, '/');
                    var objectKey = string.IsNullOrEmpty(normalizedPrefix)
                        ? relativePath
                        : $"{normalizedPrefix}/{relativePath}";

                    await UploadFileAsync(endpoint, objectKey, filePath);
                    uploadedCount++;
                }

                return XStaticResult.Success($"Successfully deployed {uploadedCount} file(s) to Cloudflare R2 bucket '{_bucketName}'.");
            }
            catch (Exception ex)
            {
                return XStaticResult.Error($"Error deploying site to Cloudflare R2 bucket '{_bucketName}'. The deployment was not completed.", ex);
            }
            finally
            {
                if (_ownsHttpClient)
                {
                    _httpClient.Dispose();
                }
            }
        }

        private async Task UploadFileAsync(string endpoint, string objectKey, string filePath)
        {
            var encodedKey = string.Join("/", objectKey.Split('/').Select(Uri.EscapeDataString));
            var requestUri = new Uri($"{endpoint}/{Uri.EscapeDataString(_bucketName.Trim())}/{encodedKey}");

            var payload = await File.ReadAllBytesAsync(filePath);
            var contentType = CloudflareMimeTypes.GetContentType(filePath);

            using var request = new HttpRequestMessage(HttpMethod.Put, requestUri);
            request.Content = new ByteArrayContent(payload);
            request.Content.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);

            AwsSigV4Signer.SignRequest(request, payload, _accessKeyId.Trim(), _secretAccessKey.Trim(), _clock());

            using var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var responseBody = await response.Content.ReadAsStringAsync();
                throw new XStaticException($"Failed to upload '{objectKey}' to Cloudflare R2 (HTTP {(int)response.StatusCode}): {responseBody}");
            }
        }

        private static string NormalizePrefix(string prefix)
        {
            if (string.IsNullOrWhiteSpace(prefix))
            {
                return string.Empty;
            }

            return prefix.Trim().Replace('\\', '/').Trim('/');
        }
    }
}
