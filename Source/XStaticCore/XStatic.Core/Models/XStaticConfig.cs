using System;
using System.Collections.Generic;
using System.Linq;
using XStatic.Core.Models;
using XStatic.Deploy;
using XStatic.Generator;

namespace XStatic.Models
{
    public class XStaticConfig
    {
        public IEnumerable<DeployerModel> Deployers { get; set; }

        public IEnumerable<ExportTypeModel> ExportTypes { get; set; }

        public List<TypeModel> Generators { get; set; }

        public List<TypeModel> TransformerFactories { get; set; }

        public List<TypeModel> FileNameGenerators { get; set; }
    }

    public class DeployerModel
    {
        public DeployerModel()
        {
        }

        public DeployerModel(IDeployerDefinition details)
        {
            Id = details.Id;
            Name = details.Name;
            Help = details.Help;
            Fields = details.Fields.ToDictionary(f => f, f => "");
        }

        public string Id { get; }

        public string Name { get; }

        public string Help { get; }

        public Dictionary<string, string> Fields { get; }
    }

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
            Generator = new Core.Models.TypeModel(details.Generator.GetType());
            TransformerFactory = new Core.Models.TypeModel(details.TransformerFactory.GetType());
            FileNameGenerator = new Core.Models.TypeModel(details.FileNameGenerator.GetType());
        }

        public ExportTypeModel(IExportTypeFields dataModel)
        {
            Id = dataModel.Id;
            Name = dataModel.Name;

            try
            {
                if(!string.IsNullOrWhiteSpace(dataModel.Generator))
                {
                    var generatorType = Type.GetType(dataModel.Generator);
                    Generator = new Core.Models.TypeModel(generatorType);
                }

                if (!string.IsNullOrWhiteSpace(dataModel.TransformerFactory))
                {
                    var transformerListFactory = Type.GetType(dataModel.TransformerFactory);
                    TransformerFactory = new Core.Models.TypeModel(transformerListFactory);
                }

                if (!string.IsNullOrWhiteSpace(dataModel.FileNameGenerator))
                {
                    var fileNameGenerator = Type.GetType(dataModel.FileNameGenerator);
                    FileNameGenerator = new Core.Models.TypeModel(fileNameGenerator);
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