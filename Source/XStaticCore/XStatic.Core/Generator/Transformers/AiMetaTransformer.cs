using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Umbraco.Cms.Core.Web;
using XStatic.Core.Services;

namespace XStatic.Core.Generator.Transformers
{
    public class AiMetaTransformer : ITransformer
    {
        private readonly IAiService _aiService;

        public AiMetaTransformer(IAiService aiService)
        {
            _aiService = aiService;
        }

        public async Task<string> Transform(string source, IUmbracoContext context)
        {
            if (string.IsNullOrEmpty(source))
            {
                return source;
            }

            // Simple check if meta description already exists
            var metaRegex = new Regex(@"<meta\s+name=[""']description[""']", RegexOptions.IgnoreCase);

            if (metaRegex.IsMatch(source))
            {
                // Description exists, do nothing
                return source;
            }

            // Generate description asynchronously
            var description = await _aiService.GenerateDescriptionAsync(source);

            if (string.IsNullOrEmpty(description))
            {
                return source;
            }

            // Inject into <head>
            var headRegex = new Regex(@"<head>", RegexOptions.IgnoreCase);
            var match = headRegex.Match(source);

            if (match.Success)
            {
                var metaTag = $"\n\t<meta name=\"description\" content=\"{description}\" />";
                return source.Insert(match.Index + match.Length, metaTag);
            }

            return source;
        }
    }
}
