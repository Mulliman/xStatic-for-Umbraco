using System;
using System.Collections.Generic;
using XStatic.Core.Deploy;

namespace XStatic.Git
{
    public class GitAutoInstaller : IDeployerAutoInstaller
    {
        public IDeployerDefinition Definition => new GitDeployerDefinition();

        public Func<Dictionary<string, string>, IDeployer> Constructor => (x) => new GitDeployer(x);
    }
}