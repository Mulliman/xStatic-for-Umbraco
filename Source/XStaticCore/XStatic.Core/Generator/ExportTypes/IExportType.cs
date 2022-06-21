using XStatic.Core.Generator.Storage;
using XStatic.Core.Generator.Transformers;

namespace XStatic.Core.Generator.ExportTypes
{
    public interface IExportType : IExportTypeDetails
    {
        public ITransformerListFactory TransformerFactory { get; set; }

        public IGenerator Generator { get; set; }

        public IFileNameGenerator FileNameGenerator { get; set; }
    }

    public interface IExportTypeFields : IExportTypeDetails
    {
        string TransformerFactory { get; set; }

        string Generator { get; set; }

        string FileNameGenerator { get; set; }
    }

    public interface IExportTypeDetails
    {
        public int Id { get; set; }

        public string Name { get; set; }
    }
}