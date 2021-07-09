using System;
using System.Collections.Generic;
using System.Text;

namespace XStatic.Deploy.Configuration
{
    public interface IDeployConfigurationBuilder
    {
        IDeployConfigurationBuilder AddDeployer(IDeployerDefinition definition, Func<Dictionary<string, string>, IDeployer> deployer);

        void Build();
    }
}