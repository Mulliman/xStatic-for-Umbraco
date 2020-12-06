using System.Collections.Generic;
using System.Threading.Tasks;
using XStatic.Generator.Storage;
using XStatic.Generator.Transformers;

namespace XStatic.Generator
{
    public interface IGenerator
    {
        Task<string> GeneratePage(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null);

        Task<string> GenerateMedia(int id, int staticSiteId, IEnumerable<Crop> crops = null);

        Task<IEnumerable<string>> GenerateFolder(string folderPath, int staticSiteId);

        Task<string> GenerateFile(string filePath, int staticSiteId);
    }

    public interface IStaticHtmlSiteGenerator : IGenerator
    {
    }
}