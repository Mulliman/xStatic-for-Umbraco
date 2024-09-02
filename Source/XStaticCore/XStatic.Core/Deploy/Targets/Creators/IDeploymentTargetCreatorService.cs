using System.Collections.Generic;

namespace XStatic.Core.Deploy.Targets.Creators
{
    public interface IDeploymentTargetCreatorService
    {
        IDeploymentTargetCreatorDefinition GetDefinition(string id);

        IEnumerable<IDeploymentTargetCreatorDefinition> GetDefinitions();

        IDeploymentTargetCreator GetDeploymentTargetCreator(string deployerKey, Dictionary<string, string> properties);
    }
}
