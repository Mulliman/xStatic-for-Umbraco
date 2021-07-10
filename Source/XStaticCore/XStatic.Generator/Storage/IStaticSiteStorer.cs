using System.Threading.Tasks;
using System.IO;

namespace XStatic.Generator.Storage
{
    public interface IStaticSiteStorer
    {
        string GetStorageLocationOfSite(int staticSiteId);

        Task<string> StoreSiteItem(string staticSiteId, string path, string contents, System.Text.Encoding encoding);

        Task<string> CopyFile(string subFolder, string sourcePath, string partialDestinationPath);

        Task<string> SaveFile(string subFolder, Stream stream, string partialDestinationPath);

        string GetFileDestinationPath(string subFolder, string partialDestinationPath);
    }
}