using Umbraco.Cms.Core.Web;

namespace XStatic.Core.Generator.Transformers
{
    public interface ITransformer
    {
        string Transform(string input, IUmbracoContext context);
    }
}