namespace XStatic.Core.Models
{
    public class ExportTypeUpdateModel
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string TransformerFactory { get; set; }

        public string Generator { get; set; }

        public string FileNameGenerator { get; set; }
    }
}