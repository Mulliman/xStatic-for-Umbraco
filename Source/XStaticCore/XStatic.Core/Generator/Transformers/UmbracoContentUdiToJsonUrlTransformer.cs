using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;

namespace XStatic.Core.Generator.Transformers
{
    public class UmbracoContentUdiToJsonUrlTransformer : ITransformer
    {
        public Task<string> Transform(string input, IUmbracoContext context)
        {
            if (string.IsNullOrEmpty(input))
            {
                return Task.FromResult(input);
            }

            var regex = new Regex("umb://document/[a-f0-9]{32}");
            var output = regex.Replace(input, (match) =>
            {
                // Unused in original, but kept for parity if needed, though likely can be removed.
                // var uri = new Uri(match.Value);

                if (UdiParser.TryParse(match.Value, out var udi) && udi is GuidUdi guidUdi)
                {
                    var item = context.Content.GetById(guidUdi.Guid);

                    if (item != null)
                    {
                        return item.Url().Trim("/") + ".json";
                    }
                }

                return match.Value;
            });

            return Task.FromResult(output);
        }
    }
}
