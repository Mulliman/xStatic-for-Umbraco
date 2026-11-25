using System.Collections.Generic;
using XStatic.Core.Deploy;

namespace XStatic.Cloudflare
{
    public class CloudflareWorkersDeployerDefinition : IDeployerDefinition
    {
        public class FieldNames
        {
            public const string AccountId = "CloudflareWorkers.AccountId";
            public const string ApiToken = "CloudflareWorkers.ApiToken";
            public const string WorkerName = "CloudflareWorkers.WorkerName";
            public const string HtmlHandling = "CloudflareWorkers.HtmlHandling";
            public const string NotFoundHandling = "CloudflareWorkers.NotFoundHandling";
            public const string CompatibilityDate = "CloudflareWorkers.CompatibilityDate";
            public const string EnableWorkersDev = "CloudflareWorkers.EnableWorkersDev";
            public const string EnableMarkdownHeaders = "CloudflareWorkers.EnableMarkdownHeaders";
        }

        public string Id => CloudflareWorkersDeployer.DeployerKey;

        public string Name => "Cloudflare Workers";

        public string Help =>
            "Deploys your generated static site to Cloudflare Workers as static assets, which Cloudflare recommends over Pages for new sites. " +
            "Create an API Token with <strong>Workers Scripts: Edit</strong> permission at " +
            "<a target='_blank' href='https://dash.cloudflare.com/profile/api-tokens'>dash.cloudflare.com/profile/api-tokens</a>, " +
            "and copy your Account ID from the Cloudflare dashboard. The Worker is created on the first deploy if it doesn't exist. " +
            "Any <code>_headers</code> and <code>_redirects</code> files in the generated site are applied.";

        public IEnumerable<DeployerField> Fields => new[]
        {
            new DeployerField { Alias = FieldNames.AccountId, Name = "Account ID *", EditorUiAlias = UIEditors.Text, Help = "Your 32-character Cloudflare Account ID (from the dashboard URL or Workers & Pages overview)." },
            new DeployerField { Alias = FieldNames.ApiToken, Name = "API Token *", EditorUiAlias = UIEditors.Password, Help = "Cloudflare API Token with Account -> Workers Scripts: Edit permission." },
            new DeployerField { Alias = FieldNames.WorkerName, Name = "Worker Name *", EditorUiAlias = UIEditors.Text, Help = "The Worker to deploy to (lowercase letters, digits and hyphens, e.g. 'my-umbraco-site'). It's created if it doesn't exist, and it replaces whatever that Worker currently serves." },
            new DeployerField { Alias = FieldNames.HtmlHandling, Name = "HTML Handling (optional)", EditorUiAlias = UIEditors.Text, Help = "How Cloudflare maps URLs to .html files: auto-trailing-slash (Cloudflare's default), force-trailing-slash, drop-trailing-slash or none." },
            new DeployerField { Alias = FieldNames.NotFoundHandling, Name = "Not Found Handling (optional)", EditorUiAlias = UIEditors.Text, Value = "404-page", Help = "What a request that matches no file gets: 404-page (the nearest 404.html, with a 404 status), single-page-application (index.html with a 200 status) or none (Cloudflare's default, an empty 404)." },
            new DeployerField { Alias = FieldNames.CompatibilityDate, Name = "Compatibility Date (optional)", EditorUiAlias = UIEditors.Text, Help = "A Workers compatibility date such as 2025-09-01. Leave it blank to let Cloudflare choose." },
            new DeployerField { Alias = FieldNames.EnableWorkersDev, Name = "Enable workers.dev URL", EditorUiAlias = UIEditors.Toggle, Value = "true", Help = "Turns on the Worker's https://<worker>.<subdomain>.workers.dev URL after each deploy. Switch it off if you only serve the site on a custom domain." },
            new DeployerField { Alias = FieldNames.EnableMarkdownHeaders, Name = "Generate AI/Markdown _headers", EditorUiAlias = UIEditors.Toggle, Help = "When enabled and no _headers file exists, adds Vary: Accept and text/markdown Content-Type rules for Markdown for Agents." }
        };
    }
}
