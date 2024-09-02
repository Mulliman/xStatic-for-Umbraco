using System.Collections.Generic;
using XStatic.Core.Deploy;
using XStatic.Core.Deploy.Targets.Creators;

namespace XStatic.Core.Models
{
    public class DeploymentTargetCreatorModel(IDeploymentTargetCreatorDefinition details)
    {
        public string Id { get; } = details.Id;

        public string Name { get; } = details.Name;

        public string Help { get; } = details.Help;

        public IEnumerable<DeployerField> Fields { get; } = details.Fields;
    }
}