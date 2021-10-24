using System.IO;
using System.Threading.Tasks;

namespace XStatic.Core.Generator.Storage
{
    public interface IStaticSiteStorer
    {
        string GetStorageLocationOfSite(int staticSiteId);

        Task<string> StoreSiteItem(string staticSiteId, string path, string contents, System.Text.Encoding encoding);

        Task<string> CopyFile(string subFolder, string sourcePath, string partialDestinationPath);

        Task<string> SaveFile(string subFolder, Stream stream, string partialDestinationPath);

        Task DeleteFile(string sourcePath);

        string GetFileDestinationPath(string subFolder, string partialDestinationPath);

        Task<string> MoveFile(string subFolder, string sourcePath, string partialDestinationPath);
    }
}