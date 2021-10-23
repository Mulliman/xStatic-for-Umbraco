using System.Collections.Generic;

namespace XStatic.Core.Models
{
    public class XStaticConfig
    {
        public IEnumerable<DeployerModel> Deployers { get; set; }

        public IEnumerable<ExportTypeModel> ExportTypes { get; set; }

        public List<TypeModel> Generators { get; set; }

        public List<TypeModel> TransformerFactories { get; set; }

        public List<TypeModel> FileNameGenerators { get; set; }

        public List<TypeModel> PostGenerationActions { get; set; }
    }
}