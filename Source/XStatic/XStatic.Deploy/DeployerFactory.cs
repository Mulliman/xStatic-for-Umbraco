using System;
using System.Collections.Generic;
using XStatic.Deploy.Git;

namespace XStatic.Deploy
{
    public class DeployerFactory : IDeployerFactory
    {
        public virtual IDeployer GetDeployer(string deployerKey, Dictionary<string,string> properties)
        {
            switch (deployerKey.ToLower())
            {
                case NetlifyDeployer.DeployerKey:
                    return new NetlifyDeployer(properties);

                case GitDeployer.DeployerKey:
                    return new GitDeployer(properties);

                default:
                    throw new Exception($"Deployer not found with key {deployerKey}.");
            }
        }
    }
}