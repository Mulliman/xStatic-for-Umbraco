using System;
using System.Text.RegularExpressions;
using Umbraco.Cms.Core;
using Umbraco.Cms.Core.Web;
using Umbraco.Extensions;

namespace XStatic.Core.Generator.Transformers
{
    public class UmbracoContentUdiToJsonUrlTransformer : ITransformer
    {
        private IUmbracoContext _context;

        public string Transform(string input, IUmbracoContext context)
        {
            if (string.IsNullOrEmpty(input))
            {
                return input;
            }

            _context = context;

            var regex = new Regex("umb://document/[a-f0-9]{32}");
            var output = regex.Replace(input, new MatchEvaluator(ComputeReplacement));
            return output;
        }

        public string ComputeReplacement(Match matchResult)
        {
            var uri = new Uri(matchResult.Value);

            var item = _context.Content.GetById(Udi.Create(uri));

            return item.Url().Trim("/") + ".json";
        }
    }
}
