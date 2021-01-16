using Umbraco.Web;

namespace XStatic.Generator.Transformers
{
    public class CachedTimeTransformer : ITransformer
    {
        public string Transform(string input, UmbracoContext context)
        {
            if(string.IsNullOrEmpty(input))
            {
                return input;
            }

            return input.Replace("</body>", string.Format("<!-- Cached by xStatic at {0} --></body>", System.DateTime.Now));
        }
    }
}
