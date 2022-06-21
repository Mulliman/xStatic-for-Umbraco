using System.Collections.Generic;
using System.Threading.Tasks;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace XStatic.Core.Generator
{
    public interface IGenerator
    {
        Task<string> GeneratePage(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null);

        Task<string> GenerateMedia(int id, int staticSiteId, IEnumerable<Crop> crops = null);

        Task<IEnumerable<string>> GenerateFolder(string folderPath, int staticSiteId);

        Task<string> GenerateFile(string filePath, int staticSiteId);
    }
}