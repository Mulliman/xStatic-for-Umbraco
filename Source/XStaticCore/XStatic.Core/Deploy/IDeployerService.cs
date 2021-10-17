using System.Collections.Generic;

namespace XStatic.Core.Deploy
{
    public interface IDeployerService
    {
        IDeployerDefinition GetDefinition(string id);

        IEnumerable<IDeployerDefinition> GetDefinitions();

        IDeployer GetDeployer(string deployerKey, Dictionary<string, string> properties);
    }
}
