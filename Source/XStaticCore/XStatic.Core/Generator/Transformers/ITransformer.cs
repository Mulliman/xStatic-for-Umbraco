using System.Threading.Tasks;
using Umbraco.Cms.Core.Web;

namespace XStatic.Core.Generator.Transformers
{
    public interface ITransformer
    {
        Task<string> Transform(string source, IUmbracoContext context);
    }
}
