using System.Collections.Generic;
using System.Threading.Tasks;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace XStatic.Core.Generator
{
    public interface IGenerator
    {
        Task<GenerateItemResult> GeneratePage(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null);

        Task<GenerateItemResult> GenerateMedia(int id, int staticSiteId, IEnumerable<Crop> crops = null);

        Task<IEnumerable<GenerateItemResult>> GenerateFolder(string folderPath, int staticSiteId);

        Task<GenerateItemResult> GenerateFile(string filePath, int staticSiteId);
    }
}