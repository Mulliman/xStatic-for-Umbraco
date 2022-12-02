using System;
using System.Collections.Generic;

namespace XStatic.Core.Deploy
{
    public class FileSystemAutoInstaller : IDeployerAutoInstaller
    {
        public IDeployerDefinition Definition => new FileSystemDeployerDefinition();

        public Func<Dictionary<string, string>, IDeployer> Constructor => (x) => new FileSystemDeployer(x);
    }
}