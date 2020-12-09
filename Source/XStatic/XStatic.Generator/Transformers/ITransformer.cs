using Umbraco.Web;

namespace XStatic.Generator.Transformers
{
    public interface ITransformer
    {
        string Transform(string input, UmbracoContext context);
    }
}