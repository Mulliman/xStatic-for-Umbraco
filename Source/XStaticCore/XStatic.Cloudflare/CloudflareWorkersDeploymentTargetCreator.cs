using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using XStatic.Core;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets.Creators;
using XStatic.Core.Models;

namespace XStatic.Cloudflare
{
    /// <summary>
    /// Creates a new assets-only Cloudflare Worker by deploying a one-page placeholder to it, then returns a
    /// matching Cloudflare Workers deployment target. It refuses a Worker name that's already in use, so it
    /// never overwrites a live site.
    /// </summary>
    public class CloudflareWorkersDeploymentTargetCreator : IDeploymentTargetCreator
    {
        public const string PlaceholderHtml =
            "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Coming soon</title></head>" +
            "<body><p>This site is being set up with xStatic.</p></body></html>";

        private static readonly Regex ValidWorkerNameRegex = new Regex("^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$", RegexOptions.Compiled);

        private readonly Dictionary<string, string> _parameters;
        private readonly HttpClient _httpClient;
        private readonly bool _ownsHttpClient;
        private readonly string _apiBaseUrl;

        public CloudflareWorkersDeploymentTargetCreator(Dictionary<string, string> parameters)
            : this(parameters, null, CloudflarePagesDeployer.DefaultApiBaseUrl)
        {
        }

        public CloudflareWorkersDeploymentTargetCreator(
            Dictionary<string, string> parameters,
            HttpClient httpClient,
            string apiBaseUrl = CloudflarePagesDeployer.DefaultApiBaseUrl)
        {
            _parameters = parameters ?? throw new ArgumentNullException(nameof(parameters));
            _ownsHttpClient = httpClient == null;
            _httpClient = httpClient ?? new HttpClient { Timeout = TimeSpan.FromMinutes(2) };
            _apiBaseUrl = (apiBaseUrl ?? CloudflarePagesDeployer.DefaultApiBaseUrl).TrimEnd('/');
        }

        public async Task<DeploymentTargetUpdateModel> CreateTarget()
        {
            var accountId = Get(CloudflareWorkersDeploymentTargetCreatorDefinition.FieldNames.AccountId);
            var apiToken = Get(CloudflareWorkersDeploymentTargetCreatorDefinition.FieldNames.ApiToken);
            var workerName = Get(CloudflareWorkersDeploymentTargetCreatorDefinition.FieldNames.WorkerName);

            if (accountId == null) throw new XStaticException("Cloudflare Account ID is required.");
            if (apiToken == null) throw new XStaticException("Cloudflare API Token is required.");
            if (workerName == null) throw new XStaticException("Cloudflare Worker Name is required.");

            if (!ValidWorkerNameRegex.IsMatch(workerName))
            {
                throw new XStaticException(
                    $"Invalid Cloudflare Worker Name '{workerName}'. Worker names must be 1-63 lowercase letters, digits, or hyphens, and cannot start or end with a hyphen.");
            }

            var tempFolder = Path.Combine(Path.GetTempPath(), "xstatic-cf-worker-" + Guid.NewGuid().ToString("N"));

            try
            {
                await EnsureWorkerDoesNotExistAsync(accountId, apiToken, workerName);

                var fields = new Dictionary<string, string>
                {
                    { CloudflareWorkersDeployerDefinition.FieldNames.AccountId, accountId },
                    { CloudflareWorkersDeployerDefinition.FieldNames.ApiToken, apiToken },
                    { CloudflareWorkersDeployerDefinition.FieldNames.WorkerName, workerName },
                    { CloudflareWorkersDeployerDefinition.FieldNames.NotFoundHandling, "404-page" },
                    { CloudflareWorkersDeployerDefinition.FieldNames.EnableWorkersDev, "true" },
                    { CloudflareWorkersDeployerDefinition.FieldNames.EnableMarkdownHeaders, "false" }
                };

                Directory.CreateDirectory(tempFolder);
                await File.WriteAllTextAsync(Path.Combine(tempFolder, "index.html"), PlaceholderHtml);

                var deployer = new CloudflareWorkersDeployer(new Dictionary<string, string>(fields), _httpClient, _apiBaseUrl);
                var result = await deployer.DeployWholeSite(tempFolder);
                if (!result.WasSuccessful)
                {
                    throw new XStaticException($"Error creating the Cloudflare Worker '{workerName}': {result.Message} {result.Exception?.Message}".Trim());
                }

                return new DeploymentTargetUpdateModel
                {
                    Name = workerName,
                    DeployerDefinition = new CloudflareWorkersDeployerDefinition().Id,
                    Fields = fields
                };
            }
            catch (XStaticException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new XStaticException($"Error creating the Cloudflare Worker '{workerName}': {ex.Message}");
            }
            finally
            {
                if (Directory.Exists(tempFolder))
                {
                    Directory.Delete(tempFolder, recursive: true);
                }

                if (_ownsHttpClient)
                {
                    _httpClient.Dispose();
                }
            }
        }

        private async Task EnsureWorkerDoesNotExistAsync(string accountId, string apiToken, string workerName)
        {
            var url = $"{_apiBaseUrl}/accounts/{Uri.EscapeDataString(accountId)}/workers/scripts/{Uri.EscapeDataString(workerName)}/settings";
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiToken);

            using var response = await _httpClient.SendAsync(request);
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return;
            }

            if (response.IsSuccessStatusCode)
            {
                throw new XStaticException(
                    $"A Cloudflare Worker named '{workerName}' already exists. Choose another name, or configure a Cloudflare Workers deployment target by hand to deploy to the existing Worker.");
            }

            var body = await response.Content.ReadAsStringAsync();
            throw new XStaticException($"Error checking for the Cloudflare Worker '{workerName}' (HTTP {(int)response.StatusCode}): {body}");
        }

        private string Get(string key)
        {
            return _parameters.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value) ? value.Trim() : null;
        }
    }

    public class CloudflareWorkersDeploymentTargetCreatorDefinition : IDeploymentTargetCreatorDefinition
    {
        public class FieldNames
        {
            public const string AccountId = "CloudflareWorkersCreator.AccountId";
            public const string ApiToken = "CloudflareWorkersCreator.ApiToken";
            public const string WorkerName = "CloudflareWorkersCreator.WorkerName";
        }

        public string Id => "cloudflare-workers-creator";

        public string Name => "Cloudflare Workers Creator";

        public string Help =>
            "Creates a new Cloudflare Worker for static assets, deploys a placeholder page to its workers.dev URL, and configures a matching xStatic Deployment Target. " +
            "You will need your Cloudflare Account ID and an API Token with <strong>Workers Scripts: Edit</strong> permission.";

        public IEnumerable<DeployerField> Fields => new[]
        {
            new DeployerField { Alias = FieldNames.AccountId, Name = "Account ID *", EditorUiAlias = UIEditors.Text, Help = "Your 32-character Cloudflare Account ID (from the dashboard URL or Workers & Pages overview)." },
            new DeployerField { Alias = FieldNames.ApiToken, Name = "API Token *", EditorUiAlias = UIEditors.Password, Help = "Cloudflare API Token with Account -> Workers Scripts: Edit permission." },
            new DeployerField { Alias = FieldNames.WorkerName, Name = "Worker Name *", EditorUiAlias = UIEditors.Text, Help = "1-63 lowercase letters, digits, or hyphens (cannot start or end with a hyphen; e.g. 'my-umbraco-site'). It must not already exist." }
        };
    }
}
