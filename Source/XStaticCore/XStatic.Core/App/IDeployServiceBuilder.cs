using System;
using System.Collections.Generic;
using XStatic.Core.Deploy;

namespace XStatic.Core.App
{
    public interface IDeployServiceBuilder
    {
        IDeployServiceBuilder AddDeployer(IDeployerDefinition definition, Func<Dictionary<string, string>, IDeployer> deployer);

        void Build();
    }
}