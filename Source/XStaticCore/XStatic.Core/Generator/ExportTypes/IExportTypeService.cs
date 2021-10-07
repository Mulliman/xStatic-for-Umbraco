using System.Collections.Generic;
using XStatic.Generator.Transformers;

namespace XStatic.Generator
{
    public interface IExportTypeService
    {
        void AddExportType(IExportType exportType);

        IEnumerable<IExportTypeDetails> GetExportTypes();

        IGenerator GetGenerator(string exportFormatId);

        ITransformerListFactory GetTransformerListFactory(string exportFormatId);
    }
}