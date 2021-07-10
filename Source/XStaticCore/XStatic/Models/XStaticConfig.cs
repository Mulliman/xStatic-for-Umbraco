using System.Collections.Generic;
using XStatic.Deploy;
using XStatic.Generator;

namespace XStatic.Models
{
    public class XStaticConfig
    {
        public IEnumerable<IDeployerDefinition> Deployers { get; set; }
        public IEnumerable<ExportTypeModel> ExportTypes { get; set; }
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