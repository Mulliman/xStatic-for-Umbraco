using System.Text.RegularExpressions;
using Umbraco.Core;
using Umbraco.Web;

namespace XStatic.Generator.Transformers
{
    public class UmbracoContentUdiToJsonUrlTransformer : ITransformer
    {
        private UmbracoContext _context;

        public string Transform(string input, UmbracoContext context)
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
            var uri = matchResult.Value;

            var item = _context.Content.GetById(Udi.Parse(uri));

            return item.Url().Trim("/") + ".json";
        }
    }
}
