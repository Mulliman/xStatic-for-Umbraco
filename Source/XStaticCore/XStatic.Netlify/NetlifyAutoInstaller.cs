using System;
using System.Collections.Generic;
using XStatic.Core.Deploy;
using XStatic.Deploy;

namespace XStatic.Netlify
{
    public class NetlifyAutoInstaller : IDeployerAutoInstaller
    {
        public IDeployerDefinition Definition => new NetlifyDeployerDefinition();

        public Func<Dictionary<string, string>, IDeployer> Constructor => (x) => new NetlifyDeployer(x);
    }
}