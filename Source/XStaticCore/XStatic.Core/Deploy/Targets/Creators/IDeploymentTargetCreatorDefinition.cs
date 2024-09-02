using System.Collections.Generic;

namespace XStatic.Core.Deploy.Targets.Creators
{
    public interface IDeploymentTargetCreatorDefinition
    {
        string Id { get; }

        string Name { get; }

        string Help { get; }

        IEnumerable<DeployerField> Fields { get; }
    }
}
