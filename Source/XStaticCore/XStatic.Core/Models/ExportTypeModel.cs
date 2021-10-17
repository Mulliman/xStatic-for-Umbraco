using System;
using XStatic.Core.Generator.ExportTypes;

namespace XStatic.Core.Models
{
    public class ExportTypeModel : IExportTypeDetails
    {
        public ExportTypeModel()
        {
        }

        public ExportTypeModel(IExportTypeDetails details)
        {
            Id = details.Id;
            Name = details.Name;
        }

        public ExportTypeModel(IExportType details)
        {
            Id = details.Id;
            Name = details.Name;
            Generator = new TypeModel(details.Generator.GetType());
            TransformerFactory = new TypeModel(details.TransformerFactory.GetType());
            FileNameGenerator = new TypeModel(details.FileNameGenerator.GetType());
        }

        public ExportTypeModel(IExportTypeFields dataModel)
        {
            Id = dataModel.Id;
            Name = dataModel.Name;

            try
            {
                if (!string.IsNullOrWhiteSpace(dataModel.Generator))
                {
                    var generatorType = Type.GetType(dataModel.Generator);
                    Generator = new TypeModel(generatorType);
                }

                if (!string.IsNullOrWhiteSpace(dataModel.TransformerFactory))
                {
                    var transformerListFactory = Type.GetType(dataModel.TransformerFactory);
                    TransformerFactory = new TypeModel(transformerListFactory);
                }

                if (!string.IsNullOrWhiteSpace(dataModel.FileNameGenerator))
                {
                    var fileNameGenerator = Type.GetType(dataModel.FileNameGenerator);
                    FileNameGenerator = new TypeModel(fileNameGenerator);
                }
            }
            catch (Exception e)
            {
                var hi = "";
                // Types must've changed since db updated.
                // Swallow for now until a good enough solution.
            }
        }

        public int Id { get; set; }

        public string Name { get; set; }

        public TypeModel Generator { get; set; }

        public TypeModel TransformerFactory { get; set; }

        public TypeModel FileNameGenerator { get; set; }
    }
}