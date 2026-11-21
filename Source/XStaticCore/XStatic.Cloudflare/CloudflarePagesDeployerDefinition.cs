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
            "Deploys your generated static site directly to Cloudflare Pages via the Direct Upload API. " +
            "Create an API Token with <strong>Cloudflare Pages: Edit</strong> permissions at " +
            "<a target='_blank' href='https://dash.cloudflare.com/profile/api-tokens'>dash.cloudflare.com/profile/api-tokens</a>, " +
            "and copy your Account ID from the Cloudflare dashboard. Optionally enable AI/Markdown headers to emit a <code>_headers</code> file supporting Markdown for Agents.";

        public IEnumerable<DeployerField> Fields => new[]
        {
            new DeployerField { Alias = FieldNames.AccountId, Name = "Account ID", EditorUiAlias = UIEditors.Text },
            new DeployerField { Alias = FieldNames.ApiToken, Name = "API Token", EditorUiAlias = UIEditors.Password },
            new DeployerField { Alias = FieldNames.ProjectName, Name = "Project Name", EditorUiAlias = UIEditors.Text },
            new DeployerField { Alias = FieldNames.Branch, Name = "Branch (optional)", EditorUiAlias = UIEditors.Text, Help = "Leave blank to deploy to the project's production branch, or specify a preview branch name." },
            new DeployerField { Alias = FieldNames.EnableMarkdownHeaders, Name = "Generate AI/Markdown _headers", EditorUiAlias = UIEditors.Toggle, Help = "When enabled and no _headers file exists, adds a _headers file with Vary: Accept and text/markdown Content-Type rules for Markdown for Agents." }
        };
    }
}
