using XStatic.Generator;
using XStatic.Generator.Transformers;

namespace XStatic.Plugin.ExportType
{
    public interface IExportTypeSettings
    {
        IGenerator GetGenerator(string id);

        ITransformerListFactory GetTransformerListFactory(string id);
    }
}