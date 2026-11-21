using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using XStatic.Core;
using XStatic.Core.Actions.FileActions;
using XStatic.Core.Generator.Storage;

namespace XStatic.Cloudflare.Actions
{
    public class CloudflareHeadersFields
    {
        public const string CustomRules = "CustomRules";
        public const string IncludeMarkdownForAgents = "IncludeMarkdownForAgents";
    }

    [XStaticEditableField(CloudflareHeadersFields.IncludeMarkdownForAgents, UIEditors.Toggle)]
    [XStaticEditableField(CloudflareHeadersFields.CustomRules, UIEditors.TextArea)]
    public class CloudflareHeadersAction : PostGenerationActionBase
    {
        public const string HeadersFilePath = "/_headers";

        private readonly IStaticSiteStorer _staticSiteStorer;

        public override string Name => nameof(CloudflareHeadersAction);

        public CloudflareHeadersAction(IStaticSiteStorer staticSiteStorer)
        {
            _staticSiteStorer = staticSiteStorer;
        }

        public override async Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters)
        {
            var includeMarkdownRaw = GetParameter(parameters, CloudflareHeadersFields.IncludeMarkdownForAgents);
            var customRules = GetParameter(parameters, CloudflareHeadersFields.CustomRules);

            var includeMarkdown = string.Equals(includeMarkdownRaw, "true", StringComparison.OrdinalIgnoreCase) || includeMarkdownRaw == "1";

            var sb = new StringBuilder();

            if (includeMarkdown)
            {
                sb.AppendLine(CloudflarePagesDeployer.DefaultMarkdownHeadersContent.TrimEnd());
            }

            if (!string.IsNullOrWhiteSpace(customRules))
            {
                if (sb.Length > 0)
                {
                    sb.AppendLine();
                }

                sb.AppendLine(customRules.Trim());
            }

            if (sb.Length == 0)
            {
                return XStaticResult.Success("No Cloudflare _headers rules configured; skipped writing _headers.");
            }

            await _staticSiteStorer.StoreSiteItem(staticSiteId.ToString(), HeadersFilePath, sb.ToString(), new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));

            return XStaticResult.Success("Generated Cloudflare _headers file.");
        }
    }
}
