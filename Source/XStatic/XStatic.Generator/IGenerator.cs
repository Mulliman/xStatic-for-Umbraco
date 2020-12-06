using System.Collections.Generic;
using System.Threading.Tasks;
using XStatic.Generator.Storage;
using XStatic.Generator.Transformers;

namespace XStatic.Generator
{
    public interface IGenerator
    {
        Task<string> Generate(int id, int staticSiteId, IFileNameGenerator fileNamer, IEnumerable<ITransformer> transformers = null);

        //Task<string> GenerateWithChildren(int id, int staticSiteId);
    }

    public interface IStaticHtmlSiteGenerator : IGenerator
    {
    }
}