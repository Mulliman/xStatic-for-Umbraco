using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using XStatic.Core;
using XStatic.Core.Actions.FileActions;
using XStatic.Core.Generator.Storage;

namespace XStatic.Cloudflare.Actions
{
    public class CloudflareRedirectsFields
    {
        public const string Rules = "Rules";
    }

    [XStaticEditableField(CloudflareRedirectsFields.Rules, UIEditors.TextArea)]
    public class CloudflareRedirectsAction : PostGenerationActionBase
    {
        public const string RedirectsFilePath = "/_redirects";

        private readonly IStaticSiteStorer _staticSiteStorer;

        public override string Name => nameof(CloudflareRedirectsAction);

        public CloudflareRedirectsAction(IStaticSiteStorer staticSiteStorer)
        {
            _staticSiteStorer = staticSiteStorer;
        }

        public override async Task<XStaticResult> RunAction(int staticSiteId, Dictionary<string, string> parameters)
        {
            var rules = GetParameter(parameters, CloudflareRedirectsFields.Rules);

            if (string.IsNullOrWhiteSpace(rules))
            {
                return XStaticResult.Success("No Cloudflare _redirects rules configured; skipped writing _redirects.");
            }

            await _staticSiteStorer.StoreSiteItem(staticSiteId.ToString(), RedirectsFilePath, rules.Trim() + "\n", new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));

            return XStaticResult.Success("Generated Cloudflare _redirects file.");
        }
    }
}
