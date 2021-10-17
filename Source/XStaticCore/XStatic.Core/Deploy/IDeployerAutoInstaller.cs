using System;
using System.Collections.Generic;

namespace XStatic.Core.Deploy
{
    public interface IDeployerAutoInstaller
    {
        public IDeployerDefinition Definition { get; }

        public Func<Dictionary<string, string>, IDeployer> Constructor { get; }
    }
}