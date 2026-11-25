using System.Collections.Generic;
using XStatic.Core.Deploy;

namespace XStatic.Cloudflare
{
    public class CloudflarePagesDeployerDefinition : IDeployerDefinition
    {
        public class FieldNames
        {
            public const string AccountId = "CloudflarePages.AccountId";
            public const string ApiToken = "CloudflarePages.ApiToken";
            public const string ProjectName = "CloudflarePages.ProjectName";
            public const string Branch = "CloudflarePages.Branch";
            public const string EnableMarkdownHeaders = "CloudflarePages.EnableMarkdownHeaders";
        }

        public string Id => CloudflarePagesDeployer.DeployerKey;

        public string Name => "Cloudflare Pages";

        public string Help =>
            "Deploys your generated static site directly to an existing Cloudflare Pages project via the Direct Upload API. " +
            "For a new site, use the <strong>Cloudflare Workers</strong> deployer instead: Cloudflare now recommends Workers static assets over Pages. " +
            "Create an API Token with <strong>Cloudflare Pages: Edit</strong> permissions at " +
            "<a target='_blank' href='https://dash.cloudflare.com/profile/api-tokens'>dash.cloudflare.com/profile/api-tokens</a>, " +
            "and copy your Account ID from the Cloudflare dashboard. Optionally enable AI/Markdown headers to emit a <code>_headers</code> file supporting Markdown for Agents.";

        public IEnumerable<DeployerField> Fields => new[]
        {
            new DeployerField { Alias = FieldNames.AccountId, Name = "Account ID *", EditorUiAlias = UIEditors.Text, Help = "Your 32-character Cloudflare Account ID (from the dashboard URL or Workers & Pages overview)." },
            new DeployerField { Alias = FieldNames.ApiToken, Name = "API Token *", EditorUiAlias = UIEditors.Password, Help = "Cloudflare API Token with Account -> Cloudflare Pages: Edit permission." },
            new DeployerField { Alias = FieldNames.ProjectName, Name = "Project Name *", EditorUiAlias = UIEditors.Text, Help = "Existing Cloudflare Pages Direct Upload project name (lowercase letters, digits, and hyphens)." },
            new DeployerField { Alias = FieldNames.Branch, Name = "Branch (optional)", EditorUiAlias = UIEditors.Text, Help = "Leave blank to deploy to the project's production branch, or specify a preview branch name." },
            new DeployerField { Alias = FieldNames.EnableMarkdownHeaders, Name = "Generate AI/Markdown _headers", EditorUiAlias = UIEditors.Toggle, Help = "When enabled and no _headers file exists, adds a _headers file with Vary: Accept and text/markdown Content-Type rules for Markdown for Agents." }
        };
    }
}
