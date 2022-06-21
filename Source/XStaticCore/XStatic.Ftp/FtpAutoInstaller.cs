using System;
using System.Collections.Generic;
using XStatic.Core.Deploy;

namespace XStatic.Ftp
{
    public class FtpAutoInstaller : IDeployerAutoInstaller
    {
        public IDeployerDefinition Definition => new FtpDeployerDefinition();

        public Func<Dictionary<string, string>, IDeployer> Constructor => (x) => new FtpDeployer(x);
    }
}