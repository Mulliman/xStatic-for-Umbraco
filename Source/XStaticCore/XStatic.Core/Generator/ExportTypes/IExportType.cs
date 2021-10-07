using XStatic.Generator.Transformers;

namespace XStatic.Generator
{
    public interface IExportType : IExportTypeDetails
    {
        public ITransformerListFactory TransformerFactory { get; set; }

        public IGenerator Generator { get; set; }
    }

    public interface IExportTypeDetails
    {
        public string Id { get; set; }

        public string Name { get; set; }
    }
}