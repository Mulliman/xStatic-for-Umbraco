using System.Collections.Generic;
using System.Linq;
using XStatic.Deploy;
using XStatic.Generator;

namespace XStatic.Models
{
    public class XStaticConfig
    {
        public IEnumerable<DeployerModel> Deployers { get; set; }
        public IEnumerable<ExportTypeModel> ExportTypes { get; set; }
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

        public string Id { get; set; }

        public string Name { get; set; }
    }
}