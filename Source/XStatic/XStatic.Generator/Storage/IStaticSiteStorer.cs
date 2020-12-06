using System.Threading.Tasks;

namespace XStatic.Generator.Storage
{
    public interface IStaticSiteStorer
    {
        Task<string> StoreSiteItem(string staticSiteId, string path, string contents, System.Text.Encoding encoding);
    }
}