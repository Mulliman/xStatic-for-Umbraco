using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using XStatic.Core;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets.Creators;
using XStatic.Core.Models;

namespace XStatic.Cloudflare
{
    public class CloudflarePagesDeploymentTargetCreator : IDeploymentTargetCreator
    {
        private static readonly Regex ValidProjectNameRegex = new Regex("^[a-z0-9](?:[a-z0-9-]{0,56}[a-z0-9])?$", RegexOptions.Compiled);

        private readonly Dictionary<string, string> _parameters;
        private readonly HttpClient _httpClient;
        private readonly bool _ownsHttpClient;
        private readonly string _apiBaseUrl;

        public CloudflarePagesDeploymentTargetCreator(Dictionary<string, string> parameters)
            : this(parameters, null, CloudflarePagesDeployer.DefaultApiBaseUrl)
        {
        }

        public CloudflarePagesDeploymentTargetCreator(
            Dictionary<string, string> parameters,
            HttpClient httpClient,
            string apiBaseUrl = CloudflarePagesDeployer.DefaultApiBaseUrl)
        {
            _parameters = parameters ?? throw new ArgumentNullException(nameof(parameters));
            _ownsHttpClient = httpClient == null;
            _httpClient = httpClient ?? new HttpClient();
            _apiBaseUrl = (apiBaseUrl ?? CloudflarePagesDeployer.DefaultApiBaseUrl).TrimEnd('/');
        }

        public async Task<DeploymentTargetUpdateModel> CreateTarget()
        {
            _parameters.TryGetValue(CloudflarePagesDeploymentTargetCreatorDefinition.FieldNames.AccountId, out var accountId);
            _parameters.TryGetValue(CloudflarePagesDeploymentTargetCreatorDefinition.FieldNames.ApiToken, out var apiToken);
            _parameters.TryGetValue(CloudflarePagesDeploymentTargetCreatorDefinition.FieldNames.ProjectName, out var projectName);
            _parameters.TryGetValue(CloudflarePagesDeploymentTargetCreatorDefinition.FieldNames.ProductionBranch, out var productionBranch);

            if (string.IsNullOrWhiteSpace(accountId))
            {
                throw new XStaticException("Cloudflare Account ID is required.");
            }

            if (string.IsNullOrWhiteSpace(apiToken))
            {
                throw new XStaticException("Cloudflare API Token is required.");
            }

            if (string.IsNullOrWhiteSpace(projectName))
            {
                throw new XStaticException("Cloudflare Pages Project Name is required.");
            }

            var trimmedProjectName = projectName.Trim();
            if (!ValidProjectNameRegex.IsMatch(trimmedProjectName))
            {
                throw new XStaticException(
                    $"Invalid Cloudflare Pages Project Name '{trimmedProjectName}'. Project names must be 1-58 lowercase letters, digits, or hyphens, and cannot start or end with a hyphen.");
            }

            var branch = string.IsNullOrWhiteSpace(productionBranch) ? "main" : productionBranch.Trim();

            try
            {
                var url = $"{_apiBaseUrl}/accounts/{Uri.EscapeDataString(accountId.Trim())}/pages/projects";
                using var request = new HttpRequestMessage(HttpMethod.Post, url);
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiToken);
                request.Content = new StringContent(
                    JsonSerializer.Serialize(new
                    {
                        name = trimmedProjectName,
                        production_branch = branch
                    }),
                    Encoding.UTF8,
                    "application/json");

                using var response = await _httpClient.SendAsync(request);
                var body = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    throw new XStaticException($"Error creating Cloudflare Pages project '{projectName}' (HTTP {(int)response.StatusCode}): {body}");
                }

                var parsed = JsonSerializer.Deserialize<CreateProjectResponse>(body);
                if (parsed?.Success == false)
                {
                    throw new XStaticException($"Error creating Cloudflare Pages project '{projectName}': {body}");
                }

                var createdName = parsed?.Result?.Name ?? projectName.Trim();

                return new DeploymentTargetUpdateModel
                {
                    Name = createdName,
                    DeployerDefinition = new CloudflarePagesDeployerDefinition().Id,
                    Fields = new Dictionary<string, string>
                    {
                        { CloudflarePagesDeployerDefinition.FieldNames.AccountId, accountId.Trim() },
                        { CloudflarePagesDeployerDefinition.FieldNames.ApiToken, apiToken },
                        { CloudflarePagesDeployerDefinition.FieldNames.ProjectName, createdName },
                        { CloudflarePagesDeployerDefinition.FieldNames.Branch, branch },
                        { CloudflarePagesDeployerDefinition.FieldNames.EnableMarkdownHeaders, "false" }
                    }
                };
            }
            catch (XStaticException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new XStaticException($"Error creating Cloudflare Pages project '{projectName}': {ex.Message}");
            }
            finally
            {
                if (_ownsHttpClient)
                {
                    _httpClient.Dispose();
                }
            }
        }

        private sealed class CreateProjectResponse
        {
            [JsonPropertyName("success")]
            public bool Success { get; set; }

            [JsonPropertyName("result")]
            public CreatedProject Result { get; set; }
        }

        private sealed class CreatedProject
        {
            [JsonPropertyName("name")]
            public string Name { get; set; }
        }
    }

    public class CloudflarePagesDeploymentTargetCreatorDefinition : IDeploymentTargetCreatorDefinition
    {
        public class FieldNames
        {
            public const string AccountId = "CloudflarePagesCreator.AccountId";
            public const string ApiToken = "CloudflarePagesCreator.ApiToken";
            public const string ProjectName = "CloudflarePagesCreator.ProjectName";
            public const string ProductionBranch = "CloudflarePagesCreator.ProductionBranch";
        }

        public string Id => "cloudflare-pages-project-creator";

        public string Name => "Cloudflare Pages Project Creator";

        public string Help =>
            "Creates a new Cloudflare Pages Direct Upload project and configures a matching xStatic Deployment Target automatically. " +
            "Cloudflare now recommends Workers for new sites, so consider the <strong>Cloudflare Workers Creator</strong> instead. " +
            "You will need your Cloudflare Account ID and an API Token with <strong>Cloudflare Pages: Edit</strong> permission.";

        public IEnumerable<DeployerField> Fields => new[]
        {
            new DeployerField { Alias = FieldNames.AccountId, Name = "Account ID *", EditorUiAlias = UIEditors.Text, Help = "Your 32-character Cloudflare Account ID (from the dashboard URL or Workers & Pages overview)." },
            new DeployerField { Alias = FieldNames.ApiToken, Name = "API Token *", EditorUiAlias = UIEditors.Password, Help = "Cloudflare API Token with Account -> Cloudflare Pages: Edit permission." },
            new DeployerField { Alias = FieldNames.ProjectName, Name = "Project Name *", EditorUiAlias = UIEditors.Text, Help = "1-58 lowercase letters, digits, or hyphens (cannot start or end with a hyphen; e.g. 'my-umbraco-site')." },
            new DeployerField { Alias = FieldNames.ProductionBranch, Name = "Production Branch", EditorUiAlias = UIEditors.Text, Value = "main", Help = "Defaults to 'main' if left blank." }
        };
    }
}
