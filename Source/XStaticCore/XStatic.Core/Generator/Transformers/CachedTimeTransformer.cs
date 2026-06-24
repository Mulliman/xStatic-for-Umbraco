using System.Threading.Tasks;
using Umbraco.Cms.Core.Web;

namespace XStatic.Core.Generator.Transformers
{
    public class CachedTimeTransformer : ITransformer
    {
        public Task<string> Transform(string input, IUmbracoContext context)
        {
            if (string.IsNullOrEmpty(input))
            {
                return Task.FromResult(input);
            }

            return Task.FromResult(input.Replace("</body>", string.Format("<!-- Cached by xStatic at {0} --></body>", System.DateTime.Now)));
        }
    }
}
