using System.Collections.Generic;
using XStatic.Core.Deploy;

namespace XStatic.Core.Models
{
    public class DeployerModel(IDeployerDefinition details)
    {
        public string Id { get; } = details.Id;

        public string Name { get; } = details.Name;

        public string Help { get; } = details.Help;

        public IEnumerable<DeployerField> Fields { get; } = details.Fields;
    }
}