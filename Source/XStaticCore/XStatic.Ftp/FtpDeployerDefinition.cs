using System.Collections.Generic;
using XStatic.Core.Deploy;

namespace XStatic.Ftp
{
    public class FtpDeployerDefinition : IDeployerDefinition
    {
        public string Id => FtpDeployer.DeployerKey;

        public string Name => "FTP";

        public string Help => "The remote FTP files will be mirrored to match the generated site.";

        public IEnumerable<string> Fields => new[]
        {
            "Hostname",
            "Username",
            "Password",
            "Folder",
            "Port"
        };
    }
}