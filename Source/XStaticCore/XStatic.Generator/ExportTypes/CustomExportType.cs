using XStatic.Generator.Transformers;

namespace XStatic.Generator.ExportTypes
{
    public class CustomExportType : IExportType
    {
        public string Id { get; set; }

        public string Name { get; set; }

        public ITransformerListFactory TransformerFactory { get; set; }

        public IGenerator Generator { get; set; }
    }
}