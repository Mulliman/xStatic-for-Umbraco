using System.Collections.Generic;

namespace XStatic.Deploy
{
    public interface IDeployerFactory
    {
        IDeployer GetDeployer(string deployerKey, Dictionary<string, string> properties);
    }
}