using System.Collections.Generic;
using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace XStatic.Core.Generator.ExportTypes
{
    public interface IExportTypeService
    {
        IEnumerable<IExportTypeFields> GetExportTypes();

        IGenerator GetGenerator(int exportFormatId);

        ITransformerListFactory GetTransformerListFactory(int exportFormatId);

        IFileNameGenerator GetFileNameGenerator(int exportFormatId);
    }
}