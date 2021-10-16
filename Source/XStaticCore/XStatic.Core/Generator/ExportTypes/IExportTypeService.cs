using System.Collections.Generic;
using XStatic.Generator.Storage;
using XStatic.Generator.Transformers;

namespace XStatic.Generator
{
    public interface IExportTypeService
    {
        IEnumerable<IExportTypeFields> GetExportTypes();

        IGenerator GetGenerator(int exportFormatId);

        ITransformerListFactory GetTransformerListFactory(int exportFormatId);

        IFileNameGenerator GetFileNameGenerator(int exportFormatId);
    }
}